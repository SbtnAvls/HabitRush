# 🌟 Resumen - Integración de APIs de Desafíos de Vida

## ✅ Completado

Se ha actualizado completamente el servicio de desafíos de vida (`lifeChallengeService.ts`) para que coincida con la estructura real que devuelve el backend.

## 🔧 Correcciones Realizadas

### 1. **Interface `LifeChallengeAPI`** actualizada

**Antes** ❌:
```typescript
{
  redeemable: 'once' | 'unlimited';
  icon: string; // Emoji
  created_at: string;
  updated_at: string;
}
```

**Ahora** ✅:
```typescript
{
  redeemable_type: 'once' | 'unlimited';  // ← Campo correcto
  icon: string; // Nombre del icono (ej: "leaf", "star")
  // Sin created_at ni updated_at
}
```

### 2. **Interface `LifeHistoryAPI`** corregida

**Antes** ❌:
```typescript
{
  life_challenge_id?: string;
  change: number;
  reason: string;
  life_challenge?: LifeChallengeAPI;
}
```

**Ahora** ✅:
```typescript
{
  lives_change: number;  // ← Campo correcto
  current_lives: number;  // ← Vidas actuales agregado
  reason: 'habit_missed' | 'challenge_completed' | 'life_challenge_redeemed';
  related_habit_id: string | null;
  related_user_challenge_id: string | null;
  related_life_challenge_id: string | null;  // ← Campos relacionados correctos
  // Sin objeto life_challenge anidado
}
```

### 3. **Mapper actualizado**

```typescript
static fromAPI(lifeChallengeAPI: LifeChallengeAPI, completedCount: number = 0) {
  return {
    // ...
    redeemable: lifeChallengeAPI.redeemable_type,  // ✅ Lee campo correcto
    icon: lifeChallengeAPI.icon,
    // ...
  };
}
```

### 4. **Contador de completaciones corregido**

```typescript
// Antes ❌
if (entry.life_challenge_id && entry.change > 0) {
  completionCounts[entry.life_challenge_id] = ...
}

// Ahora ✅
if (entry.related_life_challenge_id && entry.lives_change > 0) {
  completionCounts[entry.related_life_challenge_id] = ...
}
```

## 📊 APIs Integradas

### 1. GET `/api/life-challenges` (Pública)
**Respuesta real del backend**:
```json
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
```

### 2. POST `/api/life-challenges/:id/redeem` (Autenticada)
**Respuesta**:
```json
{
  "message": "Life challenge redeemed successfully",
  "livesGained": 1,
  "currentLives": 3
}
```

### 3. GET `/api/users/me/life-history` (Autenticada)
**Respuesta real del backend**:
```json
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
}
```

## 🔍 Campos Clave

### `reason` - Tipos de cambio de vidas
- **`habit_missed`**: Perdió una vida por no completar un hábito
- **`challenge_completed`**: Ganó una vida por completar un desafío
- **`life_challenge_redeemed`**: Ganó vidas por redimir un desafío de vida

### `redeemable_type` - Tipos de redención
- **`once`**: Solo puede redimirse una vez
- **`unlimited`**: Puede redimirse múltiples veces

### Campos relacionados
- **`related_habit_id`**: ID del hábito relacionado (si aplica)
- **`related_user_challenge_id`**: ID del desafío de usuario relacionado (si aplica)
- **`related_life_challenge_id`**: ID del desafío de vida relacionado (si aplica)

## 🔄 Flujo de Uso

### Cargar desafíos de vida con progreso
```typescript
// En AppContext al iniciar (si está autenticado)
const lifeChallenges = await LifeChallengeService.getLifeChallengesWithProgress();
// Retorna desafíos con completedCount calculado desde el historial
```

### Redimir desafío de vida
```typescript
// Usuario toca "Redimir"
const response = await LifeChallengeService.redeemLifeChallenge(challengeId);
// response: { livesGained: 1, currentLives: 3 }

// Actualizar vidas del usuario con el valor del servidor
user.lives = response.currentLives;
```

### Ver historial de vidas
```typescript
const history = await LifeChallengeService.getLifeHistory();
// Retorna lista cronológica de cambios de vidas con razones
```

## 🎨 Método Auxiliar

### `getLifeChallengesWithProgress()`

Combina la lista pública de desafíos con el historial del usuario:

```typescript
// 1. Obtiene lista pública
const challenges = await getActiveLifeChallenges();

// 2. Obtiene historial del usuario
const history = await getLifeHistory();

// 3. Cuenta redenciones por desafío
const counts = {};
history.forEach(entry => {
  if (entry.related_life_challenge_id && entry.lives_change > 0) {
    counts[entry.related_life_challenge_id]++;
  }
});

// 4. Agrega completedCount a cada desafío
return challenges.map(c => ({
  ...c,
  completedCount: counts[c.id] || 0
}));
```

## ✅ Integración en AppContext

Ya está integrado en `src/context/AppContext.tsx`:

```typescript
// Al cargar app (si autenticado)
const lifeChallenges = await LifeChallengeService.getLifeChallengesWithProgress();
appState.lifeChallenges = lifeChallenges;

// Al redimir desafío
const response = await LifeChallengeService.redeemLifeChallenge(challengeId);
updatedState.user.lives = response.currentLives; // ← Usa valor del servidor
```

## 🐛 Console Logs para Debug

Añadidos logs para facilitar el debugging:

```typescript
// En getActiveLifeChallenges()
console.log('Active life challenges:', response.data);
```

Estos logs te ayudarán a verificar que las respuestas del backend sean correctas.

## 📝 Documentación Actualizada

- ✅ `CHALLENGES_API_INTEGRATION.md` - Respuestas reales del backend
- ✅ Ejemplos actualizados con estructuras correctas
- ✅ Notas sobre diferencias de campos

## 🎉 Resultado

✅ **Las interfaces ahora coinciden 100% con la estructura real del backend**
✅ **Los desafíos de vida deberían cargar correctamente**
✅ **El historial de vidas se procesa correctamente**
✅ **El contador de completaciones funciona correctamente**

---

**¡Sistema de desafíos de vida completamente sincronizado con el backend!** 🌟

