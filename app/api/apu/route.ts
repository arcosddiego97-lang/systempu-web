import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const tipo = searchParams.get("tipo") || "MATRIZ"

        const records = await prisma.analisisPrecioUnitario.findMany({
            where: { tipo },
            orderBy: { fechaActualizacion: 'desc' }
        })
        return NextResponse.json(records)
    } catch (error) {
        console.error("Error fetching APUs:", error)
        return NextResponse.json({ error: "Failed to fetch APUs" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { codigo, descripcion, unidad, tipo = "MATRIZ", porcentajeSobrecosto } = body

        if (!codigo || !descripcion || !unidad) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const surcharge = porcentajeSobrecosto !== undefined ? parseFloat(porcentajeSobrecosto) / 100 : undefined

        const newRecord = await prisma.analisisPrecioUnitario.create({
            data: {
                codigo,
                descripcion,
                unidad,
                tipo,
                costoDirecto: 0,
                porcentajeSobrecosto: surcharge
            }
        })

        return NextResponse.json(newRecord, { status: 201 })
    } catch (error) {
        console.error("Error creating APU:", error)
        return NextResponse.json({ error: "Failed to create APU" }, { status: 500 })
    }
}
