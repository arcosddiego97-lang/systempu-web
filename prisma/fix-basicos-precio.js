/**
 * Fix existing BASICO APUs: set precioUnitario = costoDirecto (no surcharge)
 * Run: node prisma/fix-basicos-precio.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Corrigiendo precioUnitario de básicos...\n')

    const basicos = await prisma.analisisPrecioUnitario.findMany({
        where: { tipo: 'BASICO' }
    })

    console.log(`Básicos encontrados: ${basicos.length}`)
    let corregidos = 0

    for (const b of basicos) {
        const costoDirecto = b.costoDirecto || 0
        if (b.precioUnitario !== costoDirecto) {
            await prisma.analisisPrecioUnitario.update({
                where: { id: b.id },
                data: { precioUnitario: costoDirecto }
            })
            console.log(`  ID ${b.id} (${b.codigo}): precioUnitario $${b.precioUnitario} → $${costoDirecto}`)
            corregidos++
        }
    }

    console.log(`\n✅ Básicos corregidos: ${corregidos} de ${basicos.length}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
