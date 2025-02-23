import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

interface StatusChange {
  oldValue: string;
  newValue: string;
  type: 'POVStatus' | 'PhaseStatus';
}

async function updateStatusEnums(changes: StatusChange[]) {
  try {
    // 1. Create backup
    console.log('Creating database backup...');
    const backupPath = path.join('backups', `pre_PoV_status_change_${Date.now()}.sql`);
    execSync(`pg_dump -h localhost -U postgres -d copov2 > ${backupPath}`);
    console.log(`✓ Backup created at ${backupPath}`);

    // 2. Generate migration name
    const migrationName = changes
      .map(c => `${c.oldValue.toLowerCase()}_to_${c.newValue.toLowerCase()}`)
      .join('_');

    // 3. Create migration SQL
    const migrationSQL = changes
      .map(c => `ALTER TYPE "${c.type}" RENAME VALUE '${c.oldValue}' TO '${c.newValue}';`)
      .join('\n');

    // 4. Create migration file
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const migrationFileName = `${timestamp}_${migrationName}`;
    const migrationPath = path.join('prisma', 'migrations', migrationFileName);
    
    if (!fs.existsSync('prisma/migrations')) {
      fs.mkdirSync('prisma/migrations', { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(migrationPath, 'migration.sql'),
      migrationSQL
    );

    // 5. Update schema.prisma
    console.log('Updating schema.prisma...');
    let schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
    
    changes.forEach(change => {
      const enumRegex = new RegExp(
        `enum ${change.type} {[^}]*${change.oldValue}[^}]*}`,
        'g'
      );
      schemaContent = schemaContent.replace(
        enumRegex,
        (match) => match.replace(change.oldValue, change.newValue)
      );
    });
    
    fs.writeFileSync('prisma/schema.prisma', schemaContent);
    console.log('✓ Schema updated');

    // 6. Apply migration
    console.log('Applying migration...');
    execSync('npx prisma migrate deploy');
    console.log('✓ Migration applied');

    // 7. Update code references
    console.log('Updating code references...');
    const filesToUpdate = [
      'lib/pov/services/status.ts',
      'lib/pov/services/phase.ts',
      'app/(authenticated)/pov/[povId]/status.tsx',
      'components/pov/PhaseStatus.tsx',
      'prisma/__tests__/schema.test.ts'
    ];

    filesToUpdate.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        changes.forEach(change => {
          content = content.replace(
            new RegExp(change.oldValue, 'g'),
            change.newValue
          );
        });
        fs.writeFileSync(filePath, content);
      }
    });
    console.log('✓ Code references updated');

    // 8. Run tests
    console.log('Running tests...');
    execSync('npm run test');
    console.log('✓ Tests passed');

    console.log('\nPoV status enum update completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the changes in the updated files');
    console.log('2. Check for any missed references to the old PoV status values');
    console.log('3. Test the application thoroughly');
    console.log('4. Commit the changes');

  } catch (error) {
    console.error('Error updating PoV status enums:', error);
    console.log('\nRollback steps:');
    console.log('1. Restore the database from backup');
    console.log('2. Revert schema.prisma changes');
    console.log('3. Delete the migration file');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage:
if (require.main === module) {
  const changes: StatusChange[] = [
    {
      oldValue: 'IN_PROGRESS',
      newValue: 'WORKING_ONIT',
      type: 'POVStatus'
    },
    {
      oldValue: 'PROJECTED',
      newValue: 'BEGINNING',
      type: 'PhaseStatus'
    }
  ];

  updateStatusEnums(changes).catch(console.error);
}

export { updateStatusEnums, type StatusChange };
