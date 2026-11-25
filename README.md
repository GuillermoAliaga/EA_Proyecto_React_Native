# EA Proyecto React Native

Aplicación móvil nativa con Expo, React Native, TypeScript y Expo Router. Incluye rutas públicas y
protegidas, inicio/restauración de sesión, cliente HTTP con renovación de credenciales y componentes
nativos reutilizables.

## Requisitos

- Node.js compatible con Expo SDK 58.
- Expo Go o un emulador/simulador Android o iOS.

## Instalación y ejecución

```bash
npm install
npm start
```

Para abrir directamente una plataforma:

```bash
npm run android
npm run ios
```

La URL de la API se configura con `EXPO_PUBLIC_API_URL`. Si está vacía, se usa `http://10.0.2.2:1337`
en el emulador Android y `http://localhost:1337` en el simulador iOS. En un dispositivo físico, copia
`.env.example` a `.env` e indica la IP LAN del equipo que ejecuta la API, por ejemplo
`EXPO_PUBLIC_API_URL=http://192.168.1.25:1337`. Reinicia Expo después de cambiarla.

Para acceder desde un dispositivo físico, el backend debe escuchar en `0.0.0.0:1337` y el firewall
del equipo debe permitir conexiones entrantes al puerto 1337. Esta configuración depende del backend
y del sistema operativo; debe verificarse allí.

El cliente HTTP está en `src/services/apiClient.ts`. Envía cookies con `credentials: 'include'`,
mantiene el access token solo en memoria y, si el servidor devuelve un refresh token en JSON, lo
guarda con `expo-secure-store`. Al recibir un `401`, comparte una sola petición a `/auth/refresh` y
reintenta la petición original como máximo una vez. El backend debe aceptar el refresh token en el
cuerpo JSON cuando use el flujo de tokens.

La persistencia real de cookies al cerrar la app y el ciclo login → cierre forzado → refresh deben
probarse en dispositivos/emuladores iOS y Android contra el backend. No se pueden confirmar desde
la compilación local.

La autenticación restaura la sesión con `POST /auth/refresh` y `GET /users/me`. El inicio de sesión
usa `POST /auth/login`; el registro envía únicamente nombre, correo y contraseña a
`POST /auth/register`. El cierre llama a `POST /auth/logout` y limpia siempre la sesión local.
El modelo de respuesta debe incluir el usuario en login o exponerlo mediante `/users/me`.

## Estructura

```text
app/
  _layout.tsx
  index.tsx
  login.tsx
  register.tsx
  (protected)/
    _layout.tsx
    index.tsx
    chat.tsx
    activities/
    reports/
    users/
src/
  components/
    layout/
    ui/
  config/
  context/
  hooks/
  models/
  services/
```

`src/components/ui` contiene los controles visuales nativos; `src/models` define los tipos de la API.
Registro e inicio de sesión están implementados. Home, chat, actividades y denuncias permanecen como
marcadores para las siguientes fases; la navegación admin incluye accesos a usuarios y revisión.

## Validación

```bash
npm run typecheck
```
