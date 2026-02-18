import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const records = await prisma.maquinaria.findMany({
            orderBy: { fechaActualizacion: 'desc' }
        })
        return NextResponse.json(records)
    } catch (error) {
        console.error("Error fetching equipment:", error)
        return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { clave, descripcion, unidad, costoHorario } = body

        if (!clave || !descripcion || !unidad || costoHorario === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const newRecord = await prisma.maquinaria.create({
            data: {
                clave,
                descripcion,
                unidad,
                costoHorario: parseFloat(costoHorario),
            }
        })

        return NextResponse.json(newRecord, { status: 201 })
    } catch (error) {
        console.error("Error creating equipment:", error)
        return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
    }
}
