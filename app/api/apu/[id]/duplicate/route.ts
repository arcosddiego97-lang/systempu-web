import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const sourceId = parseInt(idStr)

        // Get source APU with all insumos
        const sourceApu = await prisma.analisisPrecioUnitario.findUnique({
            where: { id: sourceId },
            include: {
                insumos: true
            }
        })

        if (!sourceApu) {
            return NextResponse.json({ error: "APU not found" }, { status: 404 })
        }

        // Create new APU with " - COPIA" suffix
        const newApu = await prisma.analisisPrecioUnitario.create({
            data: {
                codigo: `${sourceApu.codigo} - COPIA`,
                descripcion: sourceApu.descripcion,
                unidad: sourceApu.unidad,
                porcentajeSobrecosto: sourceApu.porcentajeSobrecosto,
                costoDirecto: 0,
                precioUnitario: 0
            }
        })

        // Copy all insumos
        for (const insumo of sourceApu.insumos) {
            await prisma.insumoEnAnalisis.create({
                data: {
                    apuId: newApu.id,
                    cantidad: insumo.cantidad,
                    costoParcial: insumo.costoParcial,
                    materialId: insumo.materialId,
                    manoObraId: insumo.manoObraId,
                    maquinariaId: insumo.maquinariaId,
                    insumoApuId: insumo.insumoApuId
                }
            })
        }

        // Recalculate totals for new APU
        const allInsumos = await prisma.insumoEnAnalisis.findMany({
            where: { apuId: newApu.id },
            include: { manoObra: true }
        })

        const costoDirecto = Math.round(
            allInsumos.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100
        ) / 100

        const subtotalMO = allInsumos
            .filter(i => i.manoObraId)
            .reduce((acc, curr) => acc + (curr.costoParcial || 0), 0)
        const herramientaMenor = Math.round((subtotalMO * 0.03) * 100) / 100

        const porcentajeSobrecosto = newApu.porcentajeSobrecosto ?? 0.25
        const costoDirectoTotal = costoDirecto + herramientaMenor
        const precioUnitario = Math.round((costoDirectoTotal * (1 + porcentajeSobrecosto)) * 100) / 100

        await prisma.analisisPrecioUnitario.update({
            where: { id: newApu.id },
            data: { costoDirecto, precioUnitario }
        })

        return NextResponse.json({ success: true, newId: newApu.id })
    } catch (error) {
        console.error("Error duplicating APU:", error)
        return NextResponse.json({ error: "Failed to duplicate APU" }, { status: 500 })
    }
}
