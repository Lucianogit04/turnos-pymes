# Instalación — Sistema de Turnos Online

Guía para instalar el sistema en una PC con Windows.

## Qué se necesita

1. **Node.js LTS** → descargar de https://nodejs.org e instalar con las opciones por defecto.
2. **Una base de datos MongoDB Atlas** (gratuita) → la dirección de conexión la entrega el proveedor del sistema.

## Instalación (una sola vez)

1. Descomprimir `turnos-pymes-v1.0.0.zip` en una carpeta fija, por ejemplo `C:\TurnosOnline`.
2. Hacer doble clic en **`iniciar.bat`**.
3. La primera vez instala lo necesario y hace unas preguntas:
   - nombre del negocio
   - dirección de MongoDB (pegarla con clic derecho)
   - horario de atención y duración de los turnos
   - usuario y contraseña del panel de administración
4. Se abre el navegador con la página de reservas.

## Uso diario

| Para…                         | Hacer…                                      |
|-------------------------------|---------------------------------------------|
| Encender el sistema           | Doble clic en `iniciar.bat`                 |
| Apagarlo                      | Cerrar la ventana negra (o Ctrl + C)        |
| Página de reservas            | http://localhost:3000                       |
| Panel de administración       | http://localhost:3000/admin                 |
| Cambiar usuario o contraseña  | En la carpeta, abrir una terminal y ejecutar `npm run cambiar-password` |
| Cambiar horario / datos       | `npm run setup` (Enter mantiene cada valor actual) |

## Que arranque solo al prender la PC

1. Apretar `Windows + R`, escribir `shell:startup` y Enter.
2. En la carpeta que se abre, crear un **acceso directo** a `iniciar.bat`.

## Problemas comunes

- **"No se encontró Node.js"** → instalar Node.js LTS y reiniciar la PC.
- **`EADDRINUSE :3000`** → el sistema ya está abierto en otra ventana; cerrarla.
- **`ECONNREFUSED` o `querySrv`** → revisar la conexión a internet y la dirección de MongoDB (`npm run setup`).
- **Olvidé la contraseña del panel** → `npm run cambiar-password`.
