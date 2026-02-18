import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { clave, descripcion, unidad, costo } = body

        if (!clave || !descripcion || !unidad || costo === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const updated = await prisma.material.update({
            where: { id: parseInt(id) },
            data: {
                clave,
                descripcion,
                unidad,
                costo: parseFloat(costo),
                fechaActualizacion: new Date()
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error updating material:", error)
        return NextResponse.json({ error: "Failed to update material" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // Check if there are related items in APU analyses first
        const count = await prisma.insumoEnAnalisis.count({
            where: { materialId: parseInt(id) }
        })

        if (count > 0) {
            return NextResponse.json({
                error: "No se puede eliminar: Este material está siendo utilizado en uno o más análisis APU."
            }, { status: 400 })
        }

        await prisma.material.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting material:", error)
        return NextResponse.json({ error: "Failed to delete material" }, { status: 500 })
    }
}
