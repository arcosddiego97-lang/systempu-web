import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const records = await prisma.presupuesto.findMany({
            orderBy: { fechaCreacion: 'desc' }
        })
        return NextResponse.json(records)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nombre, descripcion, proyectoId } = body

        if (!nombre || !proyectoId) {
            return NextResponse.json({ error: "Nombre and ProyectoId are required" }, { status: 400 })
        }

        const newRecord = await prisma.presupuesto.create({
            data: {
                nombre,
                descripcion,
                proyectoId: parseInt(proyectoId),
                montoTotal: 0
            }
        })

        return NextResponse.json(newRecord, { status: 201 })
    } catch (error) {
        console.error("Error creating budget:", error)
        return NextResponse.json({ error: "Failed to create budget" }, { status: 500 })
    }
}
