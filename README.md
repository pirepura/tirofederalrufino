# Tiro Federal Rufino — Gestión de socios y pagos

Aplicación web para administrar socios y el pago de cuotas del Tiro Federal Rufino.
Los socios inician sesión, ven su estado de cuenta, reciben el aviso de cuotas
impagas con el saldo a pagar y pueden abonarlas con Mercado Pago.

## Funcionalidades

- **Login con roles**: administrador y socio.
- **Panel de administración**:
  - Alta, edición y baja de socios (cada socio tiene su cuenta de acceso).
  - Generación de cuotas mensuales para todos los socios activos.
  - Registro de pagos manuales (efectivo / transferencia).
  - Vista de morosos y recaudación.
- **Panel del socio**:
  - Recordatorio de cuotas impagas con el saldo total.
  - Pago de cuotas con Mercado Pago.
  - Historial de pagos.
- **Preparado para el futuro**: módulo de alquiler de líneas de tiro (estructura lista).

## Tecnologías

Next.js 14 · TypeScript · Tailwind CSS · Prisma (SQLite) · NextAuth · Mercado Pago.

## Puesta en marcha

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed   # datos de ejemplo (opcional)
npm run dev
```

Abrir http://localhost:3000

### Credenciales de ejemplo (tras el seed)

| Rol   | Email                               | Contraseña |
|-------|-------------------------------------|------------|
| Admin | admin@tirofederalrufino.com         | admin123   |
| Socio | juan@example.com                    | socio123   |
| Socio | maria@example.com                   | socio123   |
| Socio | carlos@example.com                  | socio123   |

## Configuración

Copiar `.env.example` a `.env` y completar:

- `NEXTAUTH_SECRET`: secret para las sesiones (`openssl rand -base64 32`).
- `MP_ACCESS_TOKEN`: credencial de Mercado Pago (panel de desarrolladores).
- `APP_URL`: URL pública de la app (necesaria para los webhooks de Mercado Pago).

> Para probar los pagos en local, exponé la app con una URL pública (por ejemplo
> un túnel) y configurá `APP_URL` y el webhook en el panel de Mercado Pago.

## Documentación de desarrollo

El detalle completo de lo construido está en [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md).
