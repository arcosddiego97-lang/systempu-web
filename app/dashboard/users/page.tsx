"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { Loader2, Plus, Trash, Shield, User, Search, UserPlus, Mail, Lock } from "lucide-react"

interface UserType {
    id: number
    name: string
    email: string
    role: "ADMIN" | "USER"
    createdAt: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // New User State
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER"
    })
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState("")

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/users")
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            } else {
                // If unauthorized, could redirect or show error
                console.error("Failed to fetch users")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setError("")

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Error al crear usuario")
            }

            setIsAddOpen(false)
            setNewUser({ name: "", email: "", password: "", role: "USER" })
            fetchUsers()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteUser = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este usuario?")) return

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "DELETE"
            })

            if (res.ok) {
                fetchUsers()
            } else {
                const data = await res.json()
                alert(data.error || "Error al eliminar")
            }
        } catch (err) {
            console.error(err)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Gestión de Usuarios</h1>
                    <p className="text-slate-500 text-sm mt-1">Administra el acceso al sistema y roles de usuarios.</p>
                </div>
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-xl font-bold"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Usuarios del Sistema</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar usuario..."
                                className="pl-9 bg-slate-50 border-slate-200 rounded-xl h-9 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase font-black border-y border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Usuario</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3">Fecha Registro</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{user.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.role === 'ADMIN' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        ADMINISTRADOR
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                                                        <User className="h-3 w-3 mr-1" />
                                                        CAPTURISTA
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    title="Eliminar usuario"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Nuevo Usuario" maxWidth="md">
                <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                className="pl-9 h-10 rounded-xl bg-slate-50 focus:bg-white transition-colors"
                                placeholder="Ej. Juan Pérez"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="pl-9 h-10 rounded-xl bg-slate-50 focus:bg-white transition-colors"
                                placeholder="usuario@ejemplo.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="pl-9 h-10 rounded-xl bg-slate-50 focus:bg-white transition-colors"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Rol</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                className={`cursor-pointer rounded-xl border-2 p-3 flex items-center gap-3 transition-all ${newUser.role === 'USER' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                onClick={() => setNewUser({ ...newUser, role: "USER" })}
                            >
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${newUser.role === 'USER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${newUser.role === 'USER' ? 'text-blue-700' : 'text-slate-600'}`}>Capturista</p>
                                    <p className="text-[10px] text-slate-400">Acceso básico</p>
                                </div>
                            </div>

                            <div
                                className={`cursor-pointer rounded-xl border-2 p-3 flex items-center gap-3 transition-all ${newUser.role === 'ADMIN' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                onClick={() => setNewUser({ ...newUser, role: "ADMIN" })}
                            >
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${newUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${newUser.role === 'ADMIN' ? 'text-purple-700' : 'text-slate-600'}`}>Administrador</p>
                                    <p className="text-[10px] text-slate-400">Control total</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAddOpen(false)}
                            className="rounded-xl font-medium text-slate-500"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-200"
                            disabled={creating}
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                "Crear Usuario"
                            )}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    )
}
