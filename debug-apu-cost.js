
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const code = 'AAC 3/0'
    console.log(`Searching for APU with code: ${code}`)

    const apu = await prisma.analisisPrecioUnitario.findFirst({
        where: { codigo: code },
        include: {
            insumos: {
                include: {
                    material: true,
                    manoObra: true,
                    maquinaria: true,
                    insumoApu: true,
                }
            }
        }
    })

    if (!apu) {
        console.log('APU not found')
        return
    }

    console.log('APU ID:', apu.id)
    console.log('Stored Costo Directo:', apu.costoDirecto)
    console.log('Stored Precio Unitario:', apu.precioUnitario)
    console.log('Stored Factor Sobrecosto:', apu.porcentajeSobrecosto)
    console.log('Stored Factor Equipo Seguridad:', apu.factorEquipoSeguridad)

    console.log('--- Insumos ---')
    let sumInsumos = 0
    let sumMO = 0

    for (const i of apu.insumos) {
        console.log(`ID: ${i.id}, Type: ${i.materialId ? 'MAT' : i.manoObraId ? 'MO' : i.maquinariaId ? 'EQP' : i.insumoApuId ? 'BAS' : 'UNKNOWN'}, CostoParcial: ${i.costoParcial}`)
        sumInsumos += i.costoParcial || 0
        if (i.manoObraId) sumMO += i.costoParcial || 0
    }

    console.log('--- Calculations ---')
    console.log('Sum of Insumo Costo Parcial:', sumInsumos)
    const hm = Math.round(sumMO * 0.03 * 100) / 100
    console.log('Calculated Herramienta Menor (3% of MO):', hm)

    const esFactor = apu.factorEquipoSeguridad || 0
    const es = Math.round(sumMO * esFactor * 100) / 100
    console.log(`Calculated Equipo Seguridad (${esFactor * 100}% of MO):`, es)

    const calculatedDirectCost = sumInsumos + hm + es
    console.log('Calculated Total Direct Cost (Sum + HM + ES):', calculatedDirectCost)

    console.log('--- Discrepancy ---')
    console.log('Stored vs Calculated:', apu.costoDirecto, 'vs', calculatedDirectCost)
    console.log('Difference:', apu.costoDirecto - calculatedDirectCost)

    console.log('--- Double Count Check ---')
    const doubleCount = apu.costoDirecto + hm + es
    console.log('If Stored CostoDirecto excludes percentages, formatting via frontend adds them:', doubleCount)

}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
