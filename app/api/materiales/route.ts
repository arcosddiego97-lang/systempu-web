import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const materiales = await prisma.material.findMany({
            orderBy: { fechaActualizacion: 'desc' }
        })
        return NextResponse.json(materiales)
    } catch (error) {
        console.error("Error fetching materials:", error)
        return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { clave, descripcion, unidad, costo } = body

        if (!clave || !descripcion || !unidad || costo === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const newMaterial = await prisma.material.create({
            data: {
                clave,
                descripcion,
                unidad,
                costo: parseFloat(costo),
            }
        })

        return NextResponse.json(newMaterial, { status: 201 })
    } catch (error) {
        console.error("Error creating material:", error)
        return NextResponse.json({ error: "Failed to create material" }, { status: 500 })
    }
}
