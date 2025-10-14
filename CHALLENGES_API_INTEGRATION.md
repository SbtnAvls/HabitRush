# Integración de APIs de Desafíos y Desafíos de Vida - HabitRush

## ✅ Integración Completada

Se ha implementado la sincronización completa de desafíos (challenges) y desafíos de vida (life challenges) con el backend.

## 🎯 Características Implementadas

### 1. **Servicio de Desafíos** (`src/services/challengeService.ts`)

✅ **Todas las APIs integradas**:
- `GET /api/challenges` - Listar desafíos activos disponibles
- `GET /api/users/me/challenges` - Obtener desafíos asignados al usuario
- `POST /api/challenges/:id/assign` - Asignar desafío a un hábito
- `PUT /api/users/me/challenges/:id` - Actualizar estado del desafío
- Métodos auxiliares: `completeChallenge()`, `discardChallenge()`

### 2. **Servicio de Desafíos de Vida** (`src/services/lifeChallengeService.ts`)

✅ **Todas las APIs integradas**:
- `GET /api/life-challenges` - Listar desafíos de vida activos (pública, sin auth)
- `POST /api/life-challenges/:id/redeem` - Redimir desafío de vida
- `GET /api/users/me/life-history` - Historial de cambios de vidas
- Método auxiliar: `getLifeChallengesWithProgress()` - Combina lista con progreso del usuario

### 3. **Sincronización Automática en AppContext**

✅ **Al iniciar la app (autenticado)**:
- Carga desafíos activos del servidor
- Carga desafíos de vida con progreso del usuario
- Actualiza estado (NO storage)

✅ **Al completar desafío**:
- Si autenticado: Actualiza en servidor
- Si local: Guarda en storage

✅ **Al redimir desafío de vida**:
- Si autenticado: Redime en servidor y actualiza vidas
- Si local: Actualiza localmente

## 📋 APIs del Backend Integradas

### Desafíos (Challenges)

#### GET `/api/challenges`
**Listar desafíos activos disponibles**

```typescript
const challenges = await ChallengeService.getActiveChallenges();
// Retorna: Challenge[]
```

**Respuesta del servidor**:
```json
[
  {
    "id": "9b342a61-4eb9-4b8e-b2c1-0f1bb8b0d9a6",
    "title": "30 minutos de lectura",
    "description": "Lee durante 30 minutos consecutivos.",
    "difficulty": "medium",
    "type": "learning",
    "estimated_time": 30,
    "is_active": true,
    "created_at": "2024-06-01T12:00:00.000Z"
  }
]
```

#### GET `/api/users/me/challenges`
**Obtener desafíos asignados al usuario**

```typescript
const userChallenges = await ChallengeService.getUserChallenges();
// Retorna: UserChallengeAPI[]
```

**Respuesta del servidor**:
```json
[
  {
    "id": "f44f6a0f-ccbb-44ea-9027-2a0da53d6f1b",
    "user_id": "c7d806d9-2d51-4ea8-9f32-1a6a4544e0a0",
    "habit_id": "63f3f3a7-1e90-49e0-b22e-8740a6bff199",
    "challenge_id": "9b342a61-4eb9-4b8e-b2c1-0f1bb8b0d9a6",
    "status": "assigned",
    "assigned_at": "2024-07-10T10:15:00.000Z",
    "completed_at": null,
    "challenge_title": "30 minutos de lectura",
    "challenge_description": "Lee durante 30 minutos consecutivos.",
    "challenge_difficulty": "medium",
    "challenge_type": "learning"
  }
]
```

**Nota importante**: El backend devuelve los datos del desafío como campos planos (`challenge_title`, `challenge_description`, etc.) en lugar de un objeto `challenge` anidado.

#### POST `/api/challenges/:id/assign`
**Asignar desafío a un hábito**

```typescript
const userChallenge = await ChallengeService.assignChallenge(
  'challenge_1',
  'habit_456'
);
```

**Body enviado**:
```json
{
  "habitId": "habit_456"
}
```

**Respuesta 201**:
```json
{
  "id": "user_challenge_1",
  "user_id": "user_123",
  "challenge_id": "challenge_1",
  "habit_id": "habit_456",
  "status": "assigned",
  "assigned_at": "2024-10-12T10:00:00.000Z"
}
```

**Errores**:
- 400: `habitId is required`
- 404: `Challenge not found or inactive.`
- 404: `Habit not found.`
- 409: `Challenge already assigned to this habit.`

#### PUT `/api/users/me/challenges/:id`
**Actualizar estado del desafío**

```typescript
// Completar
await ChallengeService.completeChallenge('user_challenge_1');

// Descartar
await ChallengeService.discardChallenge('user_challenge_1');

// O manualmente
await ChallengeService.updateChallengeStatus('user_challenge_1', 'completed');
```

**Body enviado**:
```json
{
  "status": "completed"
}
```

**Respuesta 200**: Desafío actualizado

**Errores**:
- 400: `Invalid status provided. Must be 'completed' or 'discarded'.`
- 404: `User challenge not found or permission denied.`

### Desafíos de Vida (Life Challenges)

#### GET `/api/life-challenges`
**Listar desafíos de vida activos (público, sin auth)**

```typescript
const lifeChallenges = await LifeChallengeService.getActiveLifeChallenges();
// Retorna: LifeChallenge[]
```

**Respuesta del servidor**:
```json
[
  {
    "id": "0a4f1930-9d98-44f9-aee1-5902f7ecb2fb",
    "title": "Descanso consciente",
    "description": "Tómate 15 minutos para desconectarte totalmente.",
    "reward": 1,
    "redeemable_type": "once",
    "icon": "leaf",
    "verification_function": "manual_confirmation",
    "is_active": true
  }
]
```

#### POST `/api/life-challenges/:id/redeem`
**Redimir desafío de vida**

```typescript
const result = await LifeChallengeService.redeemLifeChallenge('life_challenge_1');
```

**Respuesta 200**:
```json
{
  "message": "Life challenge redeemed successfully",
  "livesGained": 1,
  "currentLives": 3
}
```

**Errores**:
- 404: `Life challenge not found or not active`
- 409: `Life challenge already redeemed`
- 404: `User not found`
- 400: `Cannot gain more lives`

#### GET `/api/users/me/life-history`
**Obtener historial de cambios de vidas**

```typescript
const history = await LifeChallengeService.getLifeHistory();
// Retorna: LifeHistoryAPI[]
```

**Respuesta del servidor**:
```json
[
  {
    "id": "6f2c1d5b-8a87-4f8d-baf0-1a718c23f4b2",
    "user_id": "c7d806d9-2d51-4ea8-9f32-1a6a4544e0a0",
    "lives_change": -1,
    "current_lives": 2,
    "reason": "habit_missed",
    "related_habit_id": "63f3f3a7-1e90-49e0-b22e-8740a6bff199",
    "related_user_challenge_id": null,
    "related_life_challenge_id": null,
    "created_at": "2024-07-12T08:30:00.000Z"
  },
  {
    "id": "7a1b2c3d-4e5f-6789-abcd-ef0123456789",
    "user_id": "c7d806d9-2d51-4ea8-9f32-1a6a4544e0a0",
    "lives_change": 1,
    "current_lives": 3,
    "reason": "life_challenge_redeemed",
    "related_habit_id": null,
    "related_user_challenge_id": null,
    "related_life_challenge_id": "0a4f1930-9d98-44f9-aee1-5902f7ecb2fb",
    "created_at": "2024-07-13T14:20:00.000Z"
  }
]
```

**Nota importante**: 
- El backend usa `lives_change` (no `change`) y `current_lives`
- Los campos relacionados son `related_habit_id`, `related_user_challenge_id`, `related_life_challenge_id`
- No incluye el objeto `life_challenge` anidado

## 🔄 Estrategia de Sincronización

### Usuarios Autenticados

**Al iniciar app**:
```
GET /api/challenges → Desafíos activos
GET /api/life-challenges → Desafíos de vida
GET /api/users/me/life-history → Historial de vidas
↓
Combinar datos y actualizar estado
↓
NO guardar en storage ✅
```

**Al completar desafío**:
```
PUT /api/users/me/challenges/:id
{ "status": "completed" }
↓
Actualizar estado local
↓
NO guardar en storage ✅
```

**Al redimir desafío de vida**:
```
POST /api/life-challenges/:id/redeem
↓
Respuesta: { livesGained: 1, currentLives: 3 }
↓
Actualizar vidas del usuario con valor del servidor
↓
NO guardar en storage ✅
```

### Usuarios Locales

**Al completar desafío**:
```
Actualizar localmente
↓
Guardar en storage ✅
```

**Al redimir desafío de vida**:
```
Actualizar localmente
↓
Guardar en storage ✅
```

## 🔧 Uso del Servicio

### En AppContext (Ya integrado)

```typescript
// Completar desafío
await completeChallenge(userChallengeId, habitId);
// Se sincroniza automáticamente si está autenticado ✅

// Redimir desafío de vida
await redeemLifeChallenge(lifeChallengeId);
// Se sincroniza automáticamente si está autenticado ✅
```

### Uso Directo (Si necesitas más control)

```typescript
import { ChallengeService } from '../services/challengeService';
import { LifeChallengeService } from '../services/lifeChallengeService';

// Desafíos
const challenges = await ChallengeService.getActiveChallenges();
const userChallenges = await ChallengeService.getUserChallenges();
const assigned = await ChallengeService.assignChallenge('challenge_1', 'habit_456');
await ChallengeService.completeChallenge('user_challenge_1');
await ChallengeService.discardChallenge('user_challenge_1');

// Desafíos de vida
const lifeChallenges = await LifeChallengeService.getActiveLifeChallenges();
const withProgress = await LifeChallengeService.getLifeChallengesWithProgress();
const result = await LifeChallengeService.redeemLifeChallenge('life_challenge_1');
const history = await LifeChallengeService.getLifeHistory();
```

## 📊 Flujo Completo de Usuario

### Asignar y Completar Desafío

```
1. Usuario pierde racha de un hábito
   ↓
2. Sistema asigna desafío automáticamente
   → POST /api/challenges/:id/assign
   ↓
3. Usuario completa el desafío
   → PUT /api/users/me/challenges/:id { status: "completed" }
   ↓
4. Hábito se reactiva ✅
```

### Redimir Desafío de Vida

```
1. Usuario cumple condición (ej: semana perfecta)
   ↓
2. Usuario toca "Redimir"
   → POST /api/life-challenges/:id/redeem
   ↓
3. Servidor valida y responde:
   { livesGained: 1, currentLives: 3 }
   ↓
4. Vidas se actualizan en el estado ✅
```

## 🎨 Métodos Auxiliares

### `getLifeChallengesWithProgress()`

Combina la lista pública de desafíos con el historial del usuario:

```typescript
const lifeChallenges = await LifeChallengeService.getLifeChallengesWithProgress();
// Retorna LifeChallenge[] con completedCount actualizado

// Ejemplo de resultado:
[
  {
    id: '0a4f1930-9d98-44f9-aee1-5902f7ecb2fb',
    title: 'Descanso consciente',
    reward: 1,
    redeemable: 'once',
    icon: 'leaf',
    completedCount: 1 // ← Calculado desde el historial
  },
  {
    id: 'life_challenge_2',
    title: 'Mes Imparable',
    reward: 2,
    redeemable: 'unlimited',
    icon: 'star',
    completedCount: 3 // ← Puede ser > 1 si es unlimited
  }
]
```

## 🔒 Política de Storage

### Usuarios Autenticados
- ❌ Desafíos NUNCA en storage local
- ✅ Solo en memoria
- ✅ Fuente única: Servidor
- ✅ Se borran al cerrar sesión

### Usuarios Locales
- ✅ Desafíos SÍ en storage
- ✅ Persisten entre sesiones
- ✅ Modo offline completo

## 🧪 Testing Sugerido

### Caso 1: Asignar Desafío
```typescript
// Autenticado
const userChallenge = await ChallengeService.assignChallenge(
  'challenge_1',
  'habit_456'
);

// Verificar en servidor
const userChallenges = await ChallengeService.getUserChallenges();
// Debe incluir el desafío asignado
```

### Caso 2: Completar Desafío
```typescript
// Autenticado
await completeChallenge('user_challenge_1', 'habit_456');

// Verificar estado actualizado
// state.user.completedChallenges debe incluir el ID
// El hábito debe estar activo de nuevo
```

### Caso 3: Redimir Desafío de Vida
```typescript
// Autenticado
const vidasAntes = state.user.lives;
await redeemLifeChallenge('life_challenge_1');

// Verificar vidas actualizadas
const vidasDespues = state.user.lives;
// vidasDespues debe ser mayor que vidasAntes

// Verificar historial
const history = await LifeChallengeService.getLifeHistory();
// Debe incluir el registro de redención
```

### Caso 4: Desafío Ya Redimido
```typescript
// Intentar redimir el mismo desafío "once" dos veces
try {
  await redeemLifeChallenge('life_challenge_1');
  await redeemLifeChallenge('life_challenge_1'); // ← Error
} catch (error) {
  // Error 409: Life challenge already redeemed
}
```

## 📝 Archivos Modificados/Creados

### Nuevos
- ✅ `src/services/challengeService.ts` (180 líneas)
  - ChallengeAPI interface
  - UserChallengeAPI interface
  - DTOs para assign/update
  - ChallengeMapper class
  - ChallengeService class con 6 métodos

- ✅ `src/services/lifeChallengeService.ts` (130 líneas)
  - LifeChallengeAPI interface
  - LifeHistoryAPI interface
  - RedeemLifeChallengeResponse interface
  - LifeChallengeMapper class
  - LifeChallengeService class con 5 métodos

### Modificados
- ✅ `src/context/AppContext.tsx`
  - Importados ChallengeService y LifeChallengeService
  - Modificado `loadAppState()` - carga challenges del servidor
  - Modificado `completeChallenge()` - completa en servidor
  - Modificado `redeemLifeChallenge()` - redime en servidor

## ⚠️ Consideraciones

### Validación de Desafíos de Vida
El backend valida las condiciones con `verification_function`. Por ejemplo:
- `check_perfect_week`: Verifica 7 días consecutivos sin fallos
- `check_month_imparable`: Verifica 30 días con X% de completación

### Redeemable: Once vs Unlimited
- **once**: Solo puede redimirse una vez (ej: Descanso consciente)
- **unlimited**: Puede redimirse múltiples veces (ej: Mes Imparable)

**Nota**: El backend usa el campo `redeemable_type` (no `redeemable`)

### Límite de Vidas
Si el usuario ya tiene `maxLives`, no puede ganar más:
- Error 400: `Cannot gain more lives`

### Estado de Desafíos
Estados posibles:
- **assigned**: Asignado pero no completado
- **completed**: Completado exitosamente
- **discarded**: Descartado por el usuario

## 💡 Ventajas

### Para Usuarios Autenticados
- 🎯 **Desafíos sincronizados**: Mismo estado en múltiples dispositivos
- 📊 **Historial completo**: Todas las vidas ganadas/perdidas registradas
- 🔄 **Sincronización real**: Desafíos actualizados del servidor
- 🔐 **Validación segura**: El servidor verifica las condiciones

### Para Usuarios Locales
- 💾 **Funcionalidad offline**: Sin cambios
- 🔒 **Privacidad garantizada**: Datos solo locales
- ⚡ **Rendimiento igual**: Sin llamadas al servidor

## ✅ Checklist de Integración

- [x] Crear ChallengeService con todas las APIs
- [x] Crear LifeChallengeService con todas las APIs
- [x] Mappers entre formatos
- [x] Integración en AppContext
- [x] Cargar del servidor al iniciar
- [x] Completar desafío en servidor
- [x] Redimir desafío de vida en servidor
- [x] NO guardar en storage si autenticado
- [x] Limpieza al cerrar sesión
- [x] Manejo de errores
- [x] Sin errores de linter
- [x] Documentación completa

## 🎉 Conclusión

✅ **Integración completa de APIs de desafíos**
✅ **Sincronización automática con backend**
✅ **Política clara de storage**
✅ **Mappers automáticos**
✅ **Historial de vidas completo**
✅ **Listo para usar**

**¡Los desafíos ahora se sincronizan automáticamente con el backend!** 🚀

