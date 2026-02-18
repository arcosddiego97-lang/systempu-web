"use client"

import React from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, X, Loader2 } from "lucide-react"
import { generateDetailedAPUReport } from "@/lib/reports/apu-report"
import { exportAPUToExcel } from "@/lib/reports/apu-excel"

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

interface Props {
    apu: APUDetail | null
    isOpen: boolean
    onClose: () => void
    config?: any
}

export function APUReportPreview({ apu, isOpen, onClose, config }: Props) {
    if (!apu || !apu.insumos) return null

    const materiales = apu.insumos.filter(i => i.material)
    const manoObra = apu.insumos.filter(i => i.manoObra)
    const maquinaria = apu.insumos.filter(i => i.maquinaria)
    const basicos = apu.insumos.filter(i => i.insumoApu)

    const subtotalMO = manoObra.reduce((acc, i) => acc + (i.costoParcial || 0), 0)
    const herramMenorImporte = Math.round((subtotalMO * 0.03) * 100) / 100
    const factorSobrecosto = (apu as any).porcentajeSobrecosto !== undefined ? (apu as any).porcentajeSobrecosto : 0.25

    // Inject Herramienta Menor for visual consistency in preview
    const equipo = herramMenorImporte > 0 ? [
        {
            id: -1,
            maquinaria: { clave: "HME-01", descripcion: "HERRAMIENTA MENOR (3% DE MO)", unidad: "(%)", costoHorario: subtotalMO },
            cantidad: 0.03,
            costoParcial: herramMenorImporte
        } as any,
        ...maquinaria
    ] : maquinaria

    const costoDirectoTotal = (apu.costoDirecto || 0) + herramMenorImporte
    const totalConSobrecosto = Math.round((costoDirectoTotal * (1 + factorSobrecosto)) * 100) / 100

    const renderTable = (title: string, items: Insumo[]) => {
        if (items.length === 0) return null
        return (
            <div className="space-y-2 mt-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{title}</h4>
                <div className="rounded-xl border border-slate-200/60 overflow-hidden text-[11px] shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/80 backdrop-blur-md border-b border-slate-200/60 text-slate-700">
                            <tr>
                                <th className="px-3 py-2 font-black uppercase text-[9px] tracking-wider">Clave</th>
                                <th className="px-3 py-2 font-black uppercase text-[9px] tracking-wider">Descripción</th>
                                <th className="px-3 py-2 text-right font-black uppercase text-[9px] tracking-wider">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map(item => {
                                const data = item.material || item.manoObra || item.maquinaria || item.insumoApu
                                const clave = item.material?.clave || item.manoObra?.clave || item.maquinaria?.clave || item.insumoApu?.codigo
                                return (
                                    <tr key={item.id} className="bg-white/80 hover:bg-white/95 transition-colors">
                                        <td className="px-3 py-2 font-mono font-bold text-blue-700">{clave}</td>
                                        <td className="px-3 py-2 text-slate-700 font-medium truncate max-w-[200px]">{data?.descripcion}</td>
                                        <td className="px-3 py-2 text-right font-bold text-slate-900">${(item.costoParcial || 0).toFixed(2)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Vista Previa: ${apu.codigo}`}>
            <div className="max-h-[70vh] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar p-1">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm mb-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Concepto</p>
                                <p className="text-sm font-bold text-slate-900 leading-snug">{apu.descripcion}</p>
                            </div>
                            <div className="text-right col-span-1 border-l border-slate-200/50 pl-4">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Unidad</p>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-blue-100/50 text-blue-700 rounded-lg font-black text-xs">
                                    {apu.unidad}
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderTable("Materiales", materiales)}
                    {renderTable("Mano de Obra", manoObra)}
                    {renderTable("Equipo y Herramienta", equipo)}
                    {renderTable("Básicos / Auxiliares", basicos)}

                    <div className="mt-6 pt-4 border-t border-slate-200/50 flex flex-col gap-2 bg-slate-50/50 rounded-xl p-4">
                        <div className="flex justify-between items-center text-xs text-slate-600">
                            <span className="font-medium">Costo Directo</span>
                            <span className="font-bold font-mono">${costoDirectoTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Factor de Sobrecosto (+{(factorSobrecosto * 100).toFixed(2)}%)</span>
                            <span className="font-mono">${(costoDirectoTotal * factorSobrecosto).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-200/50">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Precio Unitario</span>
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 tracking-tighter">
                                ${totalConSobrecosto.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => exportAPUToExcel(apu)}
                        className="flex-1 gap-2 border-green-200 text-green-700 hover:bg-green-50 rounded-xl font-bold transition-all text-xs"
                    >
                        <FileSpreadsheet className="h-4 w-4" /> Excel
                    </Button>
                    <Button
                        onClick={() => generateDetailedAPUReport(apu, config)}
                        className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold transition-all text-xs"
                    >
                        <FileText className="h-4 w-4" /> PDF
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
