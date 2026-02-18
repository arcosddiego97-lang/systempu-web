"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Building2, Percent, Moon, Sun, Loader2, Check } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const [formData, setFormData] = useState({
        nombreEmpresa: "",
        direccion: "",
        correoContacto: "",
        iva: "16",
        surchargeDefault: "25"
    })

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const res = await fetch("/api/settings")
            if (res.ok) {
                const data = await res.json()
                setFormData({
                    nombreEmpresa: data.nombreEmpresa || "Empresa Constructora S.A.",
                    direccion: data.direccion || "",
                    correoContacto: data.correoContacto || "",
                    iva: (data.iva * 100).toString(),
                    surchargeDefault: (data.surchargeDefault * 100).toString()
                })
            }
        } catch (err) {
            console.error("Error loading settings:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSaved(false)
        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        } catch (err) {
            console.error("Error saving settings:", err)
        } finally {
            setSaving(false)
        }
    }

    if (!mounted || loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gradient">Configuración</h1>
                {saved && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-medium animate-in fade-in slide-in-from-top-4">
                        <Check className="h-4 w-4" /> Configuración guardada
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="grid gap-6">
                {/* General Settings */}
                <Card className="border-none shadow-md bg-card">
                    <CardHeader className="bg-muted/50 border-b border-border rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <CardTitle>Información de la Empresa</CardTitle>
                        </div>
                        <CardDescription>
                            Configura los datos generales que aparecerán en tus presupuestos y reportes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre de la Empresa</label>
                                    <Input
                                        value={formData.nombreEmpresa}
                                        onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                                        placeholder="Ej. Mi Constructora"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Correo de Contacto</label>
                                    <Input
                                        type="email"
                                        value={formData.correoContacto}
                                        onChange={(e) => setFormData({ ...formData, correoContacto: e.target.value })}
                                        placeholder="contacto@empresa.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dirección Fiscal</label>
                                <Input
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                    placeholder="Av. Principal #123, Col. Centro"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Economic Parameters */}
                <Card className="border-none shadow-md bg-card">
                    <CardHeader className="bg-muted/50 border-b border-border rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-blue-600" />
                            <CardTitle>Parámetros Económicos</CardTitle>
                        </div>
                        <CardDescription>
                            Define los porcentajes por defecto para nuevos análisis y presupuestos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">IVA por Defecto (%)</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.iva}
                                        onChange={(e) => setFormData({ ...formData, iva: e.target.value })}
                                    />
                                    <span className="text-muted-foreground text-sm font-bold">%</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Se utiliza para el cálculo de impuestos finales.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Factor de Sobrecosto por Defecto (%)</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.surchargeDefault}
                                        onChange={(e) => setFormData({ ...formData, surchargeDefault: e.target.value })}
                                    />
                                    <span className="text-muted-foreground text-sm font-bold">%</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Este valor se sugerirá al crear nuevos análisis de precio unitario.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 min-w-[150px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                            </>
                        ) : "Guardar Cambios"}
                    </Button>
                </div>

                {/* Appearance Settings */}
                <Card className="border-none shadow-md mt-6 bg-card">
                    <CardHeader className="bg-muted/50 border-b border-border rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-blue-600" />
                            <CardTitle>Apariencia</CardTitle>
                        </div>
                        <CardDescription>
                            Personaliza el aspecto visual del panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Tema de la Aplicación</p>
                                <p className="text-sm text-muted-foreground">Alternar entre tema claro y oscuro de manera persistente.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="gap-2 border-slate-200"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                {theme === "dark" ? (
                                    <>
                                        <Sun className="h-4 w-4 text-orange-500" /> Modo Claro
                                    </>
                                ) : (
                                    <>
                                        <Moon className="h-4 w-4 text-blue-500" /> Modo Oscuro
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
