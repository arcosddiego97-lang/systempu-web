import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { updateParentCrews } from "@/lib/labor-utils"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { clave, descripcion, unidad, salarioBase, factorSalarioReal, tipo } = body

        const fsr = (factorSalarioReal !== undefined && factorSalarioReal !== "") ? parseFloat(factorSalarioReal) : 1.0
        const sBase = (salarioBase !== undefined && salarioBase !== "") ? parseFloat(salarioBase) : 0
        const rawSalarioReal = sBase * fsr
        const sReal = Math.round(rawSalarioReal * 100) / 100

        const updated = await prisma.manoObra.update({
            where: { id: parseInt(id) },
            data: {
                clave,
                descripcion,
                unidad,
                tipo,
                salarioBase: sBase,
                factorSalarioReal: fsr,
                salarioReal: sReal,
                fechaActualizacion: new Date()
            }
        })

        await updateParentCrews(parseInt(id))

        return NextResponse.json(updated)
    } catch (_error) {
        return NextResponse.json({ error: "Failed to update labor record" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.manoObra.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json({ error: "Failed to delete labor record" }, { status: 500 })
    }
}
