# Guía de Pruebas - Sistema de Manejo de Sesión

## Resumen de Cambios Implementados

Se ha implementado un sistema robusto para manejar la expiración de sesiones que resuelve el problema donde los datos del usuario permanecían visibles después de que la sesión expirara.

### Cambios Principales:

1. **Sistema de Eventos**: EventEmitter para comunicación entre servicios
2. **Detección Automática**: Interceptor detecta 401 y limpia el estado
3. **Limpieza Completa**: Los datos del usuario se eliminan al expirar la sesión
4. **Verificaciones Adicionales**: Pull-to-refresh verifica la sesión
5. **Prevención de Datos Obsoletos**: loadAppState limpia datos si no hay sesión

## Escenarios de Prueba

### 1. Prueba de Expiración de Sesión Básica

**Pasos:**
1. Inicia sesión con un usuario
2. Verifica que aparezcan los hábitos del usuario
3. Simula expiración del token (desde el backend o modificando el token en AsyncStorage)
4. Intenta hacer cualquier acción que requiera autenticación (crear hábito, completar, etc.)

**Resultado Esperado:**
- Los hábitos deberían desaparecer inmediatamente
- El estado de autenticación debe cambiar a "no autenticado"
- El usuario debe ver la interfaz limpia sin datos

### 2. Prueba de Pull-to-Refresh

**Pasos:**
1. Inicia sesión con un usuario
2. Crea algunos hábitos
3. Expira el token desde el backend
4. Haz pull-to-refresh en la pantalla principal

**Resultado Esperado:**
- El refresh debe detectar la sesión expirada
- Los datos deben limpiarse automáticamente
- No deben aparecer los hábitos del usuario anterior

### 3. Prueba de Cierre y Reapertura de App

**Pasos:**
1. Inicia sesión y crea hábitos
2. Cierra la aplicación completamente
3. Expira el token desde el backend
4. Abre la aplicación nuevamente

**Resultado Esperado:**
- Al abrir la app, debe verificar el token
- Si está expirado, no debe mostrar los hábitos
- El estado debe estar completamente limpio

### 4. Prueba de Login Después de Expiración

**Pasos:**
1. Deja que la sesión expire
2. Ve a la pantalla de perfil
3. Haz clic en "Iniciar Sesión"
4. Inicia sesión con otro usuario diferente

**Resultado Esperado:**
- Los datos del nuevo usuario deben cargarse correctamente
- No debe haber mezcla de datos entre usuarios
- El estado debe reflejar completamente al nuevo usuario

### 5. Prueba de Creación de Hábito con Sesión Expirada

**Pasos:**
1. Inicia sesión y navega a crear un hábito
2. Antes de guardar, expira el token desde el backend
3. Intenta guardar el hábito

**Resultado Esperado:**
- Debe detectar la sesión expirada
- El estado debe limpiarse
- El hábito no debe guardarse

### 6. Prueba de Múltiples Errores 401

**Pasos:**
1. Inicia sesión con un usuario
2. Expira el token
3. Realiza múltiples acciones rápidamente que generen errores 401

**Resultado Esperado:**
- Solo debe ejecutarse una limpieza de estado
- No debe haber comportamiento errático
- El estado debe quedar consistente

## Verificación del Comportamiento

### Logs a Observar

Cuando la sesión expire, deberías ver estos logs en la consola:

```
Session expired - 401 detected, event emitted
Handling session expiry...
Session expired - state cleared and user logged out
```

### Estado a Verificar

Después de la expiración de sesión:

1. **AppContext**:
   - `isAuthenticated`: false
   - `authUser`: null
   - `state.habits`: []
   - `state.completions`: []

2. **AsyncStorage**:
   - Token eliminado
   - Estado guardado sin datos de usuario

3. **UI**:
   - Sin hábitos visibles
   - Sin información de usuario autenticado
   - Botón de "Iniciar Sesión" disponible

## Simulación de Token Expirado

### Opción 1: Desde el Backend
- Configura el token para que expire rápidamente (ej: 1 minuto)
- Invalida el token manualmente desde el servidor

### Opción 2: Modificar AsyncStorage
```javascript
// En React Native Debugger o código de prueba
import AsyncStorage from '@react-native-async-storage/async-storage';

// Modificar el token para hacerlo inválido
await AsyncStorage.setItem('habitRush_auth_token', 'token_invalido');
```

### Opción 3: Eliminar el Token
```javascript
// Eliminar completamente el token
await AsyncStorage.removeItem('habitRush_auth_token');
```

## Troubleshooting

### Si los datos persisten después de expirar:

1. **Verifica los logs**: Busca el mensaje "Session expired"
2. **Verifica el interceptor**: Asegúrate de que apiClient.ts esté detectando el 401
3. **Verifica el listener**: AppContext debe estar escuchando SESSION_EXPIRED
4. **Limpia el caché**: Fuerza un reload completo de la app

### Si la limpieza ocurre muy frecuentemente:

1. **Verifica el token**: Puede estar mal configurado
2. **Verifica la red**: Problemas de conexión pueden causar falsos 401
3. **Verifica el backend**: El servidor debe responder correctamente

## Confirmación de Funcionamiento Correcto

El sistema está funcionando correctamente cuando:

✅ Los datos del usuario se limpian al detectar 401
✅ No hay datos obsoletos después de cerrar sesión
✅ El pull-to-refresh verifica la autenticación
✅ No hay mezcla de datos entre usuarios
✅ Los eventos de sesión se manejan una sola vez
✅ La UI se actualiza inmediatamente al expirar la sesión

## Notas Adicionales

- El sistema mantiene las preferencias del usuario (tema, fuente) incluso después de la expiración
- Los datos locales (modo offline) no se ven afectados si no hay autenticación
- El sistema es resiliente a múltiples errores 401 simultáneos