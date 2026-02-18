"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FolderKanban, ArrowRight } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Budget {
    id: number
    nombre: string
    descripcion: string
    cliente: string
    montoTotal: number
    fechaActualizacion: string
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const [projectId, setProjectId] = useState<string>("")
    const [projectsList, setProjectsList] = useState<{ id: number, nombre: string }[]>([])

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        cliente: "",
        ubicacion: ""
    })

    const loadData = React.useCallback(() => {
        setLoading(true)
        Promise.all([
            fetch("/api/budgets"),
            fetch("/api/projects")
        ])
            .then(async ([bRes, pRes]) => {
                const budgets = await bRes.json()
                const projects = await pRes.json()
                setBudgets(budgets)
                setProjectsList(projects)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!projectId) {
            alert("Debe seleccionar un proyecto.")
            return
        }
        try {
            const res = await fetch("/api/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, proyectoId: parseInt(projectId) })
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setFormData({ nombre: "", descripcion: "", cliente: "", ubicacion: "" })
                setProjectId("")
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
                </Button>
            </div>

            <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Crear Nuevo Presupuesto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Proyecto Asociado</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            required
                        >
                            <option value="">Seleccione Proyecto...</option>
                            {projectsList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre del Presupuesto</label>
                        <Input required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Presupuesto Base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <Input value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Cimentación y estructura de..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Crear Presupuesto</Button>
                    </div>
                </form>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Cargando presupuestos...</p>
                ) : budgets.length === 0 ? (
                    <p className="text-muted-foreground italic">No hay presupuestos registrados.</p>
                ) : budgets.map(b => (
                    <Card key={b.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FolderKanban className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">{b.nombre}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground line-clamp-2">{b.descripcion || "Sin descripción"}</p>
                                <div className="pt-2">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Monto Total</span>
                                    <div className="text-xl font-bold">${(b.montoTotal || 0).toLocaleString()}</div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Link href={`/dashboard/budgets/${b.id}`}>
                                        <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                                            Abrir <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
