# Design System Documentation - APU México

## Overview
Este documento describe el sistema de diseño implementado para APU México, basado en design tokens centralizados para consistencia visual.

## Design Tokens

Los design tokens están definidos en `app/design-tokens.css` usando CSS Custom Properties (variables CSS).

### Glassmorphism

```css
var(--glass-bg-light)    /* rgba(255, 255, 255, 0.95) */
var(--glass-bg-dark)     /* rgba(15, 23, 42, 0.95) */
var(--glass-blur)        /* blur(20px) */
```

**Uso:**
```tsx
<div className="glass">
  {/* Sidebar con efecto vidrio automático */}
</div>
```

### Shadows

Disponemos de 6 niveles de sombra estándar más sombras de colores:

```css
--shadow-xs    /* Sombra mínima */
--shadow-sm    /* Sombra pequeña */
--shadow-md    /* Sombra media (default tarjetas) */
--shadow-lg    /* Sombra grande */
--shadow-xl    /* Sombra extra grande */
--shadow-2xl   /* Sombra máxima */
```

**Sombras de colores:**
```css
--shadow-blue       /* Sombra azul para iconos */
--shadow-blue-lg    /* Sombra azul grande para tarjetas destacadas */
--shadow-sidebar    /* Sombra específica del sidebar */
```

### Gradients

Gradientes suaves predefinidos:

```css
--gradient-blue-soft      /* Blanco → Azul claro */
--gradient-indigo-soft    /* Blanco → Índigo claro */
--gradient-slate-soft     /* Blanco → Gris claro */
--gradient-blue-vibrant   /* Azul oscuro → Azul claro */
```

**Clases de utilidad:**
- `.gradient-blue`
- `.gradient-indigo`
- `.gradient-slate`

### Colors with Opacity

Colores con opacidad predefinida (compatibles con TailwindCSS v4):

```css
--bg-white-95           /* rgba(255, 255, 255, 0.95) */
--bg-white-80           /* rgba(255, 255, 255, 0.8) */
--bg-slate-50           /* rgba(248, 250, 252, 0.5) */
--bg-blue-500-30        /* rgba(59, 130, 246, 0.3) */
--border-slate-200-30   /* rgba(226, 232, 240, 0.3) */
```

## Utility Classes

### Glass Effects

```css
.glass        /* Efecto vidrio claro */
.glass-dark   /* Efecto vidrio oscuro */
```

### Card Effects

```css
.card-hover   /* Efecto hover con scale y shadow */
```

**Ejemplo:**
```tsx
<Card className="card-hover gradient-blue">
  {/* Tarjeta con hover effect y gradiente azul */}
</Card>
```

### Text Effects

```css
.text-gradient  /* Gradiente de texto azul → cyan */
```

## Component Examples

### Sidebar

```tsx
<div className="glass border-r shadow-sidebar" 
     style={{ borderColor: 'var(--border-slate-200-30)' }}>
  {/* Contenido del sidebar */}
</div>
```

### Dashboard Card

```tsx
<Card className="card-hover gradient-blue" 
      style={{boxShadow: 'var(--shadow-md)'}}>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>{content}</CardContent>
</Card>
```

### Highlighted Card

```tsx
<Card className="card-hover bg-blue-600 text-white" 
      style={{boxShadow: 'var(--shadow-blue-lg)'}}>
  {/* Tarjeta destacada con sombra azul */}
</Card>
```

## Migration Guide

### De inline styles a design tokens:

**Antes:**
```tsx
<div style={{
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
}}>
```

**Después:**
```tsx
<div className="glass" style={{boxShadow: 'var(--shadow-md)'}}>
```

### De TailwindCSS v3 a v4:

**Antes (v3):**
```tsx
<div className="bg-white/70 shadow-xl">
```

**Después (v4):**
```tsx
<div className="glass">
```

## Best Practices

1. **Usa design tokens siempre que sea posible** en lugar de valores hardcoded
2. **Prefer utility classes** sobre estilos inline cuando tengas múltiples propiedades
3. **Usa var() para referencias** a design tokens en estilos inline
4. **No modifiques los tokens directamente** en componentes
5. **Actualiza design-tokens.css** para cambios globales de diseño

## Customization

Para personalizar el tema, edita `app/design-tokens.css`:

```css
:root {
  /* Cambia estos valores para personalizar */
  --glass-bg-light: rgba(255, 255, 255, 0.98);  /* Más opaco */
  --shadow-md: 0 8px 12px rgba(0, 0, 0, 0.15);  /* Más pronunciado */
}
```

## TailwindCSS v4 Compatibility

Este sistema está optimizado para TailwindCSS v4:

- ✅ No usa sintaxis `/` para opacidad
- ✅ No usa `@apply` con utilidades complejas
- ✅ Usa CSS custom properties nativos
- ✅ Compatible con future versions

## Support

Para dudas o sugerencias sobre el sistema de diseño:
- Revisa el `implementation_plan.md`
- Consulta el `walkthrough.md` para el historial de cambios
