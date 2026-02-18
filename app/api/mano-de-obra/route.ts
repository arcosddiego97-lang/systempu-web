import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const records = await prisma.manoObra.findMany({
            orderBy: { fechaActualizacion: 'desc' }
        })
        return NextResponse.json(records)
    } catch (error) {
        console.error("Error fetching labor:", error)
        return NextResponse.json({ error: "Failed to fetch labor" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { clave, descripcion, unidad, salarioBase, factorSalarioReal, tipo } = body

        if (!clave || !descripcion || !unidad) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const fsr = (factorSalarioReal !== undefined && factorSalarioReal !== "") ? parseFloat(factorSalarioReal) : 1.0
        const sBase = (salarioBase !== undefined && salarioBase !== "") ? parseFloat(salarioBase) : 0
        const rawSalarioReal = sBase * fsr
        const sReal = Math.round(rawSalarioReal * 100) / 100

        const newRecord = await prisma.manoObra.create({
            data: {
                clave,
                descripcion,
                unidad,
                tipo: tipo || "INDIVIDUAL",
                salarioBase: sBase,
                factorSalarioReal: fsr,
                salarioReal: sReal,
            }
        })

        return NextResponse.json(newRecord, { status: 201 })
    } catch (error) {
        console.error("Error creating labor:", error)
        return NextResponse.json({ error: "Failed to create labor" }, { status: 500 })
    }
}
