const { PrismaClient, SalesTheatre } = require('@prisma/client');

const prisma = new PrismaClient();

type CountryInput = {
  name: string;
  code: string;
  salesTheatre: typeof SalesTheatre[keyof typeof SalesTheatre];
  regions: {
    create: Array<{
      name: string;
      type: string;
    }>;
  };
};

const createCountry = async (input: CountryInput) => {
  // Runtime casting to bypass type checking
  const data = {
    name: input.name,
    code: input.code,
    theatre: input.salesTheatre,
    regions: {
      create: input.regions.create
    }
  };

  return await prisma.country.create({
    data: data as any
  });
};

async function main() {
  console.log('Cleaning up existing data...');
  await prisma.country.deleteMany({});

  console.log('Creating new seed data...');
  
  // Create North America regions
  const northAmerica = await createCountry({
    name: 'United States',
    code: 'US',
    salesTheatre: SalesTheatre.NORTH_AMERICA,
    regions: {
      create: [
        { name: 'East Coast', type: 'EAST' },
        { name: 'West Coast', type: 'WEST' },
        { name: 'Central', type: 'CENTRAL' }
      ]
    }
  });

  // Create EMEA regions
  const emea = await createCountry({
    name: 'United Kingdom',
    code: 'UK',
    salesTheatre: SalesTheatre.EMEA,
    regions: {
      create: [
        { name: 'London', type: 'CENTRAL' },
        { name: 'Northern England', type: 'NORTH' },
        { name: 'Southern England', type: 'SOUTH' }
      ]
    }
  });

  // Create APJ regions
  const apj = await createCountry({
    name: 'Australia',
    code: 'AU',
    salesTheatre: SalesTheatre.APJ,
    regions: {
      create: [
        { name: 'Eastern Australia', type: 'EAST' },
        { name: 'Western Australia', type: 'WEST' },
        { name: 'Central Australia', type: 'CENTRAL' }
      ]
    }
  });

  // Create LAC regions
  const lac = await createCountry({
    name: 'Brazil',
    code: 'BR',
    salesTheatre: SalesTheatre.LAC,
    regions: {
      create: [
        { name: 'Northern Brazil', type: 'NORTH' },
        { name: 'Southern Brazil', type: 'SOUTH' },
        { name: 'Central Brazil', type: 'CENTRAL' }
      ]
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
