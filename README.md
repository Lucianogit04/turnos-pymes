# Sistema de Reservas y Turnos Online (pymes)

Aplicación web para que los clientes de un negocio reserven turnos online y el negocio los gestione desde un panel protegido.

**Stack:** Node.js · Express · MongoDB (Mongoose) · HTML/CSS/JS vanilla — sin frameworks de frontend ni librerías de fechas.

🌐 **Demo en vivo:** _(pegá acá tu link de Render)_

## Funcionalidades

- **Reserva pública:** el cliente elige fecha, ve los horarios libres y reserva con nombre y WhatsApp.
- **Sin doble reserva:** validación en el controlador + índice único parcial en MongoDB (resiste reservas simultáneas).
- **Panel admin con login:** lista ordenada por fecha, filtros por fecha/estado, búsqueda, completar/cancelar/reabrir/eliminar, enlace directo a WhatsApp.
- **Seguridad:** contraseña cifrada con scrypt, sesión en cookie HttpOnly firmada (HMAC), límite de intentos de login, panel fuera de la carpeta pública.
- **Configurable sin tocar código:** nombre del negocio, horario, duración de turnos y días de atención.
- **Instalador interactivo** (`npm run setup`) y empaquetado para entregar a clientes (`npm run empaquetar`).

## Estructura

```
turnos-pymes/
├── server.js                    # Punto de entrada
├── iniciar.bat                  # Arranque con doble clic (Windows)
├── scripts/
│   ├── setup.js                 # Asistente que genera el .env
│   └── empaquetar.js            # Crea el ZIP para entregar
└── src/
    ├── config/      db.js, negocio.js
    ├── models/      Turno.js
    ├── controllers/ turno.controller.js, auth.controller.js
    ├── routes/      turno.routes.js, auth.routes.js
    ├── middlewares/ auth.js, errorHandler.js
    ├── utils/       fechas.js, password.js
    ├── views/       admin.html          (protegido)
    └── public/      index.html, login.html, css/, js/
```

## Puesta en marcha

```bash
npm install
npm run setup      # pregunta URI de MongoDB, horario y usuario/contraseña del admin
npm run dev        # desarrollo (se reinicia al guardar)
# npm start        # producción
```

- Reservas: http://localhost:3000
- Panel admin: http://localhost:3000/admin

## Scripts

| Comando                    | Qué hace                                         |
|----------------------------|--------------------------------------------------|
| `npm run dev`              | Servidor en modo desarrollo                      |
| `npm start`                | Servidor en modo normal                          |
| `npm run setup`            | Crea/actualiza el `.env` con preguntas           |
| `npm run cambiar-password` | Cambia usuario y contraseña del admin            |
| `npm run empaquetar`       | Genera `dist/turnos-pymes-vX.zip` sin `.env` ni `node_modules` |
| `npm run generar-hash`     | Genera el hash de contraseña para un hosting   |

## Deploy

Incluye `render.yaml` (Blueprint de Render): build, health check, zona horaria y variables. Guía completa en [PUBLICAR.md](PUBLICAR.md).

## API

| Método | Ruta                           | Acceso  | Descripción                                 |
|--------|--------------------------------|---------|---------------------------------------------|
| GET    | /api/health                    | Público | Estado del servidor y la base               |
| GET    | /api/turnos/config             | Público | Horario del negocio                         |
| GET    | /api/turnos/disponibles?fecha= | Público | Horarios del día con disponibilidad         |
| POST   | /api/turnos                    | Público | Crear turno (409 si el horario está ocupado) |
| GET    | /api/turnos?fecha=&estado=&q=  | Admin   | Listar turnos ordenados                     |
| PATCH  | /api/turnos/:id                | Admin   | Cambiar estado                              |
| DELETE | /api/turnos/:id                | Admin   | Eliminar turno                              |
| POST   | /api/auth/login                | Público | Iniciar sesión                              |
| POST   | /api/auth/logout               | Público | Cerrar sesión                               |
| GET    | /api/auth/me                   | Público | Usuario de la sesión actual                 |

## Cómo se evita la doble reserva

1. El controlador consulta si ya existe un turno activo en esa fecha y hora → `409 Conflict`.
2. Un **índice único parcial** (`fecha + hora`, solo Pendientes/Completados) bloquea dos reservas simultáneas. Los cancelados no cuentan, así el horario vuelve a quedar libre.
