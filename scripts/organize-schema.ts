import * as fs from 'node:fs';

type ModelDef = {
  name: string;
  content: string;
  dependencies: string[];
  domain: string;
};

function extractModelName(content: string): string {
  const match = content.match(/model\s+(\w+)\s*{/);
  return match ? match[1] : '';
}

function extractDependencies(content: string): string[] {
  // Find all model references in relations and types
  const typeRefs = content.match(/\s+\w+\s+(\w+)(\[\])?(\?)?(\s+@|$|\s)/g) || [];
  return [...new Set(typeRefs
    .map(ref => ref.trim().split(/\s+/)[1].replace('[]', '').replace('?', ''))
    .filter(type => !['String', 'Int', 'Boolean', 'DateTime', 'Json', 'Decimal'].includes(type))
  )];
}

function getDomain(modelName: string): string {
  const domainMap: { [key: string]: string } = {
    // Auth Domain
    'User': 'auth',
    'Role': 'auth',
    'RefreshToken': 'auth',
    
    // Team Domain
    'Team': 'team',
    'TeamMember': 'team',
    
    // POV Domain
    'POV': 'pov',
    'Phase': 'pov',
    'PhaseTemplate': 'pov',
    'Milestone': 'pov',
    'KPITemplate': 'pov',
    'POVKPI': 'pov',
    'POVLaunch': 'pov',
    'CRMFieldMapping': 'pov',
    'CRMSyncHistory': 'pov',
    'Workflow': 'pov',
    'WorkflowStep': 'pov',
    
    // Task Domain
    'Task': 'task',
    'Comment': 'task',
    'Attachment': 'task',
    
    // Activity Domain
    'Activity': 'activity',
    'TaskActivity': 'activity',
    'Notification': 'activity',
    
    // Support Domain
    'UserSettings': 'support',
    'SupportRequest': 'support',
    'FeatureRequest': 'support'
  };
  
  return domainMap[modelName] || 'other';
}

function organizeSchema() {
  try {
    // Read current schema and domain schemas
    const mainSchema = fs.readFileSync('./prisma/schema.prisma', 'utf8');
    const domainSchemas = fs.readdirSync('./prisma/domains')
      .filter(file => file.endsWith('.prisma'))
      .map(file => fs.readFileSync(`./prisma/domains/${file}`, 'utf8'));
    
    const schema = [mainSchema, ...domainSchemas].join('\n\n');
    
    // Extract configuration
    const configMatch = schema.match(/generator[\s\S]*?^}[\s]*datasource[\s\S]*?^}/m);
    const configSection = configMatch ? configMatch[0] : '';
    
    // Extract enums
    const enumMatches = schema.match(/enum\s+\w+\s*{[\s\S]*?^}/gm) || [];
    
    // Group enums by type
    const statusEnums = enumMatches.filter(e => e.includes('Status'));
    const priorityEnums = enumMatches.filter(e => e.includes('Priority') || e.includes('Impact'));
    const roleEnums = enumMatches.filter(e => e.includes('Role'));
    const otherEnums = enumMatches.filter(e => 
      !e.includes('Status') && 
      !e.includes('Priority') && 
      !e.includes('Impact') && 
      !e.includes('Role')
    );
    
    // Extract and analyze models
    const modelMatches = schema.match(/model\s+\w+\s*{[\s\S]*?^}/gm) || [];
    console.log('Found models:', modelMatches.map(m => extractModelName(m)));
    const models: ModelDef[] = modelMatches.map(content => ({
      name: extractModelName(content),
      content,
      dependencies: extractDependencies(content),
      domain: getDomain(extractModelName(content))
    }));

    // Sort models by dependencies within each domain
    const sortedModels: ModelDef[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    function visit(modelName: string) {
      if (visited.has(modelName)) return;
      if (visiting.has(modelName)) return; // Handle circular dependencies

      visiting.add(modelName);

      const model = models.find(m => m.name === modelName);
      if (model) {
        for (const dep of model.dependencies) {
          if (models.some(m => m.name === dep)) {
            visit(dep);
          }
        }
        if (!visited.has(modelName)) {
          sortedModels.push(model);
          visited.add(modelName);
        }
      }

      visiting.delete(modelName);
    }

    // Process models in dependency order
    const modelOrder = [
      // Auth Domain (base models)
      'Role', 'User', 'RefreshToken',
      
      // Team Domain
      'Team', 'TeamMember',
      
      // POV Domain (ordered by dependencies)
      'KPITemplate',
      'PhaseTemplate',
      'POV',
      'Phase',
      'Milestone',
      'POVKPI',
      'POVLaunch',
      'CRMFieldMapping',
      'CRMSyncHistory',
      'Workflow',
      'WorkflowStep',
      
      // Task Domain
      'Task', 'Comment', 'Attachment',
      
      // Activity Domain
      'Activity', 'TaskActivity', 'Notification',
      
      // Support Domain
      'UserSettings', 'SupportRequest', 'FeatureRequest'
    ];

    // Visit models in order
    modelOrder.forEach(modelName => visit(modelName));

    // Build new schema with models in dependency order but grouped visually by domain
    let newSchema = `${configSection}

/////////////////////////////////
// Enums
/////////////////////////////////

// Status Enums
${statusEnums.join('\n\n')}

// Priority Enums
${priorityEnums.join('\n\n')}

// Role Enums
${roleEnums.join('\n\n')}

// Other Enums
${otherEnums.join('\n\n')}

/////////////////////////////////
// Models (Ordered by Dependencies)
/////////////////////////////////

${sortedModels.map(model => {
  // Add domain header before first model of each domain
  const prevModel = sortedModels[sortedModels.indexOf(model) - 1];
  const header = (!prevModel || prevModel.domain !== model.domain) 
    ? `\n/////////////////////////////////\n// ${model.domain.toUpperCase()} Domain\n/////////////////////////////////\n\n`
    : '';
  return header + model.content;
}).join('\n\n')}`;

    // Write organized schema
    fs.writeFileSync('./prisma/schema.prisma', newSchema);
    console.log('Schema organized successfully');
    
  } catch (error) {
    console.error('Error organizing schema:', error);
  }
}

organizeSchema();
