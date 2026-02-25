/**
 * Script para recalcular el costoParcial de todos los insumos de tipo "básico"
 * usando costoDirecto en lugar de precioUnitario (evita doble sobrecosto).
 *
 * Ejecutar: node prisma/fix-basicos.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Iniciando corrección de básicos...\n')

    // 1. Obtener todos los insumos que tienen insumoApuId (son básicos)
    const basicosInsumos = await prisma.insumoEnAnalisis.findMany({
        where: { insumoApuId: { not: null } },
        include: { insumoApu: true }
    })

    console.log(`Básicos encontrados: ${basicosInsumos.length}`)

    let corregidos = 0

    for (const insumo of basicosInsumos) {
        const costoDirectoBasico = insumo.insumoApu?.costoDirecto || 0
        const nuevoCostoParcial = Math.round((costoDirectoBasico * insumo.cantidad) * 100) / 100

        if (nuevoCostoParcial !== insumo.costoParcial) {
            await prisma.insumoEnAnalisis.update({
                where: { id: insumo.id },
                data: { costoParcial: nuevoCostoParcial }
            })
            console.log(`  Insumo ID ${insumo.id}: $${insumo.costoParcial} → $${nuevoCostoParcial} (costoDirecto=$${costoDirectoBasico}, cantidad=${insumo.cantidad})`)
            corregidos++
        }
    }

    console.log(`\nBásicos corregidos: ${corregidos} de ${basicosInsumos.length}`)

    // 2. Recalcular precioUnitario de todos los APUs afectados
    const apusAfectados = [...new Set(basicosInsumos.map(i => i.apuId))]
    console.log(`\nRecalculando ${apusAfectados.length} APUs afectados...`)

    for (const apuId of apusAfectados) {
        const allInsumos = await prisma.insumoEnAnalisis.findMany({
            where: { apuId },
            include: { manoObra: true }
        })

        const total = Math.round(allInsumos.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100

        const subtotalMO = allInsumos
            .filter(i => i.manoObraId)
            .reduce((acc, curr) => acc + (curr.costoParcial || 0), 0)
        const herramientaMenor = Math.round((subtotalMO * 0.03) * 100) / 100

        const apu = await prisma.analisisPrecioUnitario.findUnique({ where: { id: apuId } })
        const porcentajeSobrecosto = apu?.porcentajeSobrecosto ?? 0.25
        const factorEquipoSeguridad = apu?.factorEquipoSeguridad ?? 0
        const equipoSeguridad = Math.round((subtotalMO * factorEquipoSeguridad) * 100) / 100

        const precioUnitario = Math.round(((total + herramientaMenor + equipoSeguridad) * (1 + porcentajeSobrecosto)) * 100) / 100

        await prisma.analisisPrecioUnitario.update({
            where: { id: apuId },
            data: { costoDirecto: total, precioUnitario }
        })

        console.log(`  APU ID ${apuId}: costoDirecto=$${total}, precioUnitario=$${precioUnitario}`)
    }

    console.log('\n✅ Corrección completada.')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
