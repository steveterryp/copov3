import fs from "fs";
import path from "path";
import glob from "fast-glob";
import chalk from "chalk";

// Define allowed naming patterns
const patterns = {
    pascalCase: /^[A-Z][a-zA-Z0-9]*$/,  // For components & classes
    camelCase: /^[a-z][a-zA-Z0-9]*$/,   // For variables & functions
    kebabCase: /^[a-z0-9]+(-[a-z0-9]+)*$/,  // For file names (pages, api)
    upperSnakeCase: /^[A-Z][A-Z0-9_]*$/, // For constants & Redux actions
};

// Define file type rules
const rules = [
    { pattern: "pages/**/*.tsx", case: "kebabCase" },
    { pattern: "components/**/*.tsx", case: "pascalCase" },
    { pattern: "hooks/**/*.ts", case: "camelCase" },
    { pattern: "constants/**/*.ts", case: "upperSnakeCase" },
];

// Check component file contents
async function checkComponentContents(file, baseName) {
    // Skip compat files
    if (baseName.endsWith('-compat')) {
        return false;
    }

    const content = await fs.promises.readFile(file, 'utf8');
    let hasErrors = false;

    // Check for default export using the same name as the file
    const defaultExportRegex = new RegExp(`export default .*${baseName}|const ${baseName} = .* => {`);
    if (!defaultExportRegex.test(content)) {
        console.log(
            chalk.red(`❌ Component "${file}" should have a default export matching the file name.`)
        );
        hasErrors = true;
    }

    // Check for proper React component naming
    const componentRegex = new RegExp(`function ${baseName}|const ${baseName} =|class ${baseName}`);
    if (!componentRegex.test(content)) {
        console.log(
            chalk.red(`❌ Component "${file}" should have a declaration matching the file name.`)
        );
        hasErrors = true;
    }

    return hasErrors;
}

// Scan files and check naming
async function checkNaming() {
    let hasErrors = false;
    for (const rule of rules) {
        const files = await glob(rule.pattern);
        for (const file of files) {
            const baseName = path.basename(file, path.extname(file));
            if (!patterns[rule.case].test(baseName)) {
                console.log(
                    chalk.red(`❌ Naming error in ${file}: Expected ${rule.case}`)
                );
                hasErrors = true;
            }

            // Additional component checks for React components
            if (rule.case === 'pascalCase' && file.includes('components/')) {
                const componentErrors = await checkComponentContents(file, baseName);
                hasErrors = hasErrors || componentErrors;
            }
        }
    }
    if (!hasErrors) {
        console.log(chalk.green("✅ All files follow naming conventions!"));
    }
    process.exit(hasErrors ? 1 : 0);
}

checkNaming();
