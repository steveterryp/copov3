#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import * as puppeteer from 'puppeteer';
import { spawn } from 'child_process';

interface CaptureConfig {
  baseUrl: string;
  outputDir: string;
  auth: {
    adminUser: {
      email: string;
      password: string;
    };
    standardUser: {
      email: string;
      password: string;
    };
  };
  viewports: Array<{
    name: string;
    width: number;
    height: number;
  }>;
}

const DEFAULT_CONFIG: CaptureConfig = {
  baseUrl: 'http://localhost:3000',
  outputDir: 'navigation-captures',
  auth: {
    adminUser: {
      email: 'admin@example.com',
      password: 'admin123'
    },
    standardUser: {
      email: 'rika@example.com',
      password: 'Rikrik123!'
    }
  },
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
  ]
};

async function setupOutputDirectory(config: CaptureConfig) {
  const dirs = [
    config.outputDir,
    path.join(config.outputDir, 'screenshots'),
    path.join(config.outputDir, 'flows'),
    path.join(config.outputDir, 'patterns')
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function captureScreenshot(
  page: puppeteer.Page,
  name: string,
  viewport: CaptureConfig['viewports'][0],
  config: CaptureConfig
) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height
  });

  const screenshotPath = path.join(
    config.outputDir,
    'screenshots',
    `${name}_${viewport.name}.png`
  );

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  return screenshotPath;
}

async function login(
  page: puppeteer.Page,
  credentials: { email: string; password: string },
  config: CaptureConfig
) {
  // Go to login page
  await page.goto(`${config.baseUrl}/auth/login`);
  await page.waitForSelector('input[type="email"]');

  // Wait for form to be fully loaded
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    return form && emailInput && passwordInput && submitButton;
  });

  // Fill in credentials
  await page.type('input[type="email"]', credentials.email);
  await page.type('input[type="password"]', credentials.password);

  // Enable request/response logging
  page.on('request', request =>
    console.log('Request:', request.method(), request.url())
  );
  page.on('response', response =>
    console.log('Response:', response.status(), response.url())
  );

  // Submit form and wait for response
  console.log('Submitting login form...');
  // Log before waitForResponse
  console.log('Waiting for loginResponse...');
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      response =>
        response.url().includes('/api/auth/login') &&
        response.request().method() === 'POST',
      { timeout: 60000 }
    ),
    page.click('button[type="submit"]'),
    page.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout: 60000
    })
  ]);

  console.log('Login response received:', loginResponse.status());
  if (loginResponse.status() !== 200) {
    console.error('Login response status:', loginResponse.status()); // Added error log
    const responseBody = await loginResponse.text();
    console.error('Login response body:', responseBody); // Log response body
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }

  // Get auth token from response
  const loginData = await loginResponse.json();
  console.log('Login successful, got access token');

  // Set auth token in localStorage
  await page.evaluate((token) => {
    localStorage.setItem('auth', JSON.stringify({ accessToken: token }));
  }, loginData.accessToken);

  // Store the access token in a variable
  const accessToken = loginData.accessToken;
  
  // Set access token as a cookie (using the standard cookie name 'token') to support server-side auth checks
  await page.setCookie({
    name: 'token',
    value: loginData.accessToken,
    url: 'http://localhost',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
  });
  
  // Enable request interception to add Authorization header to all API requests, including /api/auth/me
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().startsWith(`${config.baseUrl}/api`)) {
      console.log('API Request Headers:', request.headers());
      const headers = {
        ...request.headers(),
        'authorization': `Bearer ${accessToken}`,
      };
      console.log('Modified API Request Headers:', headers);
      request.continue({ headers });
    } else {
      request.continue();
    }
  });

  // Wait for navigation and auth state
  console.log('Waiting for navigation...');
  await Promise.all([
    page.waitForNavigation({ timeout: 60000 }),
    page.waitForNetworkIdle({ timeout: 60000 })
  ]);

  // Verify auth state
  console.log('Verifying auth state...');
  const authResponse = await page.waitForResponse(
    response => response.url().includes('/api/auth/me'),
    { timeout: 60000 }
  );

  console.log('Auth response received:', authResponse.status());
  if (authResponse.status() !== 200) {
    throw new Error(`Auth verification failed: ${authResponse.status()}`);
  }

  console.log('Login complete');

  // Additional wait to ensure auth state is fully loaded
  await page.waitForNetworkIdle();
}

async function startDevServer(): Promise<{ process: any; ready: Promise<void> }> {
  return new Promise((resolve, reject) => {
    console.log('Spawning development server...');
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true,
      env: { ...process.env, FORCE_COLOR: 'true' }
    });

    // Add error handling
    serverProcess.on('error', (error) => {
      console.error('Failed to start development server:', error);
      reject(error);
    });

    // Add timeout
    const timeout = setTimeout(() => {
      console.error('Development server startup timed out');
      serverProcess.kill('SIGTERM');
      reject(new Error('Server startup timeout'));
    }, 60000); // 1 minute timeout

    const ready = new Promise<void>((resolveReady, rejectReady) => {
      let output = '';
      let isReady = false;

      serverProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('Server output:', chunk);

        // Check for ready message in various formats
        if (!isReady && (
          chunk.toLowerCase().includes('ready') ||
          chunk.includes('✓ Ready') ||
          chunk.includes('started server on')
        )) {
          isReady = true;
          clearTimeout(timeout);
          // Wait a bit after ready message to ensure full initialization
          setTimeout(() => resolveReady(), 1000);
        }
      });

      serverProcess.stdout?.on('error', (error) => {
        console.error('Server output error:', error);
        clearTimeout(timeout);
        rejectReady(error);
      });

      // Handle server process exit
      serverProcess.on('exit', (code) => {
        if (!isReady) {
          clearTimeout(timeout);
          rejectReady(new Error(`Server process exited with code ${code}`));
        }
      });
    });

    resolve({ process: serverProcess, ready });
  });
}

async function captureNavigationFlows(config: CaptureConfig) {
  let serverProcess: any;
  let browser: puppeteer.Browser | undefined;

  try {
    // Start the development server
    console.log('Starting development server...');
    const server = await startDevServer();
    serverProcess = server.process;
    await server.ready;
    console.log('Development server is ready');

    // Launch browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null
    });

    console.log('Setting up output directory...');
    await setupOutputDirectory(config);

    // Get routes from analysis
    const analysis = JSON.parse(
      await fs.readFile('navigation-analysis.json', 'utf-8')
    );

    // Deduplicate and group routes by auth requirement
    const uniqueRoutes = new Map<string, any>();
    for (const route of analysis.routes) {
      // Skip layout files if we have a page file for the same route
      if (route.component === 'layout.tsx' && uniqueRoutes.has(route.path)) {
        continue;
      }
      uniqueRoutes.set(route.path, route);
    }

    const routeGroups = {
      public: Array.from(uniqueRoutes.values())
        .filter(r => !r.auth && r.component === 'page.tsx'),
      authenticated: Array.from(uniqueRoutes.values())
        .filter(r => r.auth || (r.path.startsWith('/authenticated/') && r.component === 'page.tsx'))
    };

    // Login as admin first
    console.log('Logging in as admin...');
    const page = await browser.newPage();
    await login(page, config.auth.adminUser, config);
    await page.waitForNetworkIdle();

    // Capture all routes
    console.log('Capturing all routes...');
    const allRoutes = [...routeGroups.public, ...routeGroups.authenticated];
    for (const route of allRoutes) {
      console.log(`Capturing ${route.path}...`);
      try {
        await page.goto(`${config.baseUrl}${route.path}`);
        await page.waitForNetworkIdle();

        for (const viewport of config.viewports) {
          await captureScreenshot(
            page,
            route.path.replace(/\//g, '_'),
            viewport,
            config
          );
        }
      } catch (error) {
        console.error(`Error capturing ${route.path}:`, error);
      }
    }

    // Generate flow diagrams
    console.log('Generating flow diagrams...');
    const flows = [
      {
        name: 'auth_flow',
        description: 'Authentication Flow',
        routes: [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password'
        ]
      },
      {
        name: 'admin_flow',
        description: 'Admin Navigation Flow',
        routes: [
          '/admin',
          '/admin/users',
          '/admin/roles',
          '/admin/permissions',
          '/admin/audit'
        ]
      },
      {
        name: 'pov_flow',
        description: 'POV Management Flow',
        routes: [
          '/pov/list',
          '/pov/create',
          '/pov/:povId',
          '/pov/:povId/phases',
          '/pov/:povId/kpi',
          '/pov/:povId/launch'
        ]
      }
    ];

    for (const flow of flows) {
      const flowPath = path.join(config.outputDir, 'flows', `${flow.name}.md`);
      let flowContent = `# ${flow.description}\n\n`;
      flowContent += `## Routes\n\n`;

      for (const route of flow.routes) {
        flowContent += `### ${route}\n\n`;
        flowContent += `#### Screenshots\n\n`;

        for (const viewport of config.viewports) {
          const screenshots = [
            `public_${route.replace(/\//g, '_')}_${viewport.name}.png`,
            `admin_${route.replace(/\//g, '_')}_${viewport.name}.png`,
            `user_${route.replace(/\//g, '_')}_${viewport.name}.png`
          ];

          for (const screenshot of screenshots) {
            const screenshotPath = path.join(
              config.outputDir,
              'screenshots',
              screenshot
            );

            if (await fileExists(screenshotPath)) {
              flowContent += `![${viewport.name}](../screenshots/${screenshot})\n\n`;
            }
          }
        }
      }

      await fs.writeFile(flowPath, flowContent);
    }

    // Document UI patterns
    console.log('Documenting UI patterns...');
    const patterns = [
      {
        name: 'navigation',
        description: 'Navigation Patterns',
        components: ['AdminNav', 'SideNav', 'MobileNav']
      },
      {
        name: 'forms',
        description: 'Form Patterns',
        components: ['LoginForm', 'CreatePOVForm', 'EditPhaseForm']
      },
      {
        name: 'layouts',
        description: 'Layout Patterns',
        components: ['AppLayout', 'AdminLayout', 'AuthLayout']
      }
    ];

    for (const pattern of patterns) {
      const patternPath = path.join(
        config.outputDir,
        'patterns',
        `${pattern.name}.md`
      );

      let patternContent = `# ${pattern.description}\n\n`;
      patternContent += `## Components\n\n`;

      for (const component of pattern.components) {
        patternContent += `### ${component}\n\n`;
        patternContent += `#### Screenshots\n\n`;

        for (const viewport of config.viewports) {
          const screenshots = await findScreenshotsForComponent(
            config.outputDir,
            component,
            viewport.name
          );

          for (const screenshot of screenshots) {
            patternContent += `![${viewport.name}](../screenshots/${screenshot})\n\n`;
          }
        }
      }

      await fs.writeFile(patternPath, patternContent);
    }

    // Create index
    console.log('Creating documentation index...');
    const indexPath = path.join(config.outputDir, 'README.md');
    let indexContent = `# Navigation Documentation\n\n`;

    indexContent += `## Flows\n\n`;
    for (const flow of flows) {
      indexContent += `- [${flow.description}](flows/${flow.name}.md)\n`;
    }

    indexContent += `\n## UI Patterns\n\n`;
    for (const pattern of patterns) {
      indexContent += `- [${pattern.description}](patterns/${pattern.name}.md)\n`;
    }

    await fs.writeFile(indexPath, indexContent);

    console.log('Navigation capture complete!');

  } catch (error) {
    console.error('Error during navigation capture:', error);
    throw error;
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
    }
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function findScreenshotsForComponent(
  outputDir: string,
  component: string,
  viewport: string
): Promise<string[]> {
  const screenshots = await fs.readdir(
    path.join(outputDir, 'screenshots')
  );

  return screenshots.filter(
    s => s.toLowerCase().includes(component.toLowerCase()) &&
         s.includes(viewport)
  );
}

// Execute if run directly
if (require.main === module) {
  captureNavigationFlows(DEFAULT_CONFIG).catch(console.error);
}

export { captureNavigationFlows };
export type { CaptureConfig };
