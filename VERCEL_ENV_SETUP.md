# Configuración de Variables de Entorno en Vercel

## 🔴 Problema Actual

Si ves URLs como esta en las peticiones:
```
https://react-supabase-auth-template-phi.vercel.app/web-production-1fdcc.up.railway.app/devices
```

Esto significa que la variable `VITE_API_BASE_URL` está mal configurada o no está configurada.

## ✅ Solución

### 1. Ir a Vercel Dashboard

1. Accede a tu proyecto en [Vercel](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**

### 2. Configurar la Variable

Agrega o edita la siguiente variable:

**Name:** `VITE_API_BASE_URL`

**Value:** `https://web-production-1fdcc.up.railway.app`

⚠️ **IMPORTANTE:**
- ✅ **Recomendado:** Debe empezar con `https://` (o `http://` solo en desarrollo local)
- ✅ No debe terminar con `/`
- ✅ Debe ser la URL completa del backend
- ⚠️ **Nota:** Si no agregas `https://`, el código lo agregará automáticamente como `https://`, pero es mejor configurarlo correctamente
- ❌ NO usar: `/web-production-1fdcc.up.railway.app` (URL relativa con / al inicio)

### 3. Seleccionar Ambientes

Asegúrate de seleccionar todos los ambientes donde quieres que aplique:
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. Re-deploy

Después de configurar la variable:
1. Ve a **Deployments**
2. Haz clic en los 3 puntos (⋯) del último deployment
3. Selecciona **Redeploy**

O simplemente haz un nuevo push a tu repositorio.

## 🔍 Verificación

Después del deploy, abre la consola del navegador (F12) y deberías ver:

```
🔗 API Base URL configurada: https://web-production-1fdcc.up.railway.app
```

Si ves un error o una URL incorrecta, verifica:
1. Que la variable esté configurada correctamente
2. Que hayas hecho re-deploy después de configurarla
3. Que el valor no tenga espacios al inicio o final

## 📝 Ejemplo de Configuración Correcta

```
VITE_API_BASE_URL=https://web-production-1fdcc.up.railway.app
```

## 🐛 Debugging

Si el problema persiste:

1. Abre la consola del navegador
2. Busca el log: `🔗 API Base URL configurada:`
3. Verifica que la URL sea correcta
4. Revisa la pestaña Network en DevTools para ver la URL completa de las peticiones
