# Publicar online en Render (paso a paso)

Resultado: un link público tipo `https://turnos-pymes.onrender.com` para tu CV y portafolio.
Tiempo estimado: 20–30 minutos la primera vez. Todo es gratis.

---

## Paso 1 — Abrir MongoDB Atlas a internet

Render no tiene una IP fija, así que Atlas tiene que aceptar conexiones desde cualquier IP (la seguridad la da el usuario y contraseña de la base).

1. Entrá a https://cloud.mongodb.com → tu proyecto.
2. Menú izquierdo → **Network Access** → **Add IP Address**.
3. Clic en **Allow access from anywhere** (queda `0.0.0.0/0`) → **Confirm**.
4. Tené a mano tu `MONGODB_URI` (la del `.env`, con la contraseña **nueva** si la cambiaste).

---

## Paso 2 — Subir el código a GitHub

### 2.1 Verificar que tenés Git
En la terminal de Cursor:
```powershell
git --version
```
Si dice "no se reconoce", instalalo desde https://git-scm.com/download/win (todo por defecto), **cerrá y volvé a abrir Cursor**.

La primera vez, configurá tu nombre y email:
```powershell
git config --global user.name "Luciano Contreras"
git config --global user.email "tu-email@ejemplo.com"
```

### 2.2 Crear el repositorio
1. Entrá a https://github.com (creá una cuenta si no tenés).
2. Arriba a la derecha **+** → **New repository**.
3. Nombre: `turnos-pymes`. Elegí **Public** (para el portafolio) o **Private** (si lo vas a vender).
4. **No** marques "Add a README" ni ".gitignore" (ya los tenés). → **Create repository**.
5. Copiá la URL que aparece, tipo `https://github.com/TU-USUARIO/turnos-pymes.git`.

### 2.3 Subir los archivos
En la terminal de Cursor, dentro de la carpeta del proyecto:
```powershell
git init
git add .
git status
```
👀 **Revisá la lista de `git status`: NO tiene que aparecer `.env`** (solo `.env.example`). Si aparece `.env`, frená y avisame.

```powershell
git commit -m "Sistema de turnos: API, panel admin con login y deploy en Render"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/turnos-pymes.git
git push -u origin main
```
La primera vez se abre una ventana para iniciar sesión en GitHub: aceptá.

---

## Paso 3 — Generar la contraseña del panel online

Usá una contraseña **distinta** a la de tu PC:
```powershell
npm run generar-hash
```
Copiá la línea larga que empieza con `scrypt$...` (la vas a pegar en Render).

---

## Paso 4 — Crear el servicio en Render

1. Entrá a https://render.com → **Get Started** → registrate **con tu cuenta de GitHub**.
2. Arriba **+ New** → **Blueprint**.
3. Conectá tu repositorio `turnos-pymes` (si no aparece: *Configure account* → dale acceso a ese repo).
4. Render lee el archivo `render.yaml` y muestra el servicio `turnos-pymes`. Te pide 3 valores:
   | Variable              | Qué poner                                  |
   |-----------------------|--------------------------------------------|
   | `MONGODB_URI`         | Tu URI de Atlas completa                   |
   | `ADMIN_USER`          | El usuario del panel (ej: `admin`)         |
   | `ADMIN_PASSWORD_HASH` | La línea `scrypt$...` del paso 3           |
5. **Apply** / **Deploy Blueprint**. Esperá 2–5 minutos hasta que diga **Live** 🟢.

> Para cambiar el nombre del negocio u horarios: en Render → tu servicio → **Environment** → editás `NEGOCIO_NOMBRE`, `HORA_APERTURA`, etc. → **Save changes** (se reinicia solo).

---

## Paso 5 — Probar

Con la URL que te da Render (arriba a la izquierda del servicio):

- `https://TU-URL.onrender.com/api/health` → tiene que decir `"baseDeDatos":"conectado"`
- `https://TU-URL.onrender.com` → hacé una reserva
- `https://TU-URL.onrender.com/admin` → entrá con el usuario y contraseña del paso 3

---

## Actualizar la web después

Cada vez que cambies algo:
```powershell
git add .
git commit -m "Describí el cambio"
git push
```
Render lo publica solo en 2–3 minutos.

---

## Problemas comunes

| Síntoma en los *Logs* de Render | Solución |
|---|---|
| `querySrv ENOTFOUND` / `bad auth` | La `MONGODB_URI` está mal o tiene la contraseña vieja → corregila en *Environment* |
| `Server selection timed out` | Falta el paso 1 (Network Access `0.0.0.0/0`) |
| Login dice "Usuario o contraseña incorrectos" | Regenerá el hash (paso 3) y pegalo de nuevo, completo |
| La primera carga tarda ~1 minuto | Normal en el plan gratis: el servidor "duerme" sin visitas y se despierta solo |
