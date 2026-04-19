const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding courts...');

    // Clear existing data
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.court.deleteMany();

    const result = await prisma.court.createMany({
        data: [
            {
                name: 'Padel Court A (Premium)',
                location: 'Banyumanik, Semarang',
                pricePerHour: 150000,
            },
            {
                name: 'Indoor Panoramic Court',
                location: 'Tembalang, Semarang',
                pricePerHour: 200000,
            },
            {
                name: 'Outdoor Classic Court',
                location: 'Simpang Lima, Semarang',
                pricePerHour: 120000,
            },
        ],
    });

    console.log(`✅ Courts seeded: ${result.count}`);
}

main()
    .catch(e => console.error('Error:', e))
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
