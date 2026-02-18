// Manual migration using Prisma's raw SQL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE AnalisisPrecioUnitario 
            ADD COLUMN factorEquipoSeguridad REAL NOT NULL DEFAULT 0
        `);
        console.log('✅ Column factorEquipoSeguridad added successfully');
    } catch (error) {
        if (error.message.includes('duplicate column')) {
            console.log('⚠️ Column already exists, skipping');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
