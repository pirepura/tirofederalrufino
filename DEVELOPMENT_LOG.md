# Registro de Desarrollo — Tiro Federal Rufino

Sistema de administración de socios y pagos del Tiro Federal Rufino.
Este documento lleva el registro detallado de todo lo creado para evitar duplicaciones.

---

## Stack tecnológico

| Área | Tecnología | Motivo |
|------|-----------|--------|
| Framework | Next.js 14 (App Router) + TypeScript | Frontend + backend en un solo proyecto, responsive |
| Estilos | Tailwind CSS | Diseño con paleta institucional del Tiro |
| Base de datos | Prisma + SQLite (dev) | Cero configuración; migrable a PostgreSQL en producción |
| Autenticación | NextAuth (Auth.js) con credenciales | Login con roles ADMIN / SOCIO |
| Pagos | Mercado Pago SDK | Cobro de cuotas de socios |
| Validación | Zod | Validación de formularios y APIs |

## Paleta de colores institucional

Definida en `tailwind.config.ts` bajo el prefijo `tiro`:
- `tiro-celeste` #5FA8E0, `tiro-celesteClaro` #8FC3EC (celeste bandera)
- `tiro-azul` #1E4C8A, `tiro-azulOscuro` #132F55 (azul institucional)
- `tiro-dorado` #C9A227 (acentos / escudo)
- `tiro-blanco`, `tiro-gris`, `tiro-grisTexto`

> Nota: paleta basada en la identidad celeste/azul y blanco típica de los tiros federales argentinos.
> Ajustable si se cuenta con el manual de marca / escudo oficial.

---

## Estructura del proyecto (en construcción)

```
TiroFederalRufino/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── .env / .env.example
├── DEVELOPMENT_LOG.md
├── prisma/
│   ├── schema.prisma       # modelos de datos
│   └── seed.ts             # datos de ejemplo
└── src/
    ├── app/                # rutas (App Router)
    ├── components/         # componentes reutilizables
    └── lib/                # utilidades (db, auth, mercadopago)
```

---

## Bitácora de cambios

### Etapa 1 — Inicialización del proyecto
- [x] `package.json` con dependencias y scripts
- [x] `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`
- [x] `tailwind.config.ts` con paleta institucional del Tiro
- [x] `.gitignore`, `.env`, `.env.example`
- [x] `DEVELOPMENT_LOG.md` (este archivo)

### Etapa 2 — Base de datos (Prisma)
- [x] `prisma/schema.prisma` con modelos: `User`, `Socio`, `Cuota`, `LineaTiro`, `AlquilerLinea`
- [x] SQLite no soporta enums → estados guardados como String, validados con `src/lib/constants.ts`
- [x] `src/lib/db.ts` (cliente Prisma singleton)
- [x] `src/lib/constants.ts` (ROLES, ESTADO_SOCIO, ESTADO_CUOTA, ESTADO_ALQUILER, helpers `nombreMes`, `formatearPesos`)
- [x] Base `dev.db` creada con `prisma db push`
- Restricciones clave: `Cuota` tiene `@@unique([socioId, periodoMes, periodoAnio])` para evitar cuotas duplicadas por período
- Módulo alquiler (`LineaTiro`, `AlquilerLinea`) definido pero sin UI (para el futuro)

### Etapa 3 — Autenticación con roles
- [x] `src/lib/auth.ts` — `authOptions` de NextAuth con CredentialsProvider (email + password con bcrypt), JWT, callbacks que agregan `rol` y `socioId` a la sesión
- [x] `src/types/next-auth.d.ts` — extiende tipos de sesión/JWT con `rol` y `socioId`
- [x] `src/app/api/auth/[...nextauth]/route.ts` — handler GET/POST
- [x] `src/lib/session.ts` — helpers `getSession`, `requireUser`, `requireAdmin`, `requireSocio`
- [x] `src/components/SessionProvider.tsx` — provider cliente
- Página de login en `/login` (se crea en Etapa 4)

### Etapa 4 — Layout y tema
- [x] `src/app/globals.css` — clases utilitarias `.btn-primary`, `.btn-secondary`, `.btn-mp`, `.card`, `.input`, `.label`, `.badge`
- [x] `src/components/Escudo.tsx` — logo/diana SVG en colores institucionales (reemplazable por el escudo oficial)
- [x] `src/app/layout.tsx` — layout raíz con SessionProvider y metadata
- [x] `src/components/Header.tsx` — header con escudo, navegación por rol y botón salir
- [x] `src/app/page.tsx` — raíz: redirige a /login, /admin o /socio según sesión/rol
- [x] `src/app/login/page.tsx` + `src/app/login/LoginForm.tsx` — login con diseño institucional
- [x] `src/components/EstadoBadge.tsx` — `CuotaBadge` y `SocioBadge`

### Etapa 5 — Panel de administrador
Servicios / lógica:
- [x] `src/lib/cuotas.ts` — `actualizarCuotasVencidas`, `cuotasImpagasDeSocio`, `saldoDeSocio`, `marcarCuotaPagada`
- [x] `src/lib/validators.ts` — Zod: `socioCreateSchema`, `socioUpdateSchema`, `cuotaCreateSchema`, `generarCuotasSchema`
- [x] `src/lib/socios.ts` — `crearSocio` (crea User+Socio, número correlativo), `actualizarSocio`, `eliminarSocio`

API routes:
- [x] `GET/POST /api/socios` — listar / crear socio (admin)
- [x] `GET/PUT/DELETE /api/socios/[id]` — detalle / editar / eliminar (admin)
- [x] `POST /api/cuotas/generar` — genera cuotas del período para socios activos (sin duplicar)
- [x] `POST /api/cuotas/[id]/pagar` — pago manual efectivo/transferencia (admin)

Páginas (`/admin/*`):
- [x] `layout.tsx` (protegido con `requireAdmin`), `page.tsx` (dashboard con métricas y recaudación)
- [x] `socios/page.tsx` (listado), `socios/nuevo/page.tsx`, `socios/[id]/page.tsx` (detalle + edición + historial de cuotas)
- [x] `cuotas/page.tsx` (generar cuotas + vista de morosos)

Componentes:
- [x] `SocioForm.tsx` (alta/edición), `GenerarCuotasForm.tsx`, `AccionesCuota.tsx` (`RegistrarPagoBtn`, `EliminarSocioBtn`)

### Etapa 6 — Panel de socio
- [x] `src/components/PagarCuotaBtn.tsx` — llama a `POST /api/pagos` y redirige al `initPoint` de Mercado Pago
- [x] `src/app/socio/layout.tsx` — protegido con `requireSocio`, header con links Inicio / Mis pagos
- [x] `src/app/socio/page.tsx` — saludo, recordatorio destacado de cuotas impagas con saldo total, lista de cuotas pendientes con botón de pago; mensaje "al día" si no debe nada
- [x] `src/app/socio/pagos/page.tsx` — historial completo, total abonado, botón de pago en las impagas

### Etapa 7 — Integración Mercado Pago
- [x] `src/lib/mercadopago.ts` — SDK v2 (`MercadoPagoConfig`, `Preference`, `Payment`); `crearPreferenciaPago`, `obtenerPago`, `mercadoPagoConfigurado()` (detecta token placeholder)
- [x] `POST /api/pagos` — crea preferencia para una cuota. **Seguridad**: el socio solo paga cuotas propias (verifica `socioId`); admin puede pagar cualquiera. Rechaza cuotas ya pagadas. Devuelve `{ initPoint }`. Si MP no está configurado, responde 503 con mensaje claro.
- [x] `POST /api/pagos/webhook` — recibe notificación de MP, consulta el pago, y si está `approved` marca la cuota PAGADA vía `external_reference` (= cuota.id). Idempotente (no re-marca). GET de validación.
- [x] `src/app/socio/pago/resultado/page.tsx` — página de retorno (éxito / pendiente / error) según `?estado=`
- Configuración: `back_urls` y `notification_url` usan `APP_URL`. Credenciales en `MP_ACCESS_TOKEN`.
- **Pendiente del usuario**: cargar credenciales reales de Mercado Pago y, para probar webhooks en local, exponer la app con una URL pública (ej. túnel) y setear `APP_URL`.

**Ajuste (token de prueba cargado):**
- `MP_ACCESS_TOKEN` de prueba (TEST-) configurado en `.env`.
- `crearPreferenciaPago` ahora detecta si `APP_URL` es local (`esUrlLocal`). En local **omite** `notification_url` y `auto_return` porque Mercado Pago los rechaza al no ser accesibles desde internet. En producción (URL pública) se activan solos.
- Verificado: la preferencia se crea OK y devuelve `initPoint` (link de checkout real de MP Argentina).
- Recordatorio: el webhook automático solo llegará cuando `APP_URL` sea pública. En local, el pago se puede confirmar manualmente desde el panel del admin.

### Etapa 8 — Módulo alquiler de líneas de tiro (preparado para el futuro)
- [x] `src/lib/alquileres.ts` — `lineasActivas`, `lineaDisponible` (chequeo de solapamiento), `crearReserva` (estado RESERVADO)
- [x] `src/app/socio/alquiler/page.tsx` — vista preliminar "próximamente" que lista líneas activas; botón "Reservar" deshabilitado
- [x] Link "Alquiler de líneas" agregado al menú del socio
- Cobro futuro: reutilizar `crearPreferenciaPago` con `external_reference` del alquiler. Falta: calendario/turnos, confirmación y webhook para alquileres.

### Etapa 9 — Seed y verificación
- [x] `prisma/seed.ts` — crea admin, 3 socios de ejemplo (con cuota pagada del mes pasado + pendiente del actual) y 4 líneas de tiro
- [x] `npm run db:seed` ejecutado con éxito
- [x] `npm run build` compila sin errores (17 rutas generadas)
- [x] Servidor `npm run start` verificado: raíz redirige a /login (307), /login responde 200, webhook 200
- [x] Login probado por API: sesión devuelve `rol: "ADMIN"` correctamente

**Credenciales de prueba (seed):**
- Admin: `admin@tirofederalrufino.com` / `admin123`
- Socios: `juan@example.com`, `maria@example.com`, `carlos@example.com` / `socio123`

### Etapa 10 — Cambio de contraseña del socio
- [x] `POST /api/perfil/password` — el usuario logueado cambia su contraseña. Valida contraseña actual con bcrypt, exige nueva de mín. 6 caracteres y confirmación. Zod para validación.
- [x] `src/components/CambiarPasswordForm.tsx` — formulario (actual, nueva, repetir) con mensajes de éxito/error
- [x] `src/app/socio/perfil/page.tsx` — "Mi cuenta": muestra datos del socio + formulario de cambio de contraseña
- [x] Link "Mi cuenta" agregado al menú del socio
- Nota: los datos personales del socio los edita solo el admin; el socio solo cambia su contraseña.

### Cómo correr el proyecto
```bash
npm install
npx prisma generate      # genera el cliente (el postinstall puede no correr solo)
npx prisma db push       # crea/actualiza la base SQLite
npm run db:seed          # datos de ejemplo (opcional)
npm run dev              # desarrollo en http://localhost:3000
```

### Pendientes / próximos pasos
- Cargar credenciales reales de Mercado Pago en `MP_ACCESS_TOKEN` y setear `APP_URL` con la URL pública para los webhooks.
- Escudo/logo oficial del club (reemplazar `Escudo.tsx`) y ajustar colores si hay manual de marca.
- Migrar a PostgreSQL para producción (cambiar `datasource` y convertir estados String a enum si se desea).
- Completar el módulo de alquiler de líneas (calendario de turnos, reserva y cobro).
- Recordatorios automáticos por email/WhatsApp de cuotas por vencer (hoy el aviso es dentro de la app).

---

### Etapa 11 — Preparación para producción (deploy)
Decisión: **PostgreSQL en todos lados** (local y producción). Prisma ya no permite `env()` en `provider`.
- [x] `schema.prisma` → `provider = "postgresql"` (fijo)
- [x] `.env` local → `DATABASE_URL` apunta a Neon (Postgres). Base SQLite (`prisma/dev.db`) eliminada.
- [x] `.env.example` → documenta variables para local y producción
- [x] `package.json` → `engines.node >=18.18`; scripts `db:setup` (push+seed) y `seed:admin`
- [x] `prisma/seed-admin.ts` → seed de producción: crea SOLO el admin desde `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` (upsert, no pisa)
- [x] Fix tipos en `src/lib/mercadopago.ts` → `body: PreferenceRequest` (import de `mercadopago/dist/clients/preference/commonTypes`)
- [x] `npm run build` de producción OK (21 rutas)
- [x] `GUIA_DEPLOY.md` → guía paso a paso desde cero (Neon → GitHub → Vercel → URLs → tablas → webhook MP)

**Datos para el deploy:**
- `NEXTAUTH_SECRET` de producción generado (ver `GUIA_DEPLOY.md`, Parte 4).
- Stack de hosting: Vercel (web) + Neon (PostgreSQL).
- Crear tablas en Neon: `npm run db:push`; crear admin: `npm run seed:admin`.
- Webhook de Mercado Pago: `https://<dominio>/api/pagos/webhook`.

**Pendiente del usuario** (requiere crear cuentas, no automatizable desde acá):
1. Crear cuenta en Neon y pegar `DATABASE_URL` en `.env`.
2. Crear cuenta en GitHub y subir el repo.
3. Crear cuenta en Vercel, importar el repo y cargar variables de entorno.
4. Ajustar `NEXTAUTH_URL` y `APP_URL` con el dominio de Vercel.
5. Configurar el webhook en el panel de Mercado Pago.

### Etapa 12 — Deploy realizado + validación de firma del webhook
- [x] Base Neon creada, tablas (`db push`) y admin (`seed:admin`) cargados. Admin: `admin@tirofederalrufino.com`.
- [x] Código subido a GitHub: `pirepura/tirofederalrufino` (público). `.env` NO subido (verificado).
- [x] Deploy en Vercel OK. URL pública: **https://tirofederalrufino.vercel.app**
- [x] Variables en Vercel: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, APP_URL, MP_ACCESS_TOKEN, CUOTA_MENSUAL_DEFAULT.
- [x] Login admin verificado contra la web pública (rol ADMIN OK).
- [x] Webhook de Mercado Pago registrado.
- [x] Validación de firma del webhook: `validarFirmaWebhook` en `src/lib/mercadopago.ts` (HMAC-SHA256 sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, comparación en tiempo constante). Nueva var `MP_WEBHOOK_SECRET` (opcional: si vacía, no valida). Webhook devuelve 401 si la firma es inválida.
- [x] `npm run build` OK.

**Pendiente del usuario:**
- Cargar `MP_WEBHOOK_SECRET` en Vercel con la clave secreta del webhook y redeploy.
- Cambiar la contraseña del admin.
- Revocar el token de GitHub usado para el push (quedó expuesto).
- Al cobrar en real: reemplazar el `MP_ACCESS_TOKEN` de prueba por el de producción.

### Etapa 13 — Cambio de contraseña del admin
- [x] `src/app/admin/perfil/page.tsx` — "Mi cuenta" del admin: datos + formulario de cambio de contraseña
- [x] Reutiliza `CambiarPasswordForm` y la API `POST /api/perfil/password` (que ya sirve para cualquier usuario logueado, valida contraseña actual)
- [x] Link "Mi cuenta" agregado al menú del admin
- [x] `npm run build` OK

### Etapa 14 — Fix pago Mercado Pago en producción (SDK → REST)
Síntoma: en Vercel, crear preferencia devolvía "At least one policy returned UNAUTHORIZED", pese a que el token y APP_URL estaban correctos (verificado con endpoint /api/diag temporal: token 71 chars, sin espacios; APP_URL ok).
Causa: el SDK oficial de Mercado Pago fallaba en el entorno serverless de Vercel. La misma petición vía REST directa funcionaba (HTTP 201).
Solución:
- [x] Reescrito `src/lib/mercadopago.ts` para usar `fetch` a la API REST (`/checkout/preferences` y `/v1/payments/:id`) en vez del SDK. Se quitaron imports de `mercadopago`.
- [x] `getToken()` con `.trim()`; manejo de error que propaga el `message` real de MP.
- [x] Validación de firma del webhook intacta.
- [x] Eliminado endpoint temporal `/api/diag`.
- [x] `npm run build` OK.
Nota: quedó un socio de prueba en la base de producción (`prueba.pago@example.com`) creado para testear; eliminar desde el panel admin cuando se confirme el pago.

### Etapa 15 — Inscripción pública de socios con firma y PDF
- [x] Modelo `SolicitudInscripcion` (Prisma) + `db push` en Neon. Constantes `ESTADO_SOLICITUD`.
- [x] Validador `solicitudInscripcionSchema` (Zod), con vinculación previa condicional y firma requerida.
- [x] `POST /api/inscripcion` (público): valida, evita duplicados (email/DNI/pendiente), hashea password, crea solicitud PENDIENTE.
- [x] Página pública `/inscripcion` (`InscripcionForm.tsx`) con `FirmaCanvas.tsx` (firma con dedo/mouse, PNG data URL), selector "primera vez / ya fui socio" y declaración jurada. Link desde `/login`.
- [x] `src/lib/solicitudes.ts`: `aprobarSolicitud` (crea User+Socio activo reutilizando passwordHash, número correlativo, `separarNombre`) y `rechazarSolicitud`.
- [x] `POST /api/solicitudes/[id]` (admin): aprobar/rechazar. Componente `AccionesSolicitud.tsx`.
- [x] Panel admin: `/admin/solicitudes` (listado) y `/admin/solicitudes/[id]` (detalle con firma visible). Link "Solicitudes" en el menú + aviso de pendientes en el dashboard.
- [x] `GET /api/solicitudes/[id]/pdf`: PDF con formato del club (pdf-lib, runtime nodejs), incluye logo si existe `public/escudo.png`, campos, declaración y firma. Botón "Descargar / imprimir PDF" en el detalle.
- [x] Circuito completo probado en local: inscripción → aprobación → login del nuevo socio → PDF válido. Datos de prueba limpiados.
- Nota: al aprobar, el socio queda con `cuotaMensual: 0`; el admin ajusta el monto y genera cuotas con el botón existente.
- Dependencia nueva: `pdf-lib`.

### Etapa 16 — Corrección de cuotas y monto al aprobar solicitud
Problema reportado: al aprobar una solicitud el socio quedaba con cuotaMensual $0, por lo que la cuota generada era de $0 y no impactaba deuda. Además faltaba forma de corregir cuotas mal generadas.
- [x] `eliminarCuota` en `src/lib/cuotas.ts` + `DELETE /api/cuotas/[id]` (admin).
- [x] Botón `EliminarCuotaBtn` en el detalle del socio (junto a registrar pago), para borrar cuotas mal generadas (ej. de $0).
- [x] Al aprobar solicitud, el socio arranca con `cuotaMensual = CUOTA_MENSUAL_DEFAULT` (env) en vez de $0.
- Recordatorio de flujo: el monto de cada socio se edita en Admin → Socios → Ver/editar (campo "Cuota mensual $"). El generador de cuotas usa ese monto; si ya existe una cuota del período NO la actualiza (hay que borrar la vieja y regenerar).
- [x] `npm run build` OK.

### Etapa 17 — Categorías con precio único (editable en un solo lugar)
Cambio de diseño: el precio de la cuota ya no se carga por socio; ahora vive en la **categoría**. Cambiar el precio de una categoría impacta en las próximas cuotas de todos sus socios. Las cuotas ya generadas conservan su monto histórico (decisión del usuario).
- [x] Modelo `Categoria` {nombre único, cuotaMensual, activa}. `Socio.categoriaId` + relación `categoriaRef`. Se eliminaron `Socio.categoria` (texto) y `Socio.cuotaMensual`. Migración de datos hecha en Neon (categoría "General" $10000, socios vinculados).
- [x] `src/lib/categorias.ts`: `listarCategorias` (con _count socios), `categoriasActivas`, `crearCategoria`, `actualizarCategoria`, `eliminarCategoria` (bloquea si tiene socios).
- [x] APIs: `GET/POST /api/categorias`, `PUT/DELETE /api/categorias/[id]` (admin).
- [x] Pantalla `Admin → Categorías` (`CategoriasManager.tsx`): alta, edición inline del precio, eliminar. Link en el menú.
- [x] `SocioForm`: selector de categoría (sin campo de precio). Páginas nuevo/editar socio y listado usan `categoriaRef`. Validador socio usa `categoriaId`.
- [x] Generador de cuotas: usa `categoriaRef.cuotaMensual`; omite socios sin categoría o con cuota $0 (devuelve `sinMonto`).
- [x] Aprobación de solicitud: el admin elige la categoría al aprobar (`AccionesSolicitud` con selector; `aprobarSolicitud(id, categoriaId)`).
- [x] Seed de desarrollo actualizado (crea categorías General/Estudiante y vincula).
- [x] Build OK. CRUD de categorías probado en local (crear/editar/eliminar).
- Nota: los 2 socios reales (Luciano, María Soledad) quedaron en "General" $10000. Ajustar el precio real de General cuando corresponda.

### Etapa 17 — Categorías administrables con precio único (rediseño de cuotas)
Objetivo: el precio de la cuota se define por categoría en un solo lugar; al aumentar, impacta en todos los socios de esa categoría en las cuotas futuras.
- [x] Modelo `Categoria` {nombre único, cuotaMensual, activa}. `Socio.categoriaId` (relación `categoriaRef`). Se eliminaron los campos legacy `Socio.categoria` (texto) y `Socio.cuotaMensual`.
- [x] Migración en Neon preservando datos: categoría "General" creada con el precio existente, socios vinculados.
- [x] `src/lib/categorias.ts`: `listarCategorias`, `categoriasActivas`, `crear/actualizar/eliminarCategoria` (no permite eliminar categoría con socios).
- [x] API `/api/categorias` (GET/POST) y `/api/categorias/[id]` (PUT/DELETE), solo admin.
- [x] Pantalla `/admin/categorias` + `CategoriasManager` (alta, editar precio inline, eliminar). Link "Categorías" en el menú.
- [x] `SocioForm` usa selector de categoría (sin campo de precio). Validadores y `socios.ts` usan `categoriaId`.
- [x] Generador de cuotas usa `socio.categoriaRef.cuotaMensual`; omite socios sin monto (contador `sinMonto`).
- [x] `aprobarSolicitud(solicitudId, categoriaId)`: al aprobar se elige la categoría. `AccionesSolicitud` con selector.
- [x] Páginas admin muestran `categoriaRef.nombre` y su precio.
- Decisión aplicada: las cuotas ya generadas conservan su monto histórico; el nuevo precio aplica solo a las cuotas futuras.
- [x] Probado en local contra Neon: crear categoría, editar precio de "General" a $12000 → generar cuotas dio $12000 a los socios General y $5000 al socio de categoría "Menor". Cuotas de prueba eliminadas.
- Nota: quedó creada la categoría "Estudiante" ($4000) durante la prueba (se puede borrar desde el panel si no se usa).

### Etapa 17 — Categorías como entidad con precio único por categoría
Objetivo: el precio de la cuota se define por categoría en un solo lugar; al aumentar, se cambia el precio de la categoría y aplica a las cuotas futuras de todos sus socios. Cuotas ya generadas conservan su monto histórico.
- [x] Modelo `Categoria` {nombre único, cuotaMensual, activa, socios[]}. `Socio.categoriaId` + relación `categoriaRef`. Se eliminaron los campos legacy `Socio.categoria` (texto) y `Socio.cuotaMensual`. Migración de datos en Neon preservando socios existentes.
- [x] `src/lib/categorias.ts`: `listarCategorias`, `categoriasActivas`, `crearCategoria`, `actualizarCategoria`, `eliminarCategoria` (no elimina si tiene socios). Validador `categoriaSchema`.
- [x] API `GET/POST /api/categorias` y `PUT/DELETE /api/categorias/[id]` (admin).
- [x] Pantalla `Admin → Categorías` (`CategoriasAdmin.tsx`): tabla con edición inline de precio, alta y baja. Link en el menú.
- [x] `SocioForm` usa selector de categoría (sin campo de precio). Validadores y `src/lib/socios.ts` usan `categoriaId`.
- [x] Generador de cuotas usa el precio actual de la categoría del socio (`categoriaRef.cuotaMensual`); omite socios sin categoría/precio $0.
- [x] `aprobarSolicitud(solicitudId, categoriaId)`: el admin elige la categoría al aprobar (`AccionesSolicitud` con selector). Páginas de socios/solicitud muestran `categoriaRef`.
- [x] Eliminado componente duplicado `CategoriasManager.tsx`.
- [x] `npm run build` OK.
- Nota: para aumentar la cuota, Admin → Categorías → editar el precio de la categoría. Aplica a las cuotas que se generen después; las ya emitidas mantienen su monto.

### Etapa 17 — Categorías como entidad con precio único (editable en un solo lugar)
Objetivo: el precio de la cuota se define por categoría, en un solo lugar; al aumentar impacta en las cuotas futuras de todos los socios de esa categoría. Cuotas ya generadas conservan su monto histórico.
- [x] Modelo `Categoria` (nombre único, cuotaMensual, activa). `Socio.categoriaId` + relación `categoriaRef`. Se quitaron `Socio.categoria` (texto) y `Socio.cuotaMensual`. Migración de datos preservada en Neon.
- [x] `src/lib/categorias.ts` (listar, categoriasActivas, crear, actualizar, eliminar; no elimina si tiene socios).
- [x] `categoriaSchema` (Zod). API `GET/POST /api/categorias` y `PUT/DELETE /api/categorias/[id]` (admin).
- [x] Pantalla `Admin → Categorías` (`CategoriasAdmin.tsx`): crear, editar precio inline, eliminar. Link en menú admin.
- [x] `SocioForm` usa selector de categoría (sin campo de precio). Validadores socio usan `categoriaId`. `socios.ts` crea/actualiza con `categoriaId`.
- [x] Generador de cuotas usa `socio.categoriaRef.cuotaMensual` (salta socios sin monto). `AccionesCuota` con `EliminarCuotaBtn`.
- [x] `aprobarSolicitud(solicitudId, categoriaId)` valida y asigna categoría. `AccionesSolicitud` con selector de categoría.
- [x] Páginas admin (socios listado/detalle) muestran `categoriaRef.nombre` y precio.
- [x] Build OK. Circuito probado en local (crear/editar/eliminar categoría, protección con socios, precio para generar cuotas).
Nota: la contraseña del admin fue cambiada por el usuario (ya no es la inicial), correcto. Categorías reales cargadas por el usuario: General $10000, Estudiante $5000, Menor $2500.

### Etapa 17 — Categorías de socio con precio centralizado
Objetivo: el precio de la cuota se define por categoría en un solo lugar; al aumentar, cambia el precio de la categoría y aplica a todos sus socios (en cuotas futuras). Las cuotas ya generadas conservan su monto histórico.
- [x] Modelo `Categoria` (nombre único, cuotaMensual, activa). `Socio.categoriaId` + relación `categoriaRef`. Se eliminaron los campos legacy `Socio.categoria` (texto) y `Socio.cuotaMensual`.
- [x] Migración en Neon preservando datos: se creó "General" y se vincularon los socios existentes.
- [x] `src/lib/categorias.ts`: listar, activas, crear, actualizar, eliminar (no elimina si tiene socios).
- [x] `src/lib/validators.ts`: `categoriaSchema`; `socioCreate/Update` usan `categoriaId` (se quitó precio/categoría-texto).
- [x] API `/api/categorias` (GET/POST) y `/api/categorias/[id]` (PUT/DELETE), solo admin.
- [x] Pantalla `Admin → Categorías` (`CategoriasAdmin`): alta, edición de precio inline, eliminar, cuenta de socios. Link en el menú.
- [x] `SocioForm`: selector de categoría (muestra precio), sin campo de precio manual.
- [x] Generador de cuotas usa `socio.categoriaRef.cuotaMensual`; ignora socios sin monto (contador `sinMonto`).
- [x] `aprobarSolicitud(solicitudId, categoriaId)` + `AccionesSolicitud` con selector de categoría al aprobar.
- [x] Verificado en local: generación de cuotas respeta el precio de cada categoría (General $10000, Menor $2500).
- Nota: el admin cambió su contraseña (correcto). Para tests internos se usó un admin temporal, ya eliminado.

### Etapa 18 — Comprobante de pago informado por el socio
El socio puede informar que pagó por otro medio (transferencia, etc.) y subir el comprobante. El admin verifica y confirma o rechaza.
- [x] Estado `EN_REVISION` en `ESTADO_CUOTA`. Campos nuevos en `Cuota`: `comprobanteData` (data URL base64), `comprobanteTipo`, `comprobanteInformadoEn`, `metodoPagoInformado`. `prisma db push` en Neon.
- [x] `src/lib/cuotas.ts`: `informarPagoConComprobante` (valida propiedad, tipo imagen/PDF, máx 4 MB → cuota EN_REVISION), `resolverPagoInformado` (aprobar → PAGADA con método informado + borra comprobante; rechazar → vuelve a PENDIENTE/VENCIDA y limpia), `cuotasEnRevision`.
- [x] API socio: `POST /api/cuotas/[id]/comprobante` (solo dueño). API compartida: `GET /api/cuotas/[id]/comprobante` (admin o dueño, devuelve el archivo). API admin: `POST /api/cuotas/[id]/resolver`.
- [x] UI socio: `InformarPagoBtn` (elegir medio + subir imagen/PDF con validación) en cada cuota impaga del panel; sección "Pagos informados (en revisión)".
- [x] UI admin: sección "Pagos a verificar" en `/admin/cuotas` con `RevisarPagoBtn` (ver comprobante, confirmar, rechazar); aviso en el dashboard.
- [x] `CuotaBadge`: estado EN_REVISION en azul con etiqueta "EN REVISIÓN".
- [x] Build OK. Circuito probado en local: informar → EN_REVISION → admin ve comprobante → confirmar → PAGADA + comprobante borrado (GET devuelve 404). Datos de prueba eliminados.
- Decisión aplicada: el archivo del comprobante se borra al confirmar el pago (no se acumula). Queda registro del pago (fecha, monto, método).

### Etapa 19 — Débito automático (suscripción de Mercado Pago)
El socio puede activar el débito automático mensual de su cuota desde su panel. Mercado Pago cobra solo cada mes y el webhook marca las cuotas pagadas.
- [x] Campos en `Socio`: `mpPreapprovalId`, `suscripcionEstado` (activa/pausada/cancelada), `suscripcionMonto`. Constante `ESTADO_SUSCRIPCION`. `prisma db push`.
- [x] `src/lib/mercadopago.ts`: `crearSuscripcion` (POST /preapproval, auto_recurring mensual, back_url, external_reference=socioId, status pending → init_point), `obtenerSuscripcion`, `cancelarSuscripcion`, `obtenerPagoAutorizado`.
- [x] API socio: `POST /api/suscripcion` (crea preapproval con el monto de la categoría, devuelve initPoint) y `POST /api/suscripcion/cancelar`.
- [x] Webhook extendido (`/api/pagos/webhook`): maneja `payment` (pago único), `preapproval` (alta/estado de suscripción → actualiza socio) y `authorized_payment` (cobro mensual → `registrarPagoAutomatico` marca/crea la cuota del período como PAGADA, método "mercadopago-debito").
- [x] `registrarPagoAutomatico` en `cuotas.ts`.
- [x] UI socio: componente `DebitoAutomatico` (activar → redirige a MP; ver estado activo; cancelar) en el panel. Página `/socio/debito/resultado` al volver de MP.
- [x] UI admin: indicador de débito automático (activo / no activo) en el detalle del socio.
- [x] Build OK. Probado contra la API real de MP con token de prueba: se crea el preapproval y devuelve init_point (verificado y luego cancelado).
- **Pendiente del usuario**: para que el cobro sea real, cargar credenciales de PRODUCCIÓN de Mercado Pago (hoy hay token TEST). El flujo técnico ya está listo; solo se cambian las credenciales en Vercel.

### Etapa 20 — Sistema de auditoría
Registro permanente de acciones (quién hizo qué y cuándo) en la base, visible en Admin → Auditoría con filtros.
- [x] Modelo `RegistroAuditoria` (usuarioId/Nombre/Rol, accion, entidad, entidadId, detalle, createdAt, índices). `prisma db push`.
- [x] Constantes `ACCION_AUDITORIA` y `ACCION_LABEL`. Helper `src/lib/auditoria.ts`: `registrarAuditoria`, `auditarConSesion`, `listarAuditoria` (filtros por acción/fecha + paginación).
- [x] Instrumentado admin: crear/editar/eliminar socio, aprobar/rechazar solicitud, generar cuotas, pago manual, eliminar cuota, confirmar/rechazar comprobante, crear/editar/eliminar categoría.
- [x] Instrumentado socio: informar pago, activar/cancelar débito, cambiar contraseña.
- [x] Instrumentado sistema (webhook MP): pago por checkout y por débito automático (usuarioRol SISTEMA).
- [x] Instrumentado login exitoso en `auth.ts` (authorize).
- [x] Pantalla `/admin/auditoria`: tabla (fecha, usuario+rol, acción, detalle) con filtros por acción y rango de fechas + paginación. Link en el menú admin.
- [x] Build OK. Probado: login y creación de categoría quedaron registrados con usuario/acción/detalle/fecha correctos. Datos de prueba eliminados.
- Retención: sin borrado automático (se guardan todos los registros).

### Etapa 21 — Identidad del club centralizada (preparación para replicar)
Se centralizó toda la identidad del club en un solo lugar, para poder adaptar el sistema a otro club editando un único archivo.
- [x] `src/config/colores.ts` — paleta de colores (sin imports, usable desde tailwind.config y la app).
- [x] `src/config/club.ts` — nombre, nombre corto, descripción, dirección, ciudad, teléfono, logo y colores. Export `CLUB` y `CLUB_DIRECCION_COMPLETA`.
- [x] `tailwind.config.ts` lee los colores desde `src/config/colores.ts` (prefijo `tiro-` se mantiene para no cambiar clases).
- [x] Reemplazados los textos/datos hardcodeados por `CLUB` en: `layout.tsx` (metadata), `Header.tsx`, `Escudo.tsx` (logo + alt), `login/page.tsx`, `inscripcion/page.tsx` (nombre + dirección + metadata), `api/pagos/route.ts` (título), `api/suscripcion/route.ts` (razón), `lib/mercadopago.ts` (razón fallback), `api/solicitudes/[id]/pdf` (logo + encabezado + dirección + teléfono).
- [x] Build OK. Verificado que la identidad del Tiro Federal se sigue mostrando bien.

**Cómo adaptar una copia a otro club:**
1. Editar `src/config/club.ts` (nombre, dirección, ciudad, teléfono, descripción).
2. Editar los colores en `src/config/colores.ts`.
3. Reemplazar `/public/escudo.png` por el logo del club nuevo.
4. (Nueva instancia) crear su base en Neon, su proyecto en Vercel y sus credenciales de Mercado Pago.

### Etapa 22 — Módulo de Rifas / Sorteos (venta pública de números)
Rifa con venta pública de números por link, pago con Mercado Pago, comprobante PDF. Sorteo por Lotería Nacional (no interno).
- [x] Modelos `Rifa` (slug, titulo, descripcion, cantidadNumeros, cifras 1-4, precioNumero, estado), `PremioRifa` (posicion 1-3, titulo, fotoData base64), `NumeroRifa` (numero, estado disponible/en_proceso/vendido, datos comprador, mpPaymentId). Constantes ESTADO_RIFA, ESTADO_NUMERO_RIFA + acciones de auditoría. `prisma db push`.
- [x] `src/lib/rifas.ts`: crearRifa, listarRifas (con vendidos/recaudado), obtenerRifaPublica(slug), reservarNumeroEnProceso, confirmarNumeroVendido, finalizarRifa (borra fotos), formatearNumero.
- [x] Validadores `rifaCreateSchema`, `comprarNumeroSchema`.
- [x] APIs: `GET/POST /api/rifas` (admin), `POST /api/rifas/[id]/finalizar` (admin), `POST /api/rifas/publica/[slug]/comprar` (público, crea preferencia MP con external_reference "rifa:<numeroId>" y backUrl a /rifa/[slug]/gracias), `GET /api/rifas/numero/[id]/pdf` (comprobante).
- [x] Webhook MP extendido: distingue external_reference "rifa:<id>" (confirma número vendido + auditoría) de cuota.
- [x] `crearPreferenciaPago` acepta `backUrl` opcional (para el retorno de la rifa).
- [x] UI admin: `/admin/rifas` (listado), `/admin/rifas/nueva` (RifaForm: datos + 3 premios con foto + cifras/cantidad/precio), `/admin/rifas/[id]` (link público para copiar, premios, vendidos, recaudación, finalizar). Link "Rifas" en el menú.
- [x] UI pública: `/rifa/[slug]` (premios con foto, grilla de números si ≤300 o input manual si son muchos, datos comprador, pagar MP) y `/rifa/[slug]/gracias`.
- [x] Comprobante PDF con escudo, datos del sorteo, comprador y número.
- [x] Build OK. Probado end-to-end en local (crear rifa, pública, comprar→preferencia MP, confirmar venta, PDF). Datos de prueba eliminados.
- Nota: cobro real requiere credenciales de PRODUCCIÓN de MP (hoy TEST). Fotos de premios se borran al finalizar la rifa.

### Etapa 23 — Torneos de tiro, inscripciones con cobro y ranking histórico
Torneos con categorías, inscripción de socios y no socios (con cobro socio/no socio, online o efectivo), carga de puntajes por el admin, tabla por categoría con campeón y ranking histórico de socios.
- [x] Modelos `Torneo` (nombre, fecha, disciplina, estado, precioSocio, precioNoSocio), `CategoriaTorneo` (nombre, puntajeMaximo), `ParticipacionTorneo` (socioId opcional, nombre/apellido, esSocio, montoInscripcion, estadoPago, metodoPago, puntaje, rendimiento). Relación en Socio. `prisma db push`.
- [x] Constantes ESTADO_TORNEO, ESTADO_PAGO_INSCRIPCION + acciones auditoría. (Se resolvió duplicado de ESTADO_TORNEO.)
- [x] `src/lib/torneos.ts`: crearTorneo, listarTorneos, obtenerTorneo, inscribirParticipante, marcarInscripcionPagada, cargarPuntaje (rendimiento=puntaje/max*100), resultadosPorCategoria (+campeón), cerrarTorneo, rankingHistorico (promedio mejores 5, mín. 2 torneos, solo socios), rankingDeSocio.
- [x] Validadores torneoCreateSchema, inscripcionTorneoSchema.
- [x] APIs: `GET/POST /api/torneos`, `POST /api/torneos/[id]/participantes`, `/cerrar`, `POST /api/torneos/participante/[id]/puntaje`, `/pagar`, `/pago-online` (genera preferencia MP con external_reference "torneo:<id>"). Todo auditado.
- [x] Webhook MP extendido: external_reference "torneo:<id>" marca inscripción pagada.
- [x] UI admin: `/admin/torneos` (listado), `/admin/torneos/nuevo` (TorneoForm con categorías dinámicas), `/admin/torneos/[id]` (inscribir, tabla por categoría, campeón 🏆, cargar puntaje, generar link/marcar pago, cerrar). Link "Torneos" en el menú.
- [x] Ranking público `/ranking` (índice = promedio %, top con medallas) + tarjeta de ranking en el panel del socio (posición, índice, o cuántos torneos le faltan).
- [x] Build OK. Probado end-to-end: torneo, inscripción socio/no socio, puntajes (95% y 90% calculados OK), campeón, ranking (excluye no socios correctamente). Datos de prueba eliminados.
- Nota: cobro online real requiere credenciales de PRODUCCIÓN de MP (hoy TEST).

### Etapa 23 — Torneos de tiro y ranking histórico
Torneos con categorías (cada una con puntaje máximo), participantes socios/no socios con puntaje, tabla por categoría + campeón, y ranking histórico de socios público + en su panel.
- [x] Modelos `Torneo` (nombre, fecha, disciplina, estado abierto/cerrado), `CategoriaTorneo` (nombre, puntajeMaximo), `ParticipacionTorneo` (socioId opcional, nombre/apellido, puntaje, rendimiento). Constantes ESTADO_TORNEO + acciones auditoría. `prisma db push`.
- [x] Se limpió un diseño previo de torneos con inscripción paga (campos precio/inscripción, archivos TorneoForm, /participante/pagar y pago-online, refs en webhook) que no correspondía al enfoque acordado.
- [x] `src/lib/torneos.ts`: crearTorneo, listarTorneos, agregarCategoria, registrarParticipacion (calcula rendimiento = puntaje/puntajeMaximo*100), cerrarTorneo, detalleTorneo (resultados por categoría + campeón), rankingHistorico (índice = promedio mejores 5 rendimientos, mín. 2 torneos para rankear), rankingDeSocio.
- [x] Validadores torneoCreate/categoriaTorneo/participacion.
- [x] APIs: POST/GET /api/torneos, POST /api/torneos/[id]/categorias, /participantes, /cerrar (admin, con auditoría).
- [x] UI admin: /admin/torneos (listado), /admin/torneos/nuevo, /admin/torneos/[id] (GestionTorneo: agregar categorías y participantes socio/no socio; tabla de posiciones por categoría + campeón; cerrar torneo). Link "Torneos" en el menú.
- [x] Ranking: página pública /ranking (podio, índice %, "en formación" para <2 torneos) y widget en el panel del socio (posición, índice, torneos).
- [x] Build OK. Probado end-to-end: torneo + categoría (máx 400) + 2 socios (380→95%, 360→90%), rendimientos y campeón correctos, ranking muestra "en formación" con 1 torneo (correcto). Datos de prueba eliminados.
- Config ranking: mejores 5 torneos, mínimo 2 para rankear (en src/lib/torneos.ts).