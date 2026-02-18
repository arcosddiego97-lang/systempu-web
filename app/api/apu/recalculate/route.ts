import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST() {
    try {
        // Get all APU records
        const allApus = await prisma.analisisPrecioUnitario.findMany({
            select: { id: true, porcentajeSobrecosto: true }
        })

        let updatedCount = 0

        for (const apu of allApus) {
            // Get all insumos for this APU
            const insumos = await prisma.insumoEnAnalisis.findMany({
                where: { apuId: apu.id },
                include: { manoObra: true }
            })

            // Calculate costoDirecto
            const costoDirecto = Math.round(
                insumos.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100
            ) / 100

            // Calculate herramientaMenor (3% of MO subtotal)
            const subtotalMO = insumos
                .filter(i => i.manoObraId)
                .reduce((acc, curr) => acc + (curr.costoParcial || 0), 0)
            const herramientaMenor = Math.round((subtotalMO * 0.03) * 100) / 100

            // Get APU settings
            const porcentajeSobrecosto = apu.porcentajeSobrecosto ?? 0.25
            const factorEquipoSeguridad = (apu as any).factorEquipoSeguridad ?? 0

            // Calculate safety equipment (% of MO subtotal)
            const equipoSeguridad = Math.round((subtotalMO * factorEquipoSeguridad) * 100) / 100

            // Calculate final price with surcharge
            // FIX: costoDirecto should store only the raw sum of insumos. Indirects are calculated on demand.
            // const costoDirectoTotal = costoDirecto + herramientaMenor // OLD BUGGY LINE

            const precioUnitario = Math.round(((costoDirecto + herramientaMenor + equipoSeguridad) * (1 + porcentajeSobrecosto)) * 100) / 100

            // Update APU
            await prisma.analisisPrecioUnitario.update({
                where: { id: apu.id },
                data: { costoDirecto, precioUnitario }
            })

            updatedCount++
        }

        return NextResponse.json({
            success: true,
            message: `Successfully recalculated ${updatedCount} APU records`,
            updatedCount
        })
    } catch (error) {
        console.error("Error recalculating APU prices:", error)
        return NextResponse.json(
            { error: "Failed to recalculate APU prices" },
            { status: 500 }
        )
    }
}
