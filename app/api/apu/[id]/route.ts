import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const id = parseInt(idStr)
        const apu = await prisma.analisisPrecioUnitario.findUnique({
            where: { id },
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

        if (!apu) return NextResponse.json({ error: "Not found" }, { status: 404 })

        return NextResponse.json(apu)
    } catch (_error) {
        return NextResponse.json({ error: "Failed to fetch APU" }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const id = parseInt(idStr)
        const body = await request.json()
        const { codigo, descripcion, unidad, porcentajeSobrecosto, factorEquipoSeguridad } = body

        // Fetch current to use costoDirecto if not provided
        const current = await prisma.analisisPrecioUnitario.findUnique({
            where: { id }
        })

        if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

        let newPorcentaje = current.porcentajeSobrecosto
        let newFactorEquipo = current.factorEquipoSeguridad || 0

        if (porcentajeSobrecosto !== undefined) {
            // Handle both string "25" and number 25 or 0.25
            const val = parseFloat(porcentajeSobrecosto)
            // If the user sends "25", we want 0.25. If they send 0.25, we want 0.25.
            // Heuristic: if value > 1, assume it's a percentage (e.g. 25 -> 0.25)
            newPorcentaje = val > 1 ? val / 100 : val
        }

        if (factorEquipoSeguridad !== undefined) {
            const val = parseFloat(factorEquipoSeguridad)
            newFactorEquipo = val > 1 ? val / 100 : val
        }

        const costoDirecto = current.costoDirecto || 0
        const precioUnitario = Math.round((costoDirecto * (1 + (newPorcentaje || 0))) * 100) / 100

        const updated = await prisma.analisisPrecioUnitario.update({
            where: { id },
            data: {
                codigo,
                descripcion,
                unidad,
                porcentajeSobrecosto: newPorcentaje,
                factorEquipoSeguridad: newFactorEquipo,
                precioUnitario
            }
        })

        return NextResponse.json(updated)
    } catch (_error) {
        return NextResponse.json({ error: "Failed to update APU" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const id = parseInt(idStr)

        const session = await getSession()
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Delete all related insumos first
        await prisma.insumoEnAnalisis.deleteMany({
            where: { apuId: id }
        })

        // Delete the APU
        await prisma.analisisPrecioUnitario.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting APU:", error)
        return NextResponse.json({ error: "Failed to delete APU" }, { status: 500 })
    }
}
