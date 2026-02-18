import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const apuId = parseInt(id)
        const insumos = await prisma.insumoEnAnalisis.findMany({
            where: { apuId },
            include: {
                material: true,
                manoObra: true,
                maquinaria: true,
                insumoApu: true,
            }
        })
        return NextResponse.json(insumos)
    } catch (error) {
        console.error("Error fetching APU insumos:", error)
        return NextResponse.json({ error: "Failed to fetch insumos" }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const apuId = parseInt(id)
        const body = await request.json()
        const { materialId, manoObraId, maquinariaId, insumoApuId, cantidad } = body

        if (!cantidad) {
            return NextResponse.json({ error: "Cantidad is required" }, { status: 400 })
        }

        // Determine cost to snapshot
        let costoUnitario = 0
        if (materialId) {
            const m = await prisma.material.findUnique({ where: { id: materialId } })
            costoUnitario = m?.costo || 0
        } else if (manoObraId) {
            const l = await prisma.manoObra.findUnique({ where: { id: manoObraId } })
            costoUnitario = l?.salarioReal || l?.salarioBase || 0
        } else if (maquinariaId) {
            const e = await prisma.maquinaria.findUnique({ where: { id: maquinariaId } })
            costoUnitario = e?.costoHorario || 0
        } else if (insumoApuId) {
            const a = await prisma.analisisPrecioUnitario.findUnique({ where: { id: insumoApuId } })
            costoUnitario = a?.precioUnitario || 0
        }

        const newInsumo = await prisma.insumoEnAnalisis.create({
            data: {
                apuId,
                materialId,
                manoObraId,
                maquinariaId,
                insumoApuId,
                cantidad: parseFloat(cantidad),
                costoParcial: Math.round((costoUnitario * parseFloat(cantidad)) * 100) / 100
            }
        })


        // Update APU total cost
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

        return NextResponse.json(newInsumo, { status: 201 })
    } catch (error) {
        console.error("Error adding insumo to APU:", error)
        return NextResponse.json({ error: "Failed to add insumo" }, { status: 500 })
    }
}
