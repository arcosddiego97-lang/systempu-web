"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDown, FileSpreadsheet, FileText, Calculator, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// Types to avoid implicit any and follow linting
interface APU {
    codigo: string
    descripcion: string
    unidad: string
    precioUnitario: number
}

interface Budget {
    id: number
    nombre: string
    proyecto: { nombre: string }
    montoTotal: number
}

interface ManoObra {
    clave: string
    descripcion: string
    unidad: string
    salarioBase: number
    factorSalarioReal: number
    salarioReal: number
}

export default function ReportsPage() {
    const [loading, setLoading] = useState<string | null>(null)

    const generateConceptCatalogPDF = async () => {
        setLoading("PDF de Catálogo")
        try {
            const res = await fetch("/api/apu")
            const data: APU[] = await res.json()

            if (!data || data.length === 0) {
                alert("No hay conceptos para exportar.")
                setLoading(null)
                return
            }

            const doc = new jsPDF()
            doc.setFontSize(18)
            doc.text("Catálogo de Conceptos", 14, 22)
            doc.setFontSize(11)
            doc.setTextColor(100)
            doc.text("Sistema de Precios Unitarios - Reporte Oficial", 14, 30)

            const tableData = data.map(item => [
                item.codigo || "N/A",
                item.descripcion || "Sin descripción",
                item.unidad || "N/A",
                `$${(item.precioUnitario || 0).toFixed(2)}`
            ])

            autoTable(doc, {
                startY: 40,
                head: [["Código", "Descripción", "Unidad", "P. Unitario"]],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            })

            doc.save("catalogo_conceptos.pdf")
        } catch (err) {
            console.error("Concept Catalog Export Error:", err)
            alert("Error al generar el PDF del Catálogo.")
        } finally {
            setLoading(null)
        }
    }

    const generateBudgetExcel = async () => {
        setLoading("Excel de Presupuesto")
        try {
            const res = await fetch("/api/budgets")
            const data: Budget[] = await res.json()

            const worksheet = XLSX.utils.json_to_sheet(data.map(b => ({
                ID: b.id,
                Nombre: b.nombre,
                Proyecto: b.proyecto?.nombre || "N/A",
                Total: b.montoTotal
            })))

            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuestos")
            XLSX.writeFile(workbook, "presupuesto_detallado.xlsx")
        } catch (err) {
            console.error(err)
            alert("Error al generar el Excel")
        } finally {
            setLoading(null)
        }
    }

    const generateFASARPDF = async () => {
        setLoading("PDF FASAR")
        try {
            const res = await fetch("/api/mano-de-obra")
            const data: ManoObra[] = await res.json()

            const doc = new jsPDF()
            doc.setFontSize(18)
            doc.text("Análisis de Salario Real (FASAR)", 14, 22)
            doc.setFontSize(10)
            doc.text("De acuerdo con la Ley de Obras Públicas y Servicios Relacionados con las Mismas", 14, 30)

            const tableData = data.map(item => [
                item.clave || "N/A",
                item.descripcion || "Sin descripción",
                item.unidad || "N/A",
                `$${(item.salarioBase || 0).toFixed(2)}`,
                (item.factorSalarioReal || 1.0).toFixed(4),
                `$${(item.salarioReal || 0).toFixed(2)}`
            ])

            autoTable(doc, {
                startY: 40,
                head: [["Clave", "Categoría", "Unidad", "S. Base", "FASAR", "S. Real"]],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96], textColor: 255 },
            })

            doc.save("analisis_fasar.pdf")
        } catch (err) {
            console.error("FASAR Export Error:", err)
            alert("Error al generar el reporte FASAR. Verifique que existan registros de mano de obra.")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Reportes y Exportaciones</h1>
                <p className="text-muted-foreground italic">Documentación oficial para licitaciones de obra pública (LOPSRM).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:border-primary transition-all hover:shadow-lg">
                    <CardHeader>
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <CardTitle>Catálogo de Conceptos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Exportar el catálogo completo de conceptos con unidades, descripciones y volúmenes.</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={generateConceptCatalogPDF}
                            disabled={!!loading}
                        >
                            {loading === "PDF de Catálogo" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            Descargar PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary transition-all hover:shadow-lg">
                    <CardHeader>
                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-500" />
                        </div>
                        <CardTitle>Presupuesto Detallado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Análisis detallado de costos directos, indirectos y utilidad en formato estructurado.</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={generateBudgetExcel}
                            disabled={!!loading}
                        >
                            {loading === "Excel de Presupuesto" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            Descargar XLSX
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary transition-all hover:shadow-lg">
                    <CardHeader>
                        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mb-2">
                            <Calculator className="h-5 w-5 text-orange-500" />
                        </div>
                        <CardTitle>Análisis FASAR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Reporte oficial del Factor de Salario Real incluyendo prestaciones de ley (Art. 191).</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={generateFASARPDF}
                            disabled={!!loading}
                        >
                            {loading === "PDF FASAR" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            Descargar PDF
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 text-white">
                <CardHeader>
                    <CardTitle>Generador de Libros de Obra</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400 mb-6">Compile todos los reportes necesarios para su propuesta técnica y económica en un solo archivo.</p>
                    <Button className="bg-primary hover:bg-primary/90 text-white border-0">
                        Compilar Paquete Completo (.ZIP)
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
