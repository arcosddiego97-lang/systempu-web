import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const records = await prisma.proyecto.findMany({
            orderBy: { id: 'desc' }
        })
        return NextResponse.json(records)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nombre, cliente, ubicacion, clave, responsable } = body

        if (!nombre) return NextResponse.json({ error: "Nombre is required" }, { status: 400 })

        const newRecord = await prisma.proyecto.create({
            data: {
                nombre,
                cliente,
                ubicacion,
                clave,
                responsable,
            }
        })

        return NextResponse.json(newRecord, { status: 201 })
    } catch (error) {
        console.error("Error creating project:", error)
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }
}
