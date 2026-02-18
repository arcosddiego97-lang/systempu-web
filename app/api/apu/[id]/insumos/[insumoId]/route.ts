import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; insumoId: string }> }
) {
    try {
        const { id, insumoId: insumoIdStr } = await params
        const apuId = parseInt(id)
        const insumoId = parseInt(insumoIdStr)
        const { cantidad } = await request.json()

        if (cantidad === undefined) {
            return NextResponse.json({ error: "Cantidad is required" }, { status: 400 })
        }

        // Get existing to find unit cost
        const existing = await prisma.insumoEnAnalisis.findUnique({
            where: { id: insumoId },
            include: {
                material: true,
                manoObra: true,
                maquinaria: true,
                insumoApu: true
            }
        })

        if (!existing) {
            return NextResponse.json({ error: "Insumo not found" }, { status: 404 })
        }

        let costoUnitario = 0
        if (existing.material) costoUnitario = existing.material.costo
        else if (existing.manoObra) costoUnitario = existing.manoObra.salarioReal || existing.manoObra.salarioBase || 0
        else if (existing.maquinaria) costoUnitario = existing.maquinaria.costoHorario || 0
        else if (existing.insumoApu) costoUnitario = existing.insumoApu.precioUnitario || 0

        const newCantidad = parseFloat(cantidad)
        const newCostoParcial = Math.round((costoUnitario * newCantidad) * 100) / 100

        await prisma.insumoEnAnalisis.update({
            where: { id: insumoId },
            data: {
                cantidad: newCantidad,
                costoParcial: newCostoParcial
            }
        })

        // Recalculate total for APU
        const allInsumos = await prisma.insumoEnAnalisis.findMany({
            where: { apuId },
            include: { manoObra: true }
        })
        const total = Math.round(allInsumos.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100

        // Calculate herramientaMenor (3% of MO subtotal)
        const subtotalMO = allInsumos
            .filter(i => i.manoObraId)
            .reduce((acc, curr) => acc + (curr.costoParcial || 0), 0)
        const herramientaMenor = Math.round((subtotalMO * 0.03) * 100) / 100

        // Get APU to retrieve porcentajeSobrecosto and factorEquipoSeguridad
        const apu = await prisma.analisisPrecioUnitario.findUnique({ where: { id: apuId } })
        const porcentajeSobrecosto = apu?.porcentajeSobrecosto ?? 0.25
        const factorEquipoSeguridad = apu?.factorEquipoSeguridad ?? 0

        // Calculate safety equipment (% of MO subtotal)
        const equipoSeguridad = Math.round((subtotalMO * factorEquipoSeguridad) * 100) / 100

        // Calculate final price with surcharge
        const costoDirectoTotal = total + herramientaMenor + equipoSeguridad
        const precioUnitario = Math.round((costoDirectoTotal * (1 + porcentajeSobrecosto)) * 100) / 100

        await prisma.analisisPrecioUnitario.update({
            where: { id: apuId },
            data: { costoDirecto: total, precioUnitario }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating insumo:", error)
        return NextResponse.json({ error: "Failed to update insumo" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; insumoId: string }> }
) {
    try {
        const { id, insumoId: insumoIdStr } = await params
        const apuId = parseInt(id)
        const insumoId = parseInt(insumoIdStr)

        await prisma.insumoEnAnalisis.delete({
            where: { id: insumoId }
        })

        // Recalculate total
        const allInsumos = await prisma.insumoEnAnalisis.findMany({
            where: { apuId },
            include: { manoObra: true }
        })
        const total = Math.round(allInsumos.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100

        // Calculate herramientaMenor (3% of MO subtotal)
        const subtotalMO = allInsumos
            .filter(i => i.manoObraId)
            .reduce((acc, curr) => acc + (curr.costoParcial || 0), 0)
        const herramientaMenor = Math.round((subtotalMO * 0.03) * 100) / 100

        // Get APU to retrieve porcentajeSobrecosto and factorEquipoSeguridad
        const apu = await prisma.analisisPrecioUnitario.findUnique({ where: { id: apuId } })
        const porcentajeSobrecosto = apu?.porcentajeSobrecosto ?? 0.25
        const factorEquipoSeguridad = apu?.factorEquipoSeguridad ?? 0

        // Calculate safety equipment (% of MO subtotal)
        const equipoSeguridad = Math.round((subtotalMO * factorEquipoSeguridad) * 100) / 100

        // Calculate final price with surcharge
        const costoDirectoTotal = total + herramientaMenor + equipoSeguridad
        const precioUnitario = Math.round((costoDirectoTotal * (1 + porcentajeSobrecosto)) * 100) / 100

        await prisma.analisisPrecioUnitario.update({
            where: { id: apuId },
            data: { costoDirecto: total, precioUnitario }
        })

        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json({ error: "Failed to delete insumo" }, { status: 500 })
    }
}
