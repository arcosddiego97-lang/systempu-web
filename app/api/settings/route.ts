import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        let config = await prisma.configuracion.findUnique({
            where: { id: 1 }
        })

        if (!config) {
            config = await prisma.configuracion.create({
                data: { id: 1 }
            })
        }

        return NextResponse.json(config)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()

        let config = await prisma.configuracion.update({
            where: { id: 1 },
            data: {
                nombreEmpresa: body.nombreEmpresa,
                direccion: body.direccion,
                correoContacto: body.correoContacto,
                iva: body.iva !== undefined ? parseFloat(body.iva) / 100 : undefined,
                surchargeDefault: body.surchargeDefault !== undefined ? parseFloat(body.surchargeDefault) / 100 : undefined
            }
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
    }
}
