import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { clave, descripcion, unidad, costoHorario } = body

        const updated = await prisma.maquinaria.update({
            where: { id: parseInt(id) },
            data: {
                clave,
                descripcion,
                unidad,
                costoHorario: parseFloat(costoHorario),
                fechaActualizacion: new Date()
            }
        })

        return NextResponse.json(updated)
    } catch (_error) {
        return NextResponse.json({ error: "Failed to update equipment record" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.maquinaria.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json({ error: "Failed to delete equipment record" }, { status: 500 })
    }
}
