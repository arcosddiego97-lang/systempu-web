const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
    console.log('📦 Exporting data from local database...')

    const data = {
        users: await prisma.user.findMany(),
        materials: await prisma.material.findMany(),
        manoObra: await prisma.manoObra.findMany(),
        maquinaria: await prisma.maquinaria.findMany(),
        apus: await prisma.analisisPrecioUnitario.findMany({
            include: {
                insumos: true // Export relationships
            }
        }),
        proyectos: await prisma.proyecto.findMany({
            include: {
                presupuestos: {
                    include: {
                        conceptos: true
                    }
                }
            }
        }),
        config: await prisma.configuracion.findFirst()
    }

    const outputPath = path.join(__dirname, 'backup_data.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

    console.log(`✅ Data exported to ${outputPath}`)
    console.log(`Stats:`)
    console.log(`- Users: ${data.users.length}`)
    console.log(`- Materiales: ${data.materials.length}`)
    console.log(`- Mano de Obra: ${data.manoObra.length}`)
    console.log(`- Maquinaria: ${data.maquinaria.length}`)
    console.log(`- APUs: ${data.apus.length}`)
    console.log(`- Proyectos: ${data.proyectos.length}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
