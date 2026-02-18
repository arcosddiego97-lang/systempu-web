import { prisma } from "./db"

export async function recalculateBudgetTotal(budgetId: number) {
    const budget = await prisma.presupuesto.findUnique({
        where: { id: budgetId },
        include: { conceptos: true }
    })

    if (!budget) return

    // 1. Direct Cost (Sum of all concepts)
    const directCost = Math.round(budget.conceptos.reduce((acc, c) => acc + (c.importe || 0), 0) * 100) / 100

    // 2. Cascade calculations based on persisted coefficients with intermediate rounding
    const indirectAmount = Math.round((directCost * budget.porcentajeIndirectos) * 100) / 100
    const subtotal1 = Math.round((directCost + indirectAmount) * 100) / 100

    const financingAmount = Math.round((subtotal1 * budget.porcentajeFinanciamiento) * 100) / 100
    const subtotal2 = Math.round((subtotal1 + financingAmount) * 100) / 100

    const profitAmount = Math.round((subtotal2 * budget.porcentajeUtilidad) * 100) / 100
    const subtotal3 = Math.round((subtotal2 + profitAmount) * 100) / 100

    const additionalCharges = Math.round((subtotal3 * budget.porcentajeCargosAdicionales) * 100) / 100
    const total = Math.round((subtotal3 + additionalCharges) * 100) / 100

    return await prisma.presupuesto.update({
        where: { id: budgetId },
        data: { montoTotal: total }
    })
}
