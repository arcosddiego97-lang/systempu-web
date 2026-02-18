"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Briefcase, MapPin, Building2, Calendar, Users } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Project {
    id: number
    clave: string
    nombre: string
    cliente: string
    ubicacion: string
    responsable: string
    fechaInicio: string
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const [formData, setFormData] = useState({
        clave: "",
        nombre: "",
        cliente: "",
        ubicacion: "",
        responsable: ""
    })

    const loadData = React.useCallback(() => {
        setLoading(true)
        fetch("/api/projects")
            .then(res => res.json())
            .then(data => {
                setProjects(data)
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
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setIsDialogOpen(false)
                setFormData({ clave: "", nombre: "", cliente: "", ubicacion: "", responsable: "" })
                loadData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Proyectos</h1>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
                </Button>
            </div>

            <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Crear Nuevo Proyecto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Clave de Obra</label>
                            <Input value={formData.clave} onChange={e => setFormData({ ...formData, clave: e.target.value })} placeholder="Ej. DOP-PU-2026-001" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre del Proyecto</label>
                            <Input required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Construcción de Puente" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Responsable / Residente</label>
                        <Input value={formData.responsable} onChange={e => setFormData({ ...formData, responsable: e.target.value })} placeholder="Ej. Ing. Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cliente / Dependencia</label>
                        <Input value={formData.cliente} onChange={e => setFormData({ ...formData, cliente: e.target.value })} placeholder="Ej. Municipio de Querétaro" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ubicación</label>
                        <Input value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} placeholder="Col. Centro, CP 76000" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Proyecto</Button>
                    </div>
                </form>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Cargando proyectos...</p>
                ) : projects.length === 0 ? (
                    <Card className="col-span-full py-10">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                            <Briefcase className="h-12 w-12 text-muted-foreground opacity-20" />
                            <div className="space-y-1">
                                <p className="font-semibold">No hay proyectos activos</p>
                                <p className="text-sm text-muted-foreground">Comience creando un nuevo proyecto para gestionar sus presupuestos.</p>
                            </div>
                            <Button onClick={() => setIsDialogOpen(true)} variant="outline">Crear Primer Proyecto</Button>
                        </CardContent>
                    </Card>
                ) : projects.map(p => (
                    <Card key={p.id} className="hover:shadow-md transition-shadow group overflow-hidden border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/50">
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                {p.clave || "SIN CLAVE"}
                            </div>
                            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                                <Briefcase className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-lg line-clamp-1 text-slate-900">{p.nombre}</h3>
                                    <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <Building2 className="h-3.5 w-3.5" />
                                            <span className="font-medium truncate">{p.cliente || "Sin cliente"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                            <Users className="h-3.5 w-3.5" />
                                            <span className="font-medium truncate">{p.responsable || "Sin responsable"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <MapPin className="h-4 w-4 text-blue-500" />
                                        <span className="line-clamp-1">{p.ubicacion || "Ubicación no especificada"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span>Iniciado: {p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString() : "Sin fecha"}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Link href={`/dashboard/budgets?projectId=${p.id}`}>
                                        <Button className="w-full bg-slate-900 hover:bg-slate-800 font-bold rounded-xl shadow-lg ring-offset-2 hover:ring-2 ring-slate-900/10 transition-all">
                                            Gestionar Presupuestos
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
