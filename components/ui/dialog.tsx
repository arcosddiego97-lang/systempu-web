"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    maxWidth?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
}

export function Dialog({ isOpen, onClose, title, children, maxWidth = "md" }: DialogProps) {
    if (!isOpen) return null

    const maxWidthClass = {
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
    }[maxWidth]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={cn("bg-card w-full rounded-lg border shadow-lg animate-in fade-in zoom-in duration-200", maxWidthClass)}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-muted text-muted-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    )
}
