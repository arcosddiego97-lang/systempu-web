import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Insumo {
    id: number
    cantidad: number
    costoParcial: number | null
    material?: { clave: string; descripcion: string; costo: number; unidad: string } | null
    manoObra?: { clave: string; descripcion: string; salarioReal: number; unidad: string } | null
    maquinaria?: { clave: string; descripcion: string; costoHorario: number; unidad: string } | null
    insumoApu?: { codigo: string; descripcion: string; precioUnitario: number; unidad: string } | null
}

interface APUDetail {
    codigo: string
    descripcion: string
    unidad: string
    costoDirecto: number | null
    insumos: Insumo[]
    porcentajeSobrecosto?: number
}

export const generateDetailedAPUReport = (apu: APUDetail, config?: any) => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter"
    })

    const margin = 14
    const pageWidth = doc.internal.pageSize.getWidth()

    // --- Header ---
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(margin, 10, pageWidth - (margin * 2), 35) // Main header box

    // Logos placeholder (H. Ayuntamiento and State/Logo)
    // Headers from config
    const company = config?.nombreEmpresa || "H. AYUNTAMIENTO MUNICIPAL CONSTITUCIONAL"
    const department = config?.correoContacto ? `CONTACTO: ${config.correoContacto.toUpperCase()}` : "DIRECCIÓN DE OBRAS PUBLICAS"

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(company, pageWidth / 2, 18, { align: "center" })
    doc.text(department, pageWidth / 2, 25, { align: "center" })

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("OBRA:", margin + 2, 35)
    doc.text("LOCALIDAD:", margin + 2, 40)
    doc.text("MUNICIPIO:", margin + 2, 45)

    // --- Title ---
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("ANÁLISIS DE PRECIOS UNITARIOS", pageWidth / 2, 55, { align: "center" })

    // --- APU General Info ---
    const apuHeaderData = [
        ["Código", "Concepto", "Unidad", "Costo", "Cantidad", "Importe", "%"]
    ]

    autoTable(doc, {
        startY: 58,
        head: apuHeaderData,
        body: [[
            apu.codigo,
            apu.descripcion,
            apu.unidad,
            "", "", "", ""
        ]],
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96], textColor: 255, halign: 'center' },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 15 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 15 }
        }
    })

    let currentY = (doc as any).lastAutoTable.finalY + 5

    // --- Resource Grouping Helper ---
    const renderSection = (title: string, items: any[]) => {
        if (items.length === 0) return

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(title, margin, currentY)
        currentY += 2

        const tableData = items.map(item => {
            if (item.isHerramientaMenor) {
                return [
                    item.clave,
                    item.descripcion,
                    item.unidad,
                    `$${item.costoU.toFixed(2)}`,
                    item.cantidad.toFixed(6),
                    `$${item.costoParcial.toFixed(2)}`,
                    ""
                ]
            }
            const data = item.material || item.manoObra || item.maquinaria || item.insumoApu
            const clave = item.material?.clave || item.manoObra?.clave || item.maquinaria?.clave || item.insumoApu?.codigo

            let costoU = 0
            if (item.material) costoU = item.material.costo
            else if (item.manoObra) costoU = item.manoObra.salarioReal
            else if (item.maquinaria) costoU = item.maquinaria.costoHorario
            else if (item.insumoApu) costoU = item.insumoApu.precioUnitario

            return [
                clave,
                data.descripcion,
                data.unidad,
                `$${(costoU || 0).toFixed(2)}`,
                item.cantidad.toFixed(6),
                `$${(Math.round((item.costoParcial || 0) * 100) / 100).toFixed(2)}`,
                ""
            ]
        })

        autoTable(doc, {
            startY: currentY,
            body: tableData,
            theme: 'plain',
            styles: { fontSize: 7, cellPadding: 1 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 20, halign: 'right' },
                4: { cellWidth: 20, halign: 'right' },
                5: { cellWidth: 20, halign: 'right' },
                6: { cellWidth: 15, halign: 'center' }
            }
        })

        const subtotal = Math.round(items.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100
        currentY = (doc as any).lastAutoTable.finalY

        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(`Subtotal: ${title}`, pageWidth - 80, currentY + 4)
        doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin, currentY + 4, { align: "right" })

        currentY += 8
    }

    // Filter items
    const materiales = apu.insumos.filter(i => i.material)
    const manoObra = apu.insumos.filter(i => i.manoObra)
    const equipo = apu.insumos.filter(i => i.maquinaria)
    const basicos = apu.insumos.filter(i => i.insumoApu)

    const subtotalMO = Math.round(manoObra.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100
    const herramMenorImporte = Math.round((subtotalMO * 0.03) * 100) / 100
    const equipoConHerramienta = herramMenorImporte > 0
        ? [{
            isHerramientaMenor: true,
            clave: "HME-01",
            descripcion: "HERRAMIENTA MENOR (3% DE MO)",
            unidad: "(%)",
            costoU: subtotalMO,
            cantidad: 0.03,
            costoParcial: herramMenorImporte
        }, ...equipo]
        : equipo

    renderSection("MATERIALES", materiales)
    renderSection("MANO DE OBRA", manoObra)
    renderSection("EQUIPO Y HERRAMIENTA", equipoConHerramienta)
    renderSection("BÁSICOS Y AUXILIARES", basicos)

    const costoDirectoTotal = (apu.costoDirecto || 0) + herramMenorImporte

    const factorSobrecosto = (apu as any).porcentajeSobrecosto !== undefined ? (apu as any).porcentajeSobrecosto : 0.25
    const montoSobrecosto = Math.round((costoDirectoTotal * factorSobrecosto) * 100) / 100
    const precioUnitarioFinal = costoDirectoTotal + montoSobrecosto

    // --- Footer Summary ---
    doc.setLineWidth(0.2)
    doc.line(pageWidth - 60, currentY, pageWidth - margin, currentY)
    currentY += 4
    doc.setFontSize(9)
    doc.text("Costo Directo", pageWidth - 80, currentY)
    doc.text(`$${costoDirectoTotal.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" })

    currentY += 6
    doc.setFont("helvetica", "italic")
    doc.text(`Factor de Sobrecosto (+${(factorSobrecosto * 100).toFixed(2)}%)`, pageWidth - 80, currentY)
    doc.text(`$${montoSobrecosto.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" })

    currentY += 10
    doc.setFont("helvetica", "bold")
    doc.line(pageWidth - 60, currentY, pageWidth - margin, currentY)
    currentY += 4
    doc.setFontSize(10)
    doc.text("PRECIO UNITARIO", pageWidth - 80, currentY, { maxWidth: 60 })
    doc.text(`$${precioUnitarioFinal.toFixed(2)}`, pageWidth - margin, currentY, { align: "right" })

    // --- Signatures ---
    const bottomY = doc.internal.pageSize.getHeight() - 40
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")

    // Position signatures
    const sigWidth = (pageWidth - (margin * 2)) / 3

    doc.text("Elaboró:", margin + (sigWidth / 2), bottomY, { align: "center" })
    doc.text("Revisó:", margin + sigWidth + (sigWidth / 2), bottomY, { align: "center" })

    doc.text("Vo. Bo.:", pageWidth / 2, bottomY + 20, { align: "center" })

    doc.save(`APU_${apu.codigo}.pdf`)
}
