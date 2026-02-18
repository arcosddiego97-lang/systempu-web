"use client"

import React, { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, CheckCircle2, ClipboardPaste, Trash2 } from "lucide-react"

interface ParsedItem {
    clave: string
    descripcion: string
    unidad: string
    costo: string
    status: 'pending' | 'success' | 'error'
    errorMsg?: string
}

interface Props {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function BulkMaterialCapture({ isOpen, onClose, onSuccess }: Props) {
    const [rawText, setRawText] = useState("")
    const [items, setItems] = useState<ParsedItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value
        setRawText(text)

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "")
        const parsed: ParsedItem[] = lines.map(line => {
            const cols = line.split("\t")
            return {
                clave: cols[0]?.trim() || "",
                descripcion: cols[1]?.trim() || "",
                unidad: cols[2]?.trim() || "",
                costo: cols[3]?.trim()?.replace(/[$,]/g, "") || "0",
                status: 'pending'
            }
        })
        setItems(parsed)
    }

    const handleSave = async () => {
        setIsProcessing(true)
        const updatedItems = [...items]

        for (let i = 0; i < updatedItems.length; i++) {
            if (updatedItems[i].status === 'success') continue

            const item = updatedItems[i]
            if (!item.clave || !item.descripcion) {
                updatedItems[i].status = 'error'
                updatedItems[i].errorMsg = "Datos incompletos"
                continue
            }

            try {
                const res = await fetch("/api/materiales", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        clave: item.clave,
                        descripcion: item.descripcion,
                        unidad: item.unidad,
                        costo: item.costo
                    })
                })

                if (res.ok) {
                    updatedItems[i].status = 'success'
                } else {
                    const errData = await res.json()
                    updatedItems[i].status = 'error'
                    updatedItems[i].errorMsg = errData.error || "Error"
                }
            } catch (err) {
                updatedItems[i].status = 'error'
                updatedItems[i].errorMsg = "Error de red"
            }
            // Update UI progressively
            setItems([...updatedItems])
        }

        setIsProcessing(false)
        const allSuccess = updatedItems.every(i => i.status === 'success')
        if (allSuccess) {
            onSuccess()
            setTimeout(onClose, 1000)
        }
    }

    const clear = () => {
        setRawText("")
        setItems([])
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Captura Masiva de Materiales" maxWidth="2xl">
            <div className="flex flex-col h-[70vh]">
                {!items.length ? (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-800 text-xs leading-relaxed">
                            <p className="font-bold flex items-center gap-2 mb-1">
                                <ClipboardPaste className="h-4 w-4" /> Instrucciones:
                            </p>
                            <p>Copia una tabla de Excel con las columnas: <b>Clave, Descripción, Unidad, Costo</b>. Pégala en el recuadro de abajo.</p>
                        </div>
                        <Textarea
                            placeholder="Pega aquí los datos de Excel..."
                            className="flex-1 font-mono text-xs p-4 bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none rounded-xl"
                            onChange={handlePaste}
                            value={rawText}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs text-slate-500 font-medium">Se detectaron <span className="text-primary font-bold">{items.length}</span> materiales.</p>
                            <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded-lg">
                                <Trash2 className="h-3 w-3" /> Limpiar
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto border rounded-xl overflow-hidden bg-white shadow-inner">
                            <table className="w-full text-[10px] text-left">
                                <thead className="bg-slate-50 border-b font-black sticky top-0 uppercase tracking-tighter text-slate-400">
                                    <tr>
                                        <th className="px-3 py-2">Clave</th>
                                        <th className="px-3 py-2">Descripción</th>
                                        <th className="px-3 py-2">Costo</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-1.5 font-mono text-green-600 font-bold">{item.clave}</td>
                                            <td className="px-3 py-1.5 truncate max-w-[200px] text-slate-600">{item.descripcion}</td>
                                            <td className="px-3 py-1.5 text-slate-500">${item.costo}</td>
                                            <td className="px-3 py-1.5">
                                                {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                {item.status === 'error' && (
                                                    <div className="flex items-center gap-1 text-red-500 font-bold uppercase text-[8px]">
                                                        <AlertCircle className="h-3 w-3" /> {item.errorMsg}
                                                    </div>
                                                )}
                                                {item.status === 'pending' && <div className="h-2 w-2 rounded-full bg-slate-200 animate-pulse" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="pt-6 flex justify-end gap-3 mt-auto">
                            <Button variant="outline" onClick={onClose} disabled={isProcessing} className="px-6 rounded-xl font-bold bg-white">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isProcessing || items.every(i => i.status === 'success')}
                                className="px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 font-bold min-w-[140px]"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    "Confirmar y Guardar"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    )
}
