const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@systempu.com'
    const userEmail = 'capture@systempu.com'

    // Admin
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Administrador',
            password: adminPassword,
            role: 'ADMIN'
        }
    })
    console.log({ admin })

    // User
    const userPassword = await bcrypt.hash('user123', 10)
    const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
            email: userEmail,
            name: 'Capturista',
            password: userPassword,
            role: 'USER'
        }
    })
    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
