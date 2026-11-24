# EA Proyecto React Native

Aplicación móvil nativa con Expo, React Native, TypeScript y Expo Router. La base incluye rutas
públicas y protegidas, un contexto de sesión preparado para conectar la autenticación, y componentes
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

La URL de la API se configura con `EXPO_PUBLIC_API_URL`; por defecto se usa `http://localhost:1337`.
En un dispositivo físico, sustituye `localhost` por la dirección IP accesible de tu máquina.

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
El registro, el inicio de sesión y las pantallas protegidas son marcadores para las siguientes fases.

## Validación

```bash
npm run typecheck
```
