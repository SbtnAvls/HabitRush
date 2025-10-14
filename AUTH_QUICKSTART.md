# Guía Rápida - Sistema de Autenticación

## 🚀 Inicio Rápido

### 1. Configurar la URL de la API

Edita `src/config/api.config.ts` y cambia la línea:

```typescript
export const API_BASE_URL = 'https://your-api-url.com';
```

Por la URL de tu backend. Ejemplos:

```typescript
// Desarrollo local
export const API_BASE_URL = 'http://localhost:3000';

// Dispositivo físico en red local (usa la IP de tu PC)
export const API_BASE_URL = 'http://192.168.1.100:3000';

// Producción
export const API_BASE_URL = 'https://api.habitrush.com';
```

### 2. ¡Listo!

No necesitas hacer nada más. El sistema funcionará automáticamente:

- ✅ El usuario NO verá pantalla de login al abrir la app
- ✅ Se le pedirá crear cuenta cuando intente crear su primer hábito
- ✅ Puede elegir registrarse, iniciar sesión o cancelar
- ✅ Una vez autenticado, el token se guarda automáticamente
- ✅ Puede cerrar sesión desde su perfil

## 📋 Endpoints Necesarios en el Backend

Tu backend debe implementar estos endpoints:

### POST `/api/auth/register`
```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "mypassword"
}

// Response 201
{
  "token": "<jwt>"
}
```

### POST `/api/auth/login`
```json
// Request
{
  "email": "jane@example.com",
  "password": "mypassword"
}

// Response 200
{
  "token": "<jwt>"
}
```

### GET `/api/auth/me`
```
Header: Authorization: Bearer <jwt>

// Response 200
{
  "id": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "theme": "light",
  "font_size": "medium",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/auth/logout`
```
Header: Authorization: Bearer <jwt>

// Response 200
{
  "message": "Successfully logged out"
}
```

## 🧪 Probar sin Backend

Si aún no tienes el backend:

1. La app funcionará normalmente en modo local
2. Los datos se guardarán solo en el dispositivo
3. Simplemente cancela cuando aparezca el modal de autenticación
4. Podrás crear hábitos sin restricciones

## 🔍 Verificar que Funciona

1. **Inicia la app** - Debe abrir normalmente (sin pantalla de login)
2. **Intenta crear un hábito** - Debe aparecer el modal de autenticación
3. **Regístrate** con un email y contraseña
4. **Verifica en tu perfil** - Debe mostrar tu email y badge de "Cuenta sincronizada"
5. **Cierra la app y vuélvela a abrir** - Debe mantenerte autenticado

## ❌ Solución de Problemas

### "Error al registrar/iniciar sesión"

- ✅ Verifica que la URL en `api.config.ts` sea correcta
- ✅ Asegúrate de que el backend esté ejecutándose
- ✅ En dispositivos físicos, usa la IP de tu computadora (no `localhost`)
- ✅ Verifica que el backend acepte peticiones desde la app (CORS)

### "Token inválido"

- El token se limpia automáticamente
- Simplemente inicia sesión de nuevo

### "No puedo conectarme al backend"

```bash
# En desarrollo, prueba el endpoint manualmente:
curl http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

## 📱 Flujo de Usuario

```
Usuario abre app
     ↓
Explora libremente
     ↓
Intenta crear primer hábito
     ↓
Modal de autenticación aparece
     ↓
Usuario elige:
  → Registrarse (crea cuenta)
  → Iniciar sesión (usa cuenta existente)
  → Cancelar (no crea el hábito)
     ↓
Si se autentica:
  → Token se guarda
  → Puede crear hábitos
  → Sesión persiste
```

## 📄 Documentación Completa

Lee `AUTHENTICATION.md` para información detallada sobre:

- Arquitectura del sistema
- Seguridad
- APIs completas
- Archivos modificados
- Próximos pasos sugeridos

