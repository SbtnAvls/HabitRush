# Sistema de Autenticación - HabitRush

## Descripción

Se ha implementado un sistema de autenticación completo que permite a los usuarios crear cuentas y sincronizar sus hábitos. El sistema está diseñado para no ser intrusivo: **no se muestra una pantalla de login al inicio de la aplicación**. En su lugar, se solicita autenticación cuando el usuario intenta crear su primer hábito.

## Características Implementadas

### 1. Cliente de API con Axios (`src/services/apiClient.ts`)

Cliente HTTP configurado con interceptores:

- **Instancia de Axios configurada** con base URL y timeout
- **Interceptor de request** que agrega automáticamente el token de autorización
- **Interceptor de response** que maneja errores globalmente
- **Eliminación automática de token** en caso de error 401
- **Cliente público** para endpoints sin autenticación (login, registro)
- **Manejo de errores mejorado** con mensajes descriptivos

### 2. Servicio de Autenticación (`src/services/authService.ts`)

Gestiona todas las operaciones relacionadas con autenticación usando Axios:

- **Registro de usuarios** (`register`)
- **Inicio de sesión** (`login`)
- **Obtener información del usuario autenticado** (`getMe`)
- **Cerrar sesión** (`logout`)
- **Actualizar perfil de usuario** (`updateProfile`)
- **Eliminar cuenta** (`deleteAccount`)
- **Verificar autenticación** (`isAuthenticated`)
- **Gestión de tokens JWT** (guardar, obtener, eliminar)

### 3. Componente de Autenticación (`src/components/AuthModal.tsx`)

Modal unificado para login y registro con:

- Formulario de login con email y contraseña
- Formulario de registro con nombre, email y contraseña
- Alternancia fácil entre modos login/registro
- Validación de campos
- Indicadores de carga
- Manejo de errores con mensajes amigables

### 4. Contexto de la Aplicación Actualizado (`src/context/AppContext.tsx`)

Nuevas funciones y estados:

- `isAuthenticated`: Boolean que indica si el usuario está autenticado
- `authUser`: Información del usuario autenticado desde la API
- `checkAuthentication()`: Verifica si hay un token válido
- `logout()`: Cierra la sesión del usuario

### 5. Modal de Crear Hábito Actualizado (`src/components/AddHabitModal.tsx`)

- Detecta si es el primer hábito del usuario
- Si es el primer hábito y el usuario no está autenticado, muestra el `AuthModal`
- Permite continuar con la creación del hábito después de autenticarse

### 6. Pantalla de Perfil Actualizada (`src/screens/ProfileScreen.tsx`)

Muestra información de autenticación:

- Email del usuario (si está autenticado)
- Badge de "Cuenta sincronizada"
- Sección de cuenta con estado
- Botón de "Iniciar Sesión / Registrarse" (si no está autenticado)
- Botón de "Cerrar Sesión" (si está autenticado)

### 7. Tipos de TypeScript (`src/types/index.ts`)

Nuevos interfaces:

- `AuthState`: Estado de autenticación
- `AuthUser`: Usuario desde la API
- Campo `email?` agregado a `User` (opcional para compatibilidad)

### 8. Configuración de API (`src/config/api.config.ts`)

Archivo de configuración centralizado para:

- URL base de la API
- Endpoints de la API
- Configuración de timeouts
- Headers por defecto

## APIs Integradas

El sistema está preparado para trabajar con las siguientes APIs:

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario autenticado
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios

- `GET /api/users/me` - Obtener perfil
- `PUT /api/users/me` - Actualizar perfil
- `DELETE /api/users/me` - Eliminar cuenta

Todas las peticiones autenticadas incluyen el header:
```
Authorization: Bearer <jwt_token>
```

**Nota**: El sistema usa **Axios** con interceptores para agregar automáticamente el token de autorización a todas las peticiones. No necesitas configurar el header manualmente.

## Configuración

### 1. Configurar la URL de la API

Edita el archivo `src/config/api.config.ts` y cambia la URL base:

```typescript
// Para producción
export const API_BASE_URL = 'https://api.tudominio.com';

// Para desarrollo local
export const API_BASE_URL = 'http://localhost:3000';

// Para testing en dispositivo físico (usa la IP de tu computadora)
export const API_BASE_URL = 'http://192.168.1.100:3000';
```

### 2. Configurar el Backend

Asegúrate de que tu servidor backend:

1. Esté ejecutándose y accesible desde la red
2. Tenga configurados los endpoints de autenticación según la especificación
3. Devuelva tokens JWT válidos
4. Maneje CORS correctamente para aceptar peticiones desde la app móvil

## Flujo de Usuario

### Primer Uso (Sin Autenticación)

1. El usuario abre la aplicación por primera vez
2. Puede explorar la interfaz sin restricciones
3. Al intentar crear su primer hábito, se le muestra el modal de autenticación
4. Puede elegir entre:
   - Registrarse (crear nueva cuenta)
   - Iniciar sesión (si ya tiene cuenta)
   - Cancelar (no crear el hábito)

### Con Autenticación

1. Una vez autenticado, el token se guarda localmente
2. El usuario puede crear hábitos sin restricciones
3. La autenticación se verifica al iniciar la app
4. El usuario puede cerrar sesión desde el perfil
5. Puede iniciar sesión nuevamente en cualquier momento desde el perfil

## Almacenamiento Local

El sistema utiliza `AsyncStorage` de React Native para:

- **Token JWT**: Guardado en `habitRush_auth_token`
- **Estado de la app**: Guardado en `habitRush_app_state`

El token persiste entre sesiones, por lo que el usuario no necesita autenticarse cada vez que abre la app.

## Seguridad

### Implementado

- Tokens JWT almacenados de forma segura en AsyncStorage
- Validación de email en el frontend
- Contraseñas con mínimo 6 caracteres
- Eliminación automática de token en caso de error 401
- Cierre de sesión limpia que elimina el token local

### Recomendaciones para el Backend

- Usar HTTPS en producción
- Implementar rate limiting
- Usar tokens con expiración
- Implementar refresh tokens
- Validar y sanitizar todos los inputs
- Hash seguro de contraseñas (bcrypt)
- Protección contra ataques CSRF

## Manejo de Errores

El sistema maneja los siguientes casos:

- **Token inválido o expirado**: Se elimina automáticamente y se marca como no autenticado
- **Errores de red**: Se muestran mensajes amigables al usuario
- **Credenciales incorrectas**: Se informa al usuario sin revelar detalles de seguridad
- **Email duplicado**: Se informa que el usuario ya existe
- **Validaciones**: Se validan los campos antes de enviar al servidor

## Testing

### Probar sin Backend

Si aún no tienes el backend configurado:

1. La app funcionará normalmente en modo local
2. Los datos se guardarán solo en el dispositivo
3. No se podrá autenticar, pero se puede usar sin restricciones después del primer hábito

### Probar con Backend

1. Configura la URL en `src/config/api.config.ts`
2. Asegúrate de que el backend esté ejecutándose
3. Prueba el registro de un nuevo usuario
4. Prueba el inicio de sesión
5. Verifica que el token se guarde correctamente
6. Cierra y vuelve a abrir la app para verificar la persistencia

## Archivos Modificados/Creados

### Nuevos Archivos
- `src/services/apiClient.ts` - Cliente de Axios con interceptores
- `src/services/authService.ts` - Servicio de autenticación
- `src/components/AuthModal.tsx` - Modal de login/registro
- `src/config/api.config.ts` - Configuración de API
- `AUTHENTICATION.md` - Esta documentación

### Archivos Modificados
- `src/context/AppContext.tsx` - Agregado estado y funciones de autenticación
- `src/components/AddHabitModal.tsx` - Solicita autenticación en primer hábito
- `src/screens/ProfileScreen.tsx` - Muestra información de autenticación
- `src/types/index.ts` - Agregados tipos de autenticación
- `src/services/storage.ts` - Agregados métodos para token de autenticación

## Próximos Pasos Sugeridos

1. **Sincronización de datos**: Sincronizar hábitos con el backend
2. **Recuperación de contraseña**: Implementar flujo de reset de password
3. **Autenticación social**: Agregar login con Google/Facebook
4. **Perfil extendido**: Permitir actualizar más campos del perfil
5. **Validación de email**: Implementar verificación de email
6. **Modo offline**: Manejar creación de hábitos sin conexión

## Soporte

Si encuentras problemas:

1. Verifica que la URL de la API esté correcta
2. Asegúrate de que el backend esté ejecutándose
3. Revisa los logs de la consola para errores específicos
4. Verifica que los endpoints del backend coincidan con los esperados

