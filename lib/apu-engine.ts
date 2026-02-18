/**
 * FASAR Calculation Logic (Art. 191 RLOPSRM)
 * This is a simplified version of the Mexican FASAR calculation.
 * Real FASAR involves:
 * - Days of the year (365)
 * - Non-working days (Sundays, Holidays, Weather, etc.)
 * - Paid days
 * - Social security contributions (IMSS, Infonavit, SAR)
 */

interface FasarParams {
    diasCalendario: number      // Usually 365 or 366
    diasAguinaldo: number       // Min 15
    primaVacacional: number     // Min 25% (0.25)
    diasVacaciones: number      // Min 12 (Year 1)
    factorCuotasPatronales: number // Approx 0.20 - 0.35 depending on risk
}

const DEFAULT_PARAMS: FasarParams = {
    diasCalendario: 365,
    diasAguinaldo: 15,
    primaVacacional: 0.25,
    diasVacaciones: 12,
    factorCuotasPatronales: 0.28 // Example value
}

/**
 * Calculates the Factor de Salario Real (FASAR)
 * Formula basic: FSR = (Ps * (Tp/Tl)) + (Tp/Tl)
 * Ps = Obligatory Social Security charges
 * Tp = Paid days
 * Tl = Worked days
 */
export function calculateFasar(params: FasarParams = DEFAULT_PARAMS): number {
    const { diasCalendario, diasAguinaldo, primaVacacional, diasVacaciones, factorCuotasPatronales } = params

    // Paid days (Tp)
    const tp = diasCalendario + diasAguinaldo + (diasVacaciones * primaVacacional)

    // Actually worked days (Tl)
    // Simplified: Subtract Sundays (52), Holidays (7), Vacations (12)
    const sundays = 52
    const holidays = 7
    const tl = diasCalendario - sundays - holidays - diasVacaciones

    if (tl <= 0) return 1.0

    const fsr = (tp / tl) + factorCuotasPatronales
    return parseFloat(fsr.toFixed(4))
}

/**
 * Calculates Direct Cost for an APU
 */
export function calculateDirectCost(items: { costo: number; cantidad: number }[]): number {
    return items.reduce((acc, item) => acc + (item.costo * item.cantidad), 0)
}
