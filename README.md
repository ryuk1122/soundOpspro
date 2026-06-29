# SoundOps Pro

Aplicacion para inventario de audio profesional, logistica de eventos y calculos acusticos.

## Estado

Proyecto preparado para:

- Backend FastAPI en Railway
- Base de datos Firestore con Firebase Admin
- Imagenes en Cloudinary
- Frontend Expo / React Native
- APK Android instalable

Ver guia completa en [DEPLOYMENT.md](./DEPLOYMENT.md).

## Backend

El backend usa FastAPI, Firebase Firestore y Cloudinary. La nube configurada para imagenes es `dl2m6strc`.

```powershell
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Para desarrollo local usa `backend/.env`. Para publicar, carga las mismas variables del archivo `backend/.env.example` en el proveedor de hosting. No subas `.env` ni credenciales JSON a Git.

Para Railway usa `backend` como root directory y `backend/railway.json` como configuracion.

## Frontend

```powershell
cd frontend
npm install
npm start
```

`frontend/.env` debe apuntar al backend. Para celular fisico no uses `127.0.0.1`; usa la IP LAN de la PC o una URL publica HTTPS.

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.29:8001
```

## Android

Para probar con Expo Go:

```powershell
cd frontend
npx expo start --tunnel
```

Para generar un APK local instalable e independiente:

```powershell
cd frontend
npm run prebuild:android
npm run build:android:release
```

El APK release queda en `frontend/android/app/build/outputs/apk/release/app-release.apk`. El comando local compila `arm64-v8a`, que sirve para celulares Android modernos. Para compilar todas las arquitecturas usa `npm run build:android:release:all`.

Para un APK debug de desarrollo usa `npm run build:android:local`.

Para generar un APK interno en Expo/EAS:

```powershell
cd frontend
npx eas-cli login
npm run build:android:preview
```

## Verificacion

```powershell
cd backend
python -m py_compile server.py

cd ..\frontend
npm run type-check
npm run build:web
```
