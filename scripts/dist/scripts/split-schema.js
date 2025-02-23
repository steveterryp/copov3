import { readFileSync, writeFileSync } from 'node:fs';
// Define domain categories and their models
const domainCategories = {
    auth: ['User', 'Role', 'RefreshToken'],
    team: ['Team', 'TeamMember'],
    pov: {
        core: ['POV', 'Phase'],
        crm: [], // Will be added in next phase
        workflow: [], // Will be added in next phase
        kpi: [] // Will be added in next phase
    },
    task: ['Task', 'Comment', 'Attachment', 'TaskActivity'],
    activity: ['Activity'],
    support: ['SupportRequest', 'FeatureRequest']
};
// Define enum categories
const enumCategories = {
    status: ['POVStatus', 'TaskStatus', 'UserStatus', 'PhaseStatus', 'SupportRequestStatus', 'FeatureRequestStatus'],
    priority: ['Priority', 'TaskPriority', 'SupportRequestPriority', 'FeatureRequestImpact'],
    roles: ['UserRole', 'TeamRole']
};
function extractModelDefinition(schema, modelName) {
    const modelStart = schema.indexOf(`model ${modelName}`);
    if (modelStart === -1)
        return '';
    let braceCount = 0;
    let index = modelStart;
    let found = false;
    while (index < schema.length) {
        if (schema[index] === '{') {
            braceCount++;
            found = true;
        }
        else if (schema[index] === '}') {
            braceCount--;
            if (found && braceCount === 0) {
                return schema.substring(modelStart, index + 1);
            }
        }
        index++;
    }
    return '';
}
function extractEnumDefinition(schema, enumName) {
    const enumStart = schema.indexOf(`enum ${enumName}`);
    if (enumStart === -1)
        return '';
    let braceCount = 0;
    let index = enumStart;
    let found = false;
    while (index < schema.length) {
        if (schema[index] === '{') {
            braceCount++;
            found = true;
        }
        else if (schema[index] === '}') {
            braceCount--;
            if (found && braceCount === 0) {
                return schema.substring(enumStart, index + 1);
            }
        }
        index++;
    }
    return '';
}
function createBaseTypes() {
    return `type Timestamps {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

type Metadata {
  metadata Json?
}
`;
}
async function splitSchema() {
    try {
        // Read current schema
        const schema = readFileSync('prisma/schema.prisma', 'utf8');
        // Extract generator and datasource blocks
        const configSection = schema.substring(0, schema.indexOf('enum'));
        // Create main schema file with imports
        let mainSchema = configSection + '\n';
        mainSchema += 'import "./common/base"\n';
        mainSchema += 'import "./enums/status"\n';
        mainSchema += 'import "./enums/priority"\n';
        mainSchema += 'import "./enums/roles"\n\n';
        Object.keys(domainCategories).forEach(domain => {
            const domainValue = domainCategories[domain];
            if (typeof domainValue === 'object' && !Array.isArray(domainValue)) {
                // We know this is POVDomain because it's the only non-array domain
                const povDomain = domainValue;
                Object.keys(povDomain).forEach(subdomain => {
                    mainSchema += `import "./domains/${domain}/${subdomain}"\n`;
                });
            }
            else {
                mainSchema += `import "./domains/${domain}"\n`;
            }
        });
        writeFileSync('prisma/schema.prisma', mainSchema);
        // Create base types
        writeFileSync('prisma/common/base.prisma', createBaseTypes());
        // Split enums
        Object.entries(enumCategories).forEach(([category, enums]) => {
            let enumContent = '';
            enums.forEach(enumName => {
                const enumDef = extractEnumDefinition(schema, enumName);
                if (enumDef)
                    enumContent += enumDef + '\n\n';
            });
            writeFileSync(`prisma/enums/${category}.prisma`, enumContent);
        });
        // Split models by domain
        Object.entries(domainCategories).forEach(([domain, models]) => {
            if (typeof models === 'object' && !Array.isArray(models)) {
                // Handle nested domains (e.g., pov)
                Object.entries(models).forEach(([subdomain, subModels]) => {
                    let domainContent = '';
                    subModels.forEach(modelName => {
                        const modelDef = extractModelDefinition(schema, modelName);
                        if (modelDef)
                            domainContent += modelDef + '\n\n';
                    });
                    writeFileSync(`prisma/domains/${domain}/${subdomain}.prisma`, domainContent);
                });
            }
            else {
                // Handle flat domains
                let domainContent = '';
                models.forEach(modelName => {
                    const modelDef = extractModelDefinition(schema, modelName);
                    if (modelDef)
                        domainContent += modelDef + '\n\n';
                });
                writeFileSync(`prisma/domains/${domain}.prisma`, domainContent);
            }
        });
        console.log('Schema split successfully');
    }
    catch (error) {
        console.error('Error splitting schema:', error);
    }
}
splitSchema();
