# Cómo vender e instalar el sistema (guía para vos, no para el cliente)

> Este archivo **no** se incluye en el ZIP que generás con `npm run empaquetar`.

## 1. La decisión clave: ¿dónde va a correr?

El sistema es una página web. Si corre en la PC del cliente, **sus clientes no pueden entrar desde sus celulares** a reservar: `localhost` solo existe en esa computadora. Por eso hay dos formas de venderlo:

| | **A. Online (recomendado)** | **B. En la PC del cliente** |
|---|---|---|
| Quién reserva | Cualquiera, desde el celular, con un link | Solo desde esa PC (o su Wi-Fi local) |
| Dónde corre | Un hosting (Render, Railway, un VPS) | La PC del negocio, encendida |
| Qué entregás | Un link + usuario/contraseña del panel | Un ZIP + instalación |
| Cómo cobrás | Instalación + abono mensual | Pago único (+ soporte opcional) |
| Uso real | Reservas online de verdad | Agenda interna (el negocio carga los turnos que le piden por teléfono/WhatsApp) |

Para un negocio que quiere que sus clientes reserven solos, la opción **A** es la que tiene sentido.

## 2. Una base de datos por cliente

Nunca mezcles clientes en la misma base. Para cada cliente:

1. En Atlas, creá un **Proyecto nuevo** (ej: `Peluquería Sol`) con su propio cluster gratuito.
2. Creá un usuario de base con contraseña fuerte (*Database Access*).
3. *Network Access*:
   - Opción A (hosting): `0.0.0.0/0` (el hosting cambia de IP; la seguridad la da la contraseña).
   - Opción B (PC del cliente): la IP de su conexión, o `0.0.0.0/0` si su IP cambia.
4. Copiá la URI y poné un nombre de base al final: `...mongodb.net/turnos?retryWrites=true&w=majority`.

## 3. Opción A — Publicarlo online (ejemplo con Render)

1. Subí el código a un repositorio **privado** de GitHub (el `.gitignore` ya excluye `.env`).
2. En render.com → *New* → *Web Service* → elegí el repo.
   - Build command: `npm install`
   - Start command: `npm start`
3. Generá la configuración de ese cliente en tu PC con `npm run setup` (poné `production` como entorno) y copiá cada línea del `.env` resultante en *Environment* de Render (`NEGOCIO_NOMBRE`, `MONGODB_URI`, `ADMIN_USER`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, horarios). `PORT` no hace falta: lo pone Render.
4. Render te da una URL `https://...onrender.com` con HTTPS. Opcional: conectar un dominio propio del cliente (ej: `turnos.peluqueriasol.com`).
5. Entregás al cliente: el link para compartir en Instagram/WhatsApp y el acceso a `/admin`.

> Los planes gratuitos de algunos hostings "duermen" el servidor sin uso y la primera carga tarda. Para un cliente que paga, usá un plan pago básico y sumalo al abono.

Para varios clientes: un servicio por cliente, todos desde el mismo repo, cada uno con sus variables.

## 4. Opción B — Instalarlo en la PC del cliente

En tu PC:
```powershell
npm run empaquetar
```
Esto crea `dist/turnos-pymes-v1.0.0.zip` **sin** `node_modules` ni tu `.env`.

En la PC del cliente:
1. Instalar **Node.js LTS** (nodejs.org).
2. Descomprimir el ZIP en `C:\TurnosOnline`.
3. Doble clic en `iniciar.bat` → instala dependencias, pregunta los datos (URI de Atlas del cliente, horarios, usuario/contraseña) y abre el navegador.
4. Para que arranque solo: `Windows + R` → `shell:startup` → acceso directo a `iniciar.bat`.

Dejale impreso o en PDF el archivo `INSTALACION.md` (viene en el ZIP).

## 5. Antes de cobrar

- **Licencia:** el `package.json` dice `UNLICENSED` (todos los derechos reservados). Si tu repo del portafolio es **público**, cualquiera puede copiarlo: tené un repo público de muestra y uno privado para vender.
- **Términos:** dejá por escrito qué incluye (instalación, soporte, actualizaciones, quién paga el hosting). No soy abogado: para un contrato formal, consultá a uno.
- **Datos personales:** guardás nombres y WhatsApp de terceros. Informale al negocio que es responsable de esos datos y no los uses para otra cosa.
- **Contraseñas:** cada cliente con su propia contraseña de admin y de Atlas. Nunca reutilices las tuyas.

## 6. Mejoras que suben el precio

- Aviso automático por WhatsApp/email al reservar.
- Varios servicios con distinta duración y precio.
- Varios profesionales con agenda propia.
- Bloquear feriados o vacaciones desde el panel.
- Personalizar logo y colores por cliente.
