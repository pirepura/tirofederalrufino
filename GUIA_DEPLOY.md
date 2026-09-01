# Guía para publicar la web — Tiro Federal Rufino

Esta guía te lleva paso a paso desde cero hasta tener la web online.
No hace falta saber programar. Seguí los pasos en orden.

Vamos a usar tres servicios, todos con plan gratuito:
- **GitHub**: guarda el código del proyecto.
- **Neon**: la base de datos (donde se guardan socios, pagos, etc.).
- **Vercel**: donde vive la web publicada.

> Tiempo estimado: 30-45 minutos la primera vez.

---

## PARTE 1 — Crear la base de datos en Neon

1. Entrá a **https://neon.tech** y hacé clic en **Sign up**.
2. Registrate (lo más fácil es con tu cuenta de Google).
3. Cuando entres, te va a pedir crear un proyecto:
   - **Project name**: `tiro-federal-rufino`
   - **Region**: elegí la más cercana (por ejemplo, una de EE.UU. está bien).
   - Hacé clic en **Create project**.
4. Neon te va a mostrar una pantalla con la **Connection string** (cadena de conexión).
   Es un texto largo que empieza con `postgres://` o `postgresql://`.
5. **Copiá esa cadena completa** y guardala en un bloc de notas. La vamos a usar
   varias veces. Se ve parecido a esto:
   ```
   postgresql://usuario:AbC123@ep-cool-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

> ⚠ Si la cadena no incluye `?sslmode=require` al final, agregáselo vos.

✅ Al terminar esta parte tenés: la cadena de conexión de Neon guardada.

---

## PARTE 2 — Probar la base desde tu compu (opcional pero recomendado)

Esto crea las tablas y el usuario administrador en tu base de Neon, y te deja
probar que todo anda antes de publicar.

1. Abrí el archivo `.env` del proyecto (está en la carpeta `TiroFederalRufino`).
2. Reemplazá la línea `DATABASE_URL="..."` por tu cadena de Neon:
   ```
   DATABASE_URL="postgresql://usuario:...@...neon.tech/neondb?sslmode=require"
   ```
3. Guardá el archivo.
4. En una terminal, parada en la carpeta del proyecto, corré:
   ```bash
   npm run db:push        # crea las tablas en Neon
   npm run seed:admin     # crea el usuario administrador
   ```
5. Arrancá la web local con `npm run dev` y entrá a http://localhost:3000
   para verificar que podés loguearte como admin.

Usuario admin por defecto (si no definiste otro):
- Email: `admin@tirofederalrufino.com`
- Contraseña: `CambiarEstaClave123`

✅ Al terminar: las tablas están creadas en Neon y el admin existe.

---

## PARTE 3 — Subir el código a GitHub

1. Entrá a **https://github.com** y hacé clic en **Sign up**.
2. Creá tu cuenta (email, contraseña, usuario). Confirmá el email.
3. Una vez dentro, hacé clic en el **+** arriba a la derecha → **New repository**.
   - **Repository name**: `tiro-federal-rufino`
   - Dejalo en **Private** (privado) para que no sea público.
   - **NO** marques "Add a README".
   - Clic en **Create repository**.
4. GitHub te va a mostrar unos comandos. Ignoralos: te dejo los correctos abajo.

Desde una terminal, parada en la carpeta del proyecto, corré (una vez cada línea):
```bash
git init
git add .
git commit -m "Primera versión web Tiro Federal Rufino"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tiro-federal-rufino.git
git push -u origin main
```
> Reemplazá `TU_USUARIO` por tu nombre de usuario de GitHub.
> La primera vez te va a pedir iniciar sesión / autorizar. Seguí las indicaciones.

> ⚠ Tranquilo: el archivo `.env` (con tus contraseñas y el token de Mercado Pago)
> **NO se sube** a GitHub, está protegido a propósito.

✅ Al terminar: tu código está en GitHub.

---

## PARTE 4 — Publicar en Vercel

1. Entrá a **https://vercel.com** y hacé clic en **Sign up**.
2. Elegí **Continue with GitHub** (usá la cuenta que recién creaste).
3. Autorizá a Vercel a acceder a tus repositorios.
4. En el panel de Vercel, clic en **Add New...** → **Project**.
5. Buscá `tiro-federal-rufino` en la lista y hacé clic en **Import**.
6. Antes de desplegar, abrí la sección **Environment Variables** y cargá estas
   variables (una por una, nombre y valor):

   | Nombre (Key)       | Valor (Value)                                                        |
   |--------------------|----------------------------------------------------------------------|
   | `DATABASE_URL`     | Tu cadena de conexión de Neon (la de la Parte 1)                     |
   | `NEXTAUTH_SECRET`  | `rVb2xG6B/8V6sU0M2GVz5GrQ1qzEDzmSFUKMA3Se7v0=`                        |
   | `NEXTAUTH_URL`     | (lo completás en la Parte 5, dejalo pendiente por ahora)             |
   | `APP_URL`          | (lo completás en la Parte 5, dejalo pendiente por ahora)            |
   | `MP_ACCESS_TOKEN`  | Tu token de Mercado Pago                                             |
   | `ADMIN_EMAIL`      | El email que querés para el admin                                    |
   | `ADMIN_PASSWORD`   | Una contraseña segura para el admin                                  |

   > Para `NEXTAUTH_URL` y `APP_URL`: como todavía no sabés la dirección final,
   > cargá cualquier cosa temporal (ej. `https://temporal.vercel.app`) y las
   > corregís en la Parte 5.

7. Hacé clic en **Deploy** y esperá unos minutos.

✅ Al terminar: Vercel te da una dirección tipo `https://tiro-federal-rufino.vercel.app`.

---

## PARTE 5 — Ajustar las URLs finales

1. Copiá la dirección que te dio Vercel (ej. `https://tiro-federal-rufino.vercel.app`).
2. En Vercel, andá a **Settings** → **Environment Variables** y editá:
   - `NEXTAUTH_URL` = esa dirección
   - `APP_URL` = esa misma dirección
3. Para que tome los cambios, andá a la pestaña **Deployments**, abrí el último
   despliegue y hacé clic en **Redeploy**.

✅ Al terminar: el login y los pagos usan la dirección correcta.

---

## PARTE 6 — Crear las tablas y el admin en la base de producción

Si NO hiciste la Parte 2, hay que crear las tablas en Neon. La forma más simple:

1. En tu compu, con el `.env` apuntando a Neon (Parte 2, paso 2), corré:
   ```bash
   npm run db:push
   npm run seed:admin
   ```
   (Esto usa la misma base que Vercel, así que las tablas quedan listas para la web online.)

> Si ya hiciste la Parte 2, este paso ya está hecho. No hace falta repetirlo.

✅ Al terminar: la web online ya tiene su base con el admin.

---

## PARTE 7 — Conectar el webhook de Mercado Pago (pagos automáticos)

Ahora que la app tiene una URL pública, los pagos se confirman solos.

1. Entrá al panel de Mercado Pago: **https://www.mercadopago.com.ar/developers/panel**
2. Entrá a tu aplicación → sección **Webhooks** / **Notificaciones**.
3. Configurá la URL de notificación:
   ```
   https://TU-DIRECCION.vercel.app/api/pagos/webhook
   ```
   (reemplazá `TU-DIRECCION` por la de Vercel)
4. En eventos, seleccioná **Pagos** (payments).
5. Guardá.

✅ Al terminar: cuando un socio pague, la cuota se marca como pagada automáticamente.

---

## Listo 🎉

Tu web está online. Ingresá a la dirección de Vercel con el usuario admin y
empezá a cargar socios.

### Cada vez que quieras actualizar la web
Cuando hagamos cambios en el código, subís los cambios con:
```bash
git add .
git commit -m "descripción del cambio"
git push
```
Vercel detecta el push y republica la web sola en un par de minutos.

### Si algo falla
- **La web carga pero no puedo entrar / error de base**: revisá que `DATABASE_URL`
  en Vercel sea exactamente la de Neon y que hayas corrido `npm run db:push`.
- **El login redirige raro**: revisá que `NEXTAUTH_URL` sea la dirección de Vercel.
- **El pago da error**: revisá `MP_ACCESS_TOKEN` y `APP_URL` en Vercel.
- Cualquier duda, avisame y lo vemos juntos.
