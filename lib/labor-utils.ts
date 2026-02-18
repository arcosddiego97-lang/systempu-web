import { prisma } from "./db"

export async function recalculateCrewSalary(crewId: number) {
    const components = await prisma.componenteCuadrilla.findMany({
        where: { cuadrillaId: crewId },
        include: { integrante: true }
    })

    const totalSalarioReal = Math.round(components.reduce((acc, curr) => {
        const subtotal = (curr.integrante.salarioReal || 0) * curr.cantidad
        return acc + (Math.round(subtotal * 100) / 100)
    }, 0) * 100) / 100

    const totalSalarioBase = Math.round(components.reduce((acc, curr) => {
        const subtotal = (curr.integrante.salarioBase || 0) * curr.cantidad
        return acc + (Math.round(subtotal * 100) / 100)
    }, 0) * 100) / 100

    const updated = await prisma.manoObra.update({
        where: { id: crewId },
        data: {
            salarioBase: totalSalarioBase,
            salarioReal: totalSalarioReal,
            fechaActualizacion: new Date()
        }
    })

    // Recurse up: update any crews that use this crew as a component
    await updateParentCrews(crewId)

    return updated
}

export async function updateParentCrews(memberId: number) {
    const parentCrews = await prisma.componenteCuadrilla.findMany({
        where: { integranteId: memberId }
    })

    for (const pc of parentCrews) {
        // We don't use recalculateCrewSalary here directly to avoid infinite loops 
        // if someone manages to create a circular dependency (though we should prevent that UI-side)
        // But for safety, prisma.manoObra.update inside recalculateCrewSalary is fine.

        const components = await prisma.componenteCuadrilla.findMany({
            where: { cuadrillaId: pc.cuadrillaId },
            include: { integrante: true }
        })

        const totalSalarioReal = Math.round(components.reduce((acc: number, curr: any) => {
            const subtotal = (curr.integrante.salarioReal || 0) * curr.cantidad
            return acc + (Math.round(subtotal * 100) / 100)
        }, 0) * 100) / 100

        const totalSalarioBase = Math.round(components.reduce((acc: number, curr: any) => {
            const subtotal = (curr.integrante.salarioBase || 0) * curr.cantidad
            return acc + (Math.round(subtotal * 100) / 100)
        }, 0) * 100) / 100

        await prisma.manoObra.update({
            where: { id: pc.cuadrillaId },
            data: {
                salarioBase: totalSalarioBase,
                salarioReal: totalSalarioReal,
                fechaActualizacion: new Date()
            }
        })

        // Recurse up
        await updateParentCrews(pc.cuadrillaId)
    }
}
