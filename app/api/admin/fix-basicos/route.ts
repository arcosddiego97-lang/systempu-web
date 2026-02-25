import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Temporary migration endpoint: fix precioUnitario of BASICO APUs
// Protected by a one-time secret token via x-admin-token header
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("x-admin-token")
        if (authHeader !== "systempu-fix-2024") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const basicos = await prisma.analisisPrecioUnitario.findMany({
            where: { tipo: "BASICO" }
        })

        const results: { id: number; codigo: string; from: number | null; to: number }[] = []

        for (const b of basicos) {
            const costoDirecto = b.costoDirecto || 0
            if (b.precioUnitario !== costoDirecto) {
                await prisma.analisisPrecioUnitario.update({
                    where: { id: b.id },
                    data: { precioUnitario: costoDirecto }
                })
                results.push({ id: b.id, codigo: b.codigo, from: b.precioUnitario, to: costoDirecto })
            }
        }

        return NextResponse.json({
            success: true,
            totalBasicos: basicos.length,
            corregidos: results.length,
            results
        })
    } catch (error) {
        console.error("Migration error:", error)
        return NextResponse.json({ error: "Migration failed" }, { status: 500 })
    }
}
