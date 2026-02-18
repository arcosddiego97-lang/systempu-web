/**
 * Indirect Costs Logic (Cascading)
 * According to Mexican standard behavior:
 * 1. Base = Costo Directo (CD)
 * 2. Indirectos = CD * %Indirectos
 * 3. Subtotal 1 = CD + Indirectos
 * 4. Financiamiento = Subtotal 1 * %Financiamiento
 * 5. Subtotal 2 = Subtotal 1 + Financiamiento
 * 6. Utilidad = Subtotal 2 * %Utilidad
 * 7. Precio Unitario Final = Subtotal 2 + Utilidad + Cargos Adicionales
 */

interface IndirectParams {
    pIndirectos: number    // Decimal (e.g., 0.15 for 15%)
    pFinanciamiento: number
    pUtilidad: number
    pCargosAdicionales: number
}

export function integratePrice(directCost: number, params: IndirectParams) {
    const indirects = directCost * params.pIndirectos
    const subtotal1 = directCost + indirects

    const financing = subtotal1 * params.pFinanciamiento
    const subtotal2 = subtotal1 + financing

    const profit = subtotal2 * params.pUtilidad
    const charges = (subtotal2 + profit) * params.pCargosAdicionales

    const total = subtotal2 + profit + charges

    return {
        directCost,
        indirects,
        financing,
        profit,
        charges,
        total: parseFloat(total.toFixed(2))
    }
}
