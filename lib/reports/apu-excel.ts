import * as XLSX from "xlsx"

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
}

export const exportAPUToExcel = (apu: APUDetail) => {
    // Prepare data rows
    const rows: any[][] = [
        ["H. AYUNTAMIENTO MUNICIPAL CONSTITUCIONAL"],
        ["DIRECCIÓN DE OBRAS PUBLICAS"],
        [""],
        ["OBRA:", ""],
        ["LOCALIDAD:", ""],
        ["MUNICIPIO:", ""],
        [""],
        ["ANÁLISIS DE PRECIOS UNITARIOS"],
        [""],
        ["Código", apu.codigo, "Concepto", apu.descripcion, "Unidad", apu.unidad],
        [""],
        ["Clave", "Descripción", "Unidad", "Costo Unitario", "Cantidad", "Importe", "%"]
    ]

    const addSection = (title: string, items: Insumo[]) => {
        if (items.length === 0) return
        rows.push([""])
        rows.push([title])

        items.forEach(item => {
            const data = item.material || item.manoObra || item.maquinaria || item.insumoApu
            const clave = item.material?.clave || item.manoObra?.clave || item.maquinaria?.clave || item.insumoApu?.codigo

            let costoU = 0
            if (item.material) costoU = item.material.costo
            else if (item.manoObra) costoU = item.manoObra.salarioReal
            else if (item.maquinaria) costoU = item.maquinaria.costoHorario
            else if (item.insumoApu) costoU = item.insumoApu.precioUnitario

            rows.push([
                clave || "",
                data?.descripcion || "",
                data?.unidad || "",
                costoU,
                item.cantidad,
                item.costoParcial || 0,
                ""
            ])
        })

        const subtotal = Math.round(items.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100
        rows.push(["", "", "", "", `Subtotal ${title}`, subtotal, ""])
    }

    const materiales = apu.insumos.filter(i => i.material)
    const manoObra = apu.insumos.filter(i => i.manoObra)
    const equipo = apu.insumos.filter(i => i.maquinaria)
    const basicos = apu.insumos.filter(i => i.insumoApu)

    const subtotalMO = Math.round(manoObra.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) * 100) / 100
    const herramMenorImporte = Math.round((subtotalMO * 0.03) * 100) / 100

    addSection("MATERIALES", materiales)
    addSection("MANO DE OBRA", manoObra)

    // Custom Equip section to include MT
    rows.push([""])
    rows.push(["EQUIPO Y HERRAMIENTA"])
    if (herramMenorImporte > 0) {
        rows.push(["HME-01", "HERRAMIENTA MENOR (3% DE MO)", "(%)", subtotalMO, 0.03, herramMenorImporte, ""])
    }
    equipo.forEach(item => {
        const data = item.maquinaria
        rows.push([data?.clave || "", data?.descripcion || "", data?.unidad || "", data?.costoHorario || 0, item.cantidad, item.costoParcial || 0, ""])
    })
    const subtotalEQP = Math.round((equipo.reduce((acc, curr) => acc + (curr.costoParcial || 0), 0) + herramMenorImporte) * 100) / 100
    rows.push(["", "", "", "", `Subtotal EQUIPO Y HERRAMIENTA`, subtotalEQP, ""])

    addSection("BÁSICOS Y AUXILIARES", basicos)

    const costoDirectoTotal = (apu.costoDirecto || 0) + herramMenorImporte
    const factorSobrecosto = (apu as any).porcentajeSobrecosto !== undefined ? (apu as any).porcentajeSobrecosto : 0.25
    const montoSobrecosto = Math.round((costoDirectoTotal * factorSobrecosto) * 100) / 100
    const precioUnitarioFinal = costoDirectoTotal + montoSobrecosto

    rows.push([""])
    rows.push(["", "", "", "", "COSTO DIRECTO", costoDirectoTotal, ""])
    rows.push(["", "", "", "", `FACTOR DE SOBRECOSTO (+${(factorSobrecosto * 100).toFixed(2)}%)`, montoSobrecosto, ""])
    rows.push(["", "", "", "", "PRECIO UNITARIO", precioUnitarioFinal, ""])

    rows.push(["", "", "", "", "", "", ""])
    rows.push(["", "", "", "", "", "", ""])
    rows.push(["", "Elaboró:", "", "Revisó:", "", "Vo. Bo.:", ""])
    rows.push(["", "", "", "", "", "", ""])
    rows.push(["", "____________________", "", "____________________", "", "____________________", ""])

    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    // Set column widths for better readability
    const wscols = [
        { wch: 15 }, // Clave
        { wch: 50 }, // Descripción
        { wch: 10 }, // Unidad
        { wch: 15 }, // Costo Unitario
        { wch: 15 }, // Cantidad
        { wch: 15 }, // Importe
        { wch: 8 }   // %
    ]
    worksheet["!cols"] = wscols

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Integración")

    // Export
    XLSX.writeFile(workbook, `APU_${apu.codigo}.xlsx`)
}
