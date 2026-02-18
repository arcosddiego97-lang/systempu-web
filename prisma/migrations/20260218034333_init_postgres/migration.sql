-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManoObra" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'jor',
    "tipo" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "salarioBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "factorSalarioReal" DOUBLE PRECISION,
    "salarioReal" DOUBLE PRECISION,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManoObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteCuadrilla" (
    "id" SERIAL NOT NULL,
    "cuadrillaId" INTEGER NOT NULL,
    "integranteId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ComponenteCuadrilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maquinaria" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "costoHorario" DOUBLE PRECISION NOT NULL,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Maquinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisPrecioUnitario" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'MATRIZ',
    "costoDirecto" DOUBLE PRECISION,
    "costoIndirecto" DOUBLE PRECISION,
    "costoFinanciamiento" DOUBLE PRECISION,
    "costoUtilidad" DOUBLE PRECISION,
    "porcentajeSobrecosto" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "factorEquipoSeguridad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioUnitario" DOUBLE PRECISION,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalisisPrecioUnitario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsumoEnAnalisis" (
    "id" SERIAL NOT NULL,
    "apuId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "manoObraId" INTEGER,
    "maquinariaId" INTEGER,
    "insumoApuId" INTEGER,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "costoParcial" DOUBLE PRECISION,

    CONSTRAINT "InsumoEnAnalisis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" SERIAL NOT NULL,
    "clave" TEXT,
    "nombre" TEXT NOT NULL,
    "cliente" TEXT,
    "ubicacion" TEXT,
    "responsable" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0.16,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" SERIAL NOT NULL,
    "proyectoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "porcentajeIndirectos" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "porcentajeFinanciamiento" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "porcentajeUtilidad" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "porcentajeCargosAdicionales" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "montoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptoPresupuesto" (
    "id" SERIAL NOT NULL,
    "presupuestoId" INTEGER NOT NULL,
    "apuId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "importe" DOUBLE PRECISION,

    CONSTRAINT "ConceptoPresupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombreEmpresa" TEXT NOT NULL DEFAULT 'Empresa Constructora S.A.',
    "direccion" TEXT,
    "correoContacto" TEXT,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0.16,
    "surchargeDefault" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_clave_key" ON "Material"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "ManoObra_clave_key" ON "ManoObra"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "ComponenteCuadrilla_cuadrillaId_integranteId_key" ON "ComponenteCuadrilla"("cuadrillaId", "integranteId");

-- CreateIndex
CREATE UNIQUE INDEX "Maquinaria_clave_key" ON "Maquinaria"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "AnalisisPrecioUnitario_codigo_key" ON "AnalisisPrecioUnitario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_clave_key" ON "Proyecto"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ComponenteCuadrilla" ADD CONSTRAINT "ComponenteCuadrilla_cuadrillaId_fkey" FOREIGN KEY ("cuadrillaId") REFERENCES "ManoObra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteCuadrilla" ADD CONSTRAINT "ComponenteCuadrilla_integranteId_fkey" FOREIGN KEY ("integranteId") REFERENCES "ManoObra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumoEnAnalisis" ADD CONSTRAINT "InsumoEnAnalisis_apuId_fkey" FOREIGN KEY ("apuId") REFERENCES "AnalisisPrecioUnitario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumoEnAnalisis" ADD CONSTRAINT "InsumoEnAnalisis_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumoEnAnalisis" ADD CONSTRAINT "InsumoEnAnalisis_manoObraId_fkey" FOREIGN KEY ("manoObraId") REFERENCES "ManoObra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumoEnAnalisis" ADD CONSTRAINT "InsumoEnAnalisis_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsumoEnAnalisis" ADD CONSTRAINT "InsumoEnAnalisis_insumoApuId_fkey" FOREIGN KEY ("insumoApuId") REFERENCES "AnalisisPrecioUnitario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptoPresupuesto" ADD CONSTRAINT "ConceptoPresupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptoPresupuesto" ADD CONSTRAINT "ConceptoPresupuesto_apuId_fkey" FOREIGN KEY ("apuId") REFERENCES "AnalisisPrecioUnitario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
