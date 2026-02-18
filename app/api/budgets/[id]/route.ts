import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { recalculateBudgetTotal } from "@/lib/budget-utils"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const {
            nombre,
            descripcion,
            porcentajeIndirectos,
            porcentajeFinanciamiento,
            porcentajeUtilidad,
            porcentajeCargosAdicionales
        } = body

        const updated = await prisma.presupuesto.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion,
                porcentajeIndirectos: porcentajeIndirectos !== undefined ? parseFloat(porcentajeIndirectos) : undefined,
                porcentajeFinanciamiento: porcentajeFinanciamiento !== undefined ? parseFloat(porcentajeFinanciamiento) : undefined,
                porcentajeUtilidad: porcentajeUtilidad !== undefined ? parseFloat(porcentajeUtilidad) : undefined,
                porcentajeCargosAdicionales: porcentajeCargosAdicionales !== undefined ? parseFloat(porcentajeCargosAdicionales) : undefined,
            }
        })

        // Recalculate total as percentages changed
        await recalculateBudgetTotal(parseInt(id))

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error updating budget:", error)
        return NextResponse.json({ error: "Failed to update budget" }, { status: 500 })
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const record = await prisma.presupuesto.findUnique({
            where: { id: parseInt(id) },
            include: {
                proyecto: true,
                conceptos: {
                    include: {
                        apu: true
                    }
                }
            }
        })
        return NextResponse.json(record)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.presupuesto.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 })
    }
}
