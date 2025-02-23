#!/usr/bin/env node
import { promises as fs, Dirent } from 'fs';
import path from 'path';
import * as ts from 'typescript';

/**
 * Configuration options for navigation analysis
 */
interface AnalysisConfig {
  /** Root directory for app pages */
  appDir?: string;
  /** Root directory for components */
  componentsDir?: string;
  /** File patterns to analyze */
  patterns?: {
    /** Pattern for navigation component files */
    navComponents?: string;
    /** Pattern for page files */
    pages?: string[];
  };
  /** Parallel processing options */
  parallel?: {
    /** Enable parallel file processing */
    enabled: boolean;
    /** Maximum concurrent operations */
    maxConcurrency: number;
  };
}

/** Default configuration */
const DEFAULT_CONFIG: AnalysisConfig = {
  appDir: 'app',
  componentsDir: 'components',
  patterns: {
    navComponents: 'Nav[^/]*\\.tsx$',
    pages: ['page.tsx', 'layout.tsx']
  },
  parallel: {
    enabled: true,
    maxConcurrency: 4
  }
};

/**
 * Type definitions for navigation analysis
 */
interface RouteAnalysis {
  routes: Array<{
    path: string;
    component: string;
    layout?: string;
    auth?: boolean;
  }>;
  navigationLinks: Array<{
    path: string;
    label: string;
    component: string;
    location: string;
  }>;
  issues: Array<{
    type: 'ORPHANED_PAGE' | 'BROKEN_LINK' | 'DUPLICATE_FUNCTIONALITY';
    description: string;
    location: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestions?: string[];
  }>;
}

interface NavigationComponent {
  name: string;
  links: Array<{
    path: string;
    label: string;
    dynamic?: boolean;
  }>;
  location: string;
}

/**
 * Processes files in parallel with concurrency control
 */
async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const chunks = [];
  
  for (let i = 0; i < items.length; i += maxConcurrency) {
    chunks.push(items.slice(i, i + maxConcurrency));
  }
  
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(item => processor(item))
    );
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Scans the app directory for routes
 */
async function scanRoutes(
  appDir: string,
  config: AnalysisConfig
): Promise<RouteAnalysis['routes']> {
  const routes: RouteAnalysis['routes'] = [];
  
  async function scanDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      const processEntry = async (entry: Dirent) => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            await scanDirectory(fullPath);
          }
        } else if (
          entry.isFile() && 
          config.patterns?.pages?.includes(entry.name)
        ) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const relativePath = path.relative(appDir, dir);
        // Skip non-page files
        if (entry.name !== 'page.tsx') {
          return;
        }

        // Convert path for Next.js app router
        const routePath = relativePath
          .replace(/\\/g, '/')
          .replace(/\[([^\]]+)\]/g, ':$1')
          .replace(/\/page$/, '') // Remove /page from the end
          .replace(/^\(([^)]+)\)\//, '') // Remove (group)/ at start
          .replace(/\/\(([^)]+)\)\//, '/') // Remove /(group)/ in middle
            
            const sourceFile = ts.createSourceFile(
              fullPath,
              content,
              ts.ScriptTarget.Latest,
              true
            );
            
            const auth = await hasAuthRequirement(sourceFile);
            const layout = entry.name === 'page.tsx' 
              ? await detectLayout(dir)
              : undefined;
            
            routes.push({
              path: `/${routePath}`,
              component: entry.name,
              auth,
              layout
            });
          } catch (error) {
            console.error(`Error processing file ${fullPath}:`, error);
          }
        }
      };
      
      if (config.parallel?.enabled) {
        await processInParallel(
          entries,
          processEntry,
          config.parallel.maxConcurrency
        );
      } else {
        for (const entry of entries) {
          await processEntry(entry);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }
  
  await scanDirectory(appDir);
  return routes;
}

/**
 * Parses navigation components to extract links
 */
async function parseNavigationComponents(
  componentsDir: string,
  config: AnalysisConfig
): Promise<NavigationComponent[]> {
  const navComponents: NavigationComponent[] = [];
  
  async function scanNavComponents(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      const processEntry = async (entry: Dirent) => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanNavComponents(fullPath);
        } else if (
          entry.isFile() && 
          new RegExp(config.patterns?.navComponents || '').test(entry.name)
        ) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const links = await extractNavigationLinks(content);
            
            navComponents.push({
              name: entry.name,
              links,
              location: path.relative(process.cwd(), fullPath)
            });
          } catch (error) {
            console.error(`Error processing navigation component ${fullPath}:`, error);
          }
        }
      };
      
      if (config.parallel?.enabled) {
        await processInParallel(
          entries,
          processEntry,
          config.parallel.maxConcurrency
        );
      } else {
        for (const entry of entries) {
          await processEntry(entry);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }
  
  await scanNavComponents(componentsDir);
  return navComponents;
}

/**
 * Analyzes links for issues and patterns
 */
function analyzeLinks(
  routes: RouteAnalysis['routes'],
  navComponents: NavigationComponent[]
): RouteAnalysis['issues'] {
  const issues: RouteAnalysis['issues'] = [];
  const routePaths = new Set(routes.map(r => r.path));
  
  // Check for broken links
  for (const nav of navComponents) {
    for (const link of nav.links) {
      if (!link.dynamic && !routePaths.has(link.path)) {
        issues.push({
          type: 'BROKEN_LINK',
          description: `Broken link "${link.path}" found in ${nav.name}`,
          location: nav.location,
          severity: 'HIGH',
          suggestions: [
            'Verify the route exists',
            'Check for typos in the path',
            'Ensure the page component is properly exported'
          ]
        });
      }
    }
  }
  
  // Check for orphaned pages
  const linkedPaths = new Set(
    navComponents.flatMap(nav => 
      nav.links
        .filter(l => !l.dynamic)
        .map(l => l.path)
    )
  );
  
  for (const route of routes) {
    if (!linkedPaths.has(route.path)) {
      issues.push({
        type: 'ORPHANED_PAGE',
        description: `Page "${route.path}" is not linked from any navigation`,
        location: route.path,
        severity: 'MEDIUM',
        suggestions: [
          'Add a link to this page in appropriate navigation',
          'Consider if this page should be accessible directly',
          'Check if this is an old/unused page that can be removed'
        ]
      });
    }
  }
  
  // Check for duplicate functionality
  const pathsByPattern = new Map<string, string[]>();
  for (const route of routes) {
    const pattern = route.path.replace(/:\w+/g, ':param');
    const paths = pathsByPattern.get(pattern) || [];
    paths.push(route.path);
    pathsByPattern.set(pattern, paths);
  }
  
  for (const [pattern, paths] of pathsByPattern.entries()) {
    if (paths.length > 1) {
      issues.push({
        type: 'DUPLICATE_FUNCTIONALITY',
        description: `Potential duplicate routes found: ${paths.join(', ')}`,
        location: pattern,
        severity: 'LOW',
        suggestions: [
          'Consider consolidating duplicate functionality',
          'Verify if these routes serve different purposes',
          'Document the reason for duplicate patterns if intentional'
        ]
      });
    }
  }
  
  return issues;
}

/**
 * Detects authentication requirements in a file
 */
async function hasAuthRequirement(sourceFile: ts.SourceFile): Promise<boolean> {
  let hasAuth = false;
  
  function visit(node: ts.Node) {
    if (hasAuth) return;
    
    // Check for @requireAuth decorator
    if (
      ts.isDecorator(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'requireAuth'
    ) {
      hasAuth = true;
      return;
    }
    
    // Check for auth middleware imports
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.getText().includes('middleware/auth')
    ) {
      hasAuth = true;
      return;
    }
    
    // Check for useAuth hook usage
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'useAuth'
    ) {
      hasAuth = true;
      return;
    }
    
    // Check for AuthProvider context
    if (
      ts.isJsxElement(node) &&
      ts.isIdentifier(node.openingElement.tagName) &&
      node.openingElement.tagName.text === 'AuthProvider'
    ) {
      hasAuth = true;
      return;
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return hasAuth;
}

/**
 * Detects if a layout file exists in the given directory
 */
async function detectLayout(dir: string): Promise<string | undefined> {
  const layoutFile = path.join(dir, 'layout.tsx');
  try {
    const stats = await fs.stat(layoutFile);
    return stats.isFile() ? 'layout.tsx' : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`Warning: Error checking layout file ${layoutFile}:`, error);
    }
    return undefined;
  }
}

/**
 * Extracts navigation links from JSX content
 */
async function extractNavigationLinks(
  content: string
): Promise<Array<{ path: string; label: string; dynamic?: boolean }>> {
  const links: Array<{ path: string; label: string; dynamic?: boolean }> = [];
  const sourceFile = ts.createSourceFile(
    'nav.tsx',
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  function visit(node: ts.Node) {
    if (
      ts.isJsxElement(node) || 
      ts.isJsxSelfClosingElement(node)
    ) {
      const elementName = ts.isJsxElement(node) 
        ? node.openingElement.tagName.getText()
        : node.tagName.getText();
        
      if (elementName === 'Link' || elementName === 'NavLink') {
        let href: ts.JsxAttribute | undefined;
        let isDynamic = false;
        
        if (ts.isJsxElement(node)) {
          href = node.openingElement.attributes.properties.find(
            (p: ts.JsxAttribute | ts.JsxSpreadAttribute): p is ts.JsxAttribute => 
              ts.isJsxAttribute(p) && p.name.getText() === 'href'
          );
        } else {
          href = node.attributes.properties.find(
            (p: ts.JsxAttribute | ts.JsxSpreadAttribute): p is ts.JsxAttribute => 
              ts.isJsxAttribute(p) && p.name.getText() === 'href'
          );
        }
        
        // Check for dynamic href values
        if (href?.initializer && ts.isJsxExpression(href.initializer)) {
          isDynamic = true;
        }
        
        // Extract link label from various possible structures
        let label = '';
        if (ts.isJsxElement(node)) {
          // Handle nested expressions in link content
          const textContent: string[] = [];
          node.children.forEach(child => {
            if (ts.isJsxText(child)) {
              textContent.push(child.getText().trim());
            } else if (ts.isJsxExpression(child) && child.expression) {
              textContent.push(`{${child.expression.getText()}}`);
            }
          });
          label = textContent.join('').replace(/['"]/g, '');
        }
        
        if (href?.initializer) {
          links.push({
            path: href.initializer.getText().replace(/['"]/g, ''),
            label: label || 'Unnamed Link',
            dynamic: isDynamic
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return links;
}

/**
 * Main analysis function
 */
async function analyzeNavigation(
  config: Partial<AnalysisConfig> = {}
): Promise<RouteAnalysis> {
  const finalConfig: AnalysisConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    patterns: {
      ...DEFAULT_CONFIG.patterns,
      ...config.patterns
    },
    parallel: {
      enabled: config.parallel?.enabled ?? DEFAULT_CONFIG.parallel!.enabled,
      maxConcurrency: config.parallel?.maxConcurrency ?? DEFAULT_CONFIG.parallel!.maxConcurrency
    }
  };
  
  try {
    // Scan routes
    console.log('Scanning routes...');
    const routes = await scanRoutes(
      path.join(process.cwd(), finalConfig.appDir!),
      finalConfig
    );
    
    // Parse navigation components
    console.log('Parsing navigation components...');
    const navComponents = await parseNavigationComponents(
      path.join(process.cwd(), finalConfig.componentsDir!),
      finalConfig
    );
    
    // Extract navigation links
    console.log('Extracting navigation links...');
    const navigationLinks = navComponents.flatMap(nav => 
      nav.links.map(link => ({
        path: link.path,
        label: link.label,
        component: nav.name,
        location: nav.location
      }))
    );
    
    // Analyze patterns and find issues
    console.log('Analyzing patterns and finding issues...');
    const issues = analyzeLinks(routes, navComponents);
    
    // Deduplicate routes
    const uniqueRoutes = Array.from(
      new Map(routes.map(route => [route.path, route])).values()
    );

    // Generate analysis result
    const analysis: RouteAnalysis = {
      routes: uniqueRoutes,
      navigationLinks,
      issues
    };
    
    // Save analysis result
    const outputPath = path.join(process.cwd(), 'navigation-analysis.json');
    await fs.writeFile(
      outputPath,
      JSON.stringify(analysis, null, 2)
    );
    
    console.log(`Analysis complete! Results saved to ${outputPath}`);
    return analysis;
    
  } catch (error) {
    console.error('Error during navigation analysis:', error);
    throw error;
  }
}

// Execute analysis if run directly
if (require.main === module) {
  analyzeNavigation().catch(console.error);
}

export { analyzeNavigation };
export type { RouteAnalysis, AnalysisConfig };
