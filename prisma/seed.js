const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Add default regions for each country
  const countries = await prisma.country.findMany();
  
  for (const country of countries) {
    // Check if regions already exist for this country
    const existingRegions = await prisma.region.findMany({
      where: { countryId: country.id }
    });

    if (existingRegions.length === 0) {
      // Add cardinal regions
      await Promise.all([
        prisma.region.create({
          data: {
            name: `${country.name} North`,
            type: 'NORTH',
            countryId: country.id
          }
        }),
        prisma.region.create({
          data: {
            name: `${country.name} South`,
            type: 'SOUTH',
            countryId: country.id
          }
        }),
        prisma.region.create({
          data: {
            name: `${country.name} East`,
            type: 'EAST',
            countryId: country.id
          }
        }),
        prisma.region.create({
          data: {
            name: `${country.name} West`,
            type: 'WEST',
            countryId: country.id
          }
        }),
        prisma.region.create({
          data: {
            name: `${country.name} Central`,
            type: 'CENTRAL',
            countryId: country.id
          }
        })
      ]);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
