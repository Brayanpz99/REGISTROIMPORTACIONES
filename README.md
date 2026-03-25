# Mini ERP de Costos de Importación

MVP funcional en Next.js + Prisma + PostgreSQL para controlar:
- lotes de importación,
- gastos por lote,
- producción,
- costo base,
- costo total,
- costo real ajustado por unidad vendible,
- historial de snapshots,
- exportación a Excel.

## 1) Requisitos
- Node.js 20+
- npm 10+
- Docker Desktop o PostgreSQL local

## 2) Levantar base de datos
```bash
docker compose up -d
```

## 3) Configurar variables de entorno
Copia `.env.example` a `.env`

```bash
cp .env.example .env
```

## 4) Instalar dependencias
```bash
npm install
```

## 5) Inicializar Prisma
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

## 6) Ejecutar proyecto
```bash
npm run dev
```

Abrir en:
```bash
http://localhost:3000
```

## Flujo recomendado de prueba
1. Revisar dashboard
2. Entrar a Importaciones
3. Abrir el lote `BZ-ECU-0001`
4. Registrar un nuevo gasto
5. Registrar o editar producción
6. Ver cómo cambia el snapshot de costos
7. Descargar el Excel desde `/exportar`

## Fórmulas implementadas
- Total importación = factura + flete
- Total gastos = suma de gastos del lote
- Total invertido = importación + gastos
- Unidades vendibles = producidas - defectuosas
- Costo base = total importación / producidas
- Costo total = total invertido / producidas
- Costo real ajustado = total invertido / vendibles

## Alcance real del MVP
Este proyecto sí corre y tiene lógica funcional, pero aún no incluye:
- autenticación,
- subida real de archivos,
- filtros avanzados,
- edición/eliminación de registros,
- multiempresa,
- alertas,
- permisos por rol.

Eso sería la siguiente fase.
