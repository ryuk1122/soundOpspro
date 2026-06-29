# SoundOps Pro - Produccion

Esta guia deja el proyecto listo para GitHub, Railway, Firebase, Cloudinary y APK Android.

## 1. GitHub

El repositorio no debe subir secretos. Ya estan ignorados:

- `backend/.env`
- `backend/env`
- `backend/firebase_credentials*.json`
- `frontend/.env`
- `frontend/dist`
- `frontend/android/app/build`
- logs y dependencias

Para subirlo:

```powershell
git add .
git commit -m "Prepare SoundOps Pro for production"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/soundops-pro.git
git push -u origin main
```

## 2. Railway backend

Produccion actual:

```text
https://api-production-45a2.up.railway.app
```

Crear un servicio desde GitHub y configurar:

- Root directory: `backend`
- Config file: `railway.json`
- Start command: ya esta en `backend/railway.json`
- Healthcheck: `/api/health`

Variables necesarias en Railway:

```env
JWT_SECRET=use-un-secreto-largo-y-unico
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=*

CLOUDINARY_CLOUD_NAME=dl2m6strc
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

FIREBASE_CREDENTIALS_B64=tu-service-account-json-en-base64
```

Para crear `FIREBASE_CREDENTIALS_B64` en PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("backend\firebase_credentials.json.json")) | Set-Clipboard
```

Despues de pegarlo en Railway, abre:

```text
https://TU-DOMINIO-RAILWAY.up.railway.app/api/health
```

Debe responder:

```json
{"status":"ok","service":"SoundOps Pro API"}
```

## 3. Firebase

La app usa Firestore con Firebase Admin.

En Firebase Console:

- Crear proyecto o usar el existente.
- Activar Firestore.
- Ir a Project settings > Service accounts.
- Generar una nueva private key.
- Guardarla solo localmente como `backend/firebase_credentials.json.json`.
- Subirla a Railway como `FIREBASE_CREDENTIALS_B64`.

No subir el JSON a GitHub.

## 4. Cloudinary

En Cloudinary copiar:

- Cloud name
- API key
- API secret

El backend sube imagenes de inventario a la carpeta `soundops/equipment`.

## 5. APK Android

Cuando Railway ya tenga dominio HTTPS, actualizar `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=https://TU-DOMINIO-RAILWAY.up.railway.app
```

APK local instalable:

```powershell
cd frontend
npm run build:android:release
```

Archivo final:

```text
frontend/android/app/build/outputs/apk/release/app-release.apk
```

Opcion mas profesional para descargar desde el celular con link:

```powershell
cd frontend
npx eas-cli login
npm run build:android:preview
```

EAS genera un enlace de descarga interno para instalar el APK directamente en Android.
