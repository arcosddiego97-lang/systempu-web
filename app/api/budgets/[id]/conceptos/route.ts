import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { recalculateBudgetTotal } from "@/lib/budget-utils"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const budgetId = parseInt(id)
        const body = await request.json()
        const { apuId, cantidad } = body

        if (!apuId || !cantidad) {
            return NextResponse.json({ error: "APU and Cantidad are required" }, { status: 400 })
        }

        const apu = await prisma.analisisPrecioUnitario.findUnique({
            where: { id: apuId }
        })

        if (!apu) return NextResponse.json({ error: "APU not found" }, { status: 404 })

        const importe = (apu.precioUnitario || 0) * parseFloat(cantidad)

        const newConcept = await prisma.conceptoPresupuesto.create({
            data: {
                presupuestoId: budgetId,
                apuId: apuId,
                cantidad: parseFloat(cantidad),
                importe: importe
            }
        })

        await recalculateBudgetTotal(budgetId)

        return NextResponse.json(newConcept, { status: 201 })
    } catch (error) {
        console.error("Error adding concept to budget:", error)
        return NextResponse.json({ error: "Failed to add concept" }, { status: 500 })
    }
}
