# Integración de APIs de Hábitos - HabitRush

## ✅ Integración Completada

Se ha implementado la sincronización completa de hábitos con el backend usando Axios.

## 🎯 Características Implementadas

### 1. **Servicio de Hábitos** (`src/services/habitService.ts`)

Cliente completo para la API de hábitos con:

- ✅ **GET /habits** - Obtener todos los hábitos del usuario
- ✅ **GET /habits/:id** - Obtener un hábito específico
- ✅ **POST /habits** - Crear nuevo hábito
- ✅ **PUT /habits/:id** - Actualizar hábito existente
- ✅ **DELETE /habits/:id** - Eliminar hábito (eliminación lógica)

### 2. **Mappers de Datos** (`HabitMapper`)

Conversión automática entre formatos:

#### Frontend → Backend
```typescript
// Frontend
{
  frequency: { type: 'custom', daysOfWeek: [1, 3, 5] },
  progressType: 'count',
  targetDate: Date
}

// Backend (convertido automáticamente)
{
  frequency_type: 'custom',
  frequency_days_of_week: [1, 3, 5], // Se convierte a CSV en el servidor
  progress_type: 'count',
  target_date: '2025-12-31T00:00:00.000Z'
}
```

#### Backend → Frontend
```typescript
// Backend
{
  frequency_type: 'custom',
  frequency_days_of_week: '1,3,5', // CSV del servidor
  progress_type: 'count',
  target_date: '2025-12-31T00:00:00.000Z'
}

// Frontend (convertido automáticamente)
{
  frequency: { type: 'custom', daysOfWeek: [1, 3, 5] },
  progressType: 'count',
  targetDate: Date
}
```

### 3. **Sincronización Automática** (`AppContext`)

#### Sincronización al Iniciar la App
```typescript
// Si el usuario está autenticado, carga hábitos del servidor
const authenticated = await checkAuthentication();
if (authenticated) {
  const serverHabits = await HabitService.getAllHabits();
  appState.habits = serverHabits;
}
```

#### Sincronización al Crear Hábito
```typescript
// 1. Crea el hábito localmente primero (para UX rápida)
const updatedState = await HabitLogic.createHabit(...);
setState(updatedState);

// 2. Si está autenticado, sincroniza con el servidor
if (isAuthenticated) {
  const serverHabit = await HabitService.createHabit(newHabit);
  // Actualiza el ID local con el ID del servidor
  syncedState.habits[index].id = serverHabit.id;
}
```

#### Sincronización al Activar/Desactivar
```typescript
// 1. Actualiza localmente
const updatedState = await HabitLogic.activateHabit(habitId, state);
setState(updatedState);

// 2. Sincroniza con el servidor
if (isAuthenticated) {
  await HabitService.updateHabit(habitId, { activeByUser: true });
}
```

## 📋 APIs del Backend Integradas

### GET `/api/habits`
**Obtener todos los hábitos activos del usuario**

```typescript
const habits = await HabitService.getAllHabits();
// Retorna: Habit[]
```

**Respuesta del servidor**:
```json
[
  {
    "id": "habit_123",
    "user_id": "user_456",
    "name": "Read 10 pages",
    "description": "Daily reading",
    "frequency_type": "daily",
    "progress_type": "count",
    "frequency_days_of_week": null,
    "target_date": "2025-12-31",
    "current_streak": 5,
    "is_active": true,
    "active_by_user": true,
    "last_completed_date": "2025-01-10",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-10T12:00:00.000Z",
    "start_date": "2025-01-01",
    "deleted_at": null
  }
]
```

### GET `/api/habits/:id`
**Obtener un hábito específico**

```typescript
const habit = await HabitService.getHabitById('habit_123');
// Retorna: Habit
```

**Errores**:
- 404: `Habit not found`

### POST `/api/habits`
**Crear nuevo hábito**

```typescript
const newHabit = await HabitService.createHabit({
  name: 'Read 10 pages',
  description: 'Daily reading',
  frequency: { type: 'daily' },
  progressType: 'count',
  activeByUser: true,
  targetDate: new Date('2025-12-31'),
  startDate: new Date(),
});
// Retorna: Habit (con ID del servidor)
```

**Body enviado al servidor**:
```json
{
  "name": "Read 10 pages",
  "description": "Daily reading",
  "frequency_type": "daily",
  "progress_type": "count",
  "frequency_days_of_week": null,
  "target_date": "2025-12-31T00:00:00.000Z",
  "active_by_user": true
}
```

**Errores**:
- 400: `name, frequency_type and progress_type are required`
- 400: `Invalid frequency_type provided`
- 400: `Invalid progress_type provided`

### PUT `/api/habits/:id`
**Actualizar hábito existente**

```typescript
await HabitService.updateHabit('habit_123', {
  name: 'Read 20 pages', // Nuevo nombre
  activeByUser: false,   // Desactivar
});
```

**Body enviado** (solo campos a actualizar):
```json
{
  "name": "Read 20 pages",
  "active_by_user": false
}
```

**Errores**:
- 404: `Habit not found`
- 400: `Invalid frequency_type provided`
- 400: `Invalid progress_type provided`

### DELETE `/api/habits/:id`
**Eliminar hábito (eliminación lógica)**

```typescript
await HabitService.deleteHabit('habit_123');
// Retorna: void (204 No Content)
```

**Nota**: El backend hace eliminación lógica (marca `deleted_at`), no eliminación física.

**Errores**:
- 404: `Habit not found`

## 🔄 Estrategia de Sincronización

### Modo Offline-First

El sistema está diseñado para funcionar sin conexión:

1. **Sin autenticación**: Los hábitos se guardan solo localmente
2. **Con autenticación**: 
   - Los hábitos se guardan localmente primero (UX rápida)
   - Luego se sincronizan con el servidor en segundo plano
   - Si falla la sincronización, el usuario puede seguir usando la app

### Flujo de Sincronización

```
Usuario crea hábito
     ↓
Guardado local inmediato ✅
     ↓
Usuario ve el hábito (sin esperar)
     ↓
¿Está autenticado?
     ↓ Sí
Sincronizar con servidor (background)
     ↓
Actualizar ID local con ID del servidor
     ↓
Hábito sincronizado ✅
```

### Manejo de Errores

```typescript
try {
  // Crear localmente
  const updatedState = await HabitLogic.createHabit(...);
  setState(updatedState); // Usuario ve el cambio
  
  // Sincronizar con servidor
  if (isAuthenticated) {
    await HabitService.createHabit(newHabit);
  }
} catch (syncError) {
  console.error('Error syncing to server:', syncError);
  // El hábito ya se creó localmente, continuar
  // El usuario puede seguir usando la app
}
```

## 🔧 Uso del Servicio

### En AppContext (Ya integrado)

```typescript
// Crear hábito
await createHabit(name, frequency, progressType, activeByUser, description, targetDate);
// Se sincroniza automáticamente si está autenticado ✅

// Activar hábito
await activateHabit(habitId);
// Se sincroniza automáticamente si está autenticado ✅

// Desactivar hábito
await deactivateHabit(habitId);
// Se sincroniza automáticamente si está autenticado ✅

// Sincronizar manualmente
await syncHabits();
// Descarga hábitos del servidor
```

### Uso Directo (Si necesitas más control)

```typescript
import { HabitService } from '../services/habitService';

// Obtener todos los hábitos
const habits = await HabitService.getAllHabits();

// Obtener un hábito
const habit = await HabitService.getHabitById('habit_123');

// Crear hábito
const newHabit = await HabitService.createHabit({
  name: 'Exercise',
  frequency: { type: 'daily' },
  progressType: 'yes_no',
  activeByUser: true,
  startDate: new Date(),
});

// Actualizar hábito
await HabitService.updateHabit('habit_123', {
  name: 'Exercise 30 min',
  activeByUser: false,
});

// Eliminar hábito
await HabitService.deleteHabit('habit_123');
```

## 📊 Diferencias entre Modelos

### Modelo Frontend (Local)
```typescript
interface Habit {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  targetDate?: Date;
  currentStreak: number;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
  };
  progressType: 'yes_no' | 'time' | 'count';
  isActive: boolean;
  activeByUser: boolean;
  lastCompletedDate?: Date;
  createdAt: Date;
}
```

### Modelo Backend (API)
```typescript
interface HabitAPI {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  progress_type: 'yes_no' | 'time' | 'count';
  frequency_days_of_week?: string; // CSV: "0,1,2,3"
  target_date?: string; // ISO string
  current_streak: number;
  is_active: boolean;
  active_by_user: boolean;
  last_completed_date?: string; // ISO string
  created_at: string;
  updated_at: string;
  start_date: string;
  deleted_at?: string;
}
```

**Los mappers convierten automáticamente entre estos formatos** ✅

## 🧪 Testing

### Probar Sincronización

1. **Registro de usuario**
   ```typescript
   // Registrarse en la app
   await AuthService.register({ name, email, password });
   ```

2. **Crear hábito**
   ```typescript
   // Crear un hábito
   await createHabit('Exercise', { type: 'daily' }, 'yes_no', true);
   // Verificar que se sincroniza con el servidor
   ```

3. **Verificar en el servidor**
   ```bash
   # Verificar que el hábito existe en el backend
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/habits
   ```

4. **Reinstalar app**
   ```typescript
   // Desinstalar y reinstalar la app
   // Iniciar sesión
   // Los hábitos deben cargarse del servidor ✅
   ```

## 🔒 Seguridad

- ✅ Token JWT enviado automáticamente por el interceptor de Axios
- ✅ Solo el usuario autenticado puede ver/modificar sus hábitos
- ✅ El `user_id` se agrega automáticamente en el backend
- ✅ Validación de pertenencia en el backend

## 📝 Archivos Modificados/Creados

### Nuevos
- ✅ `src/services/habitService.ts` - Servicio completo de hábitos

### Modificados
- ✅ `src/context/AppContext.tsx` - Integración de sincronización
  - Agregada función `syncHabits()`
  - Modificado `loadAppState()` para cargar del servidor
  - Modificado `createHabit()` para sincronizar
  - Modificado `activateHabit()` para sincronizar
  - Modificado `deactivateHabit()` para sincronizar

## 🚀 Próximos Pasos

### Sincronización de Completaciones
Para completar la sincronización, se pueden agregar:

```typescript
// API de completaciones (ejemplo futuro)
POST /api/habits/:id/completions
GET /api/habits/:id/completions
```

### Sincronización Bidireccional Completa
Implementar estrategia de merge para conflictos:
- Timestamp-based resolution
- Conflict detection
- Manual conflict resolution

### Modo Offline Mejorado
- Queue de operaciones pendientes
- Retry automático cuando hay conexión
- Indicador visual de estado de sincronización

## ✅ Checklist de Integración

- [x] Crear HabitService con todas las APIs
- [x] Crear mappers entre formatos
- [x] Integrar sincronización en AppContext
- [x] Cargar hábitos del servidor al iniciar
- [x] Sincronizar al crear hábito
- [x] Sincronizar al activar hábito
- [x] Sincronizar al desactivar hábito
- [x] Manejo de errores graceful
- [x] Modo offline-first funcional
- [x] Sin errores de linter
- [x] Documentación completa

## 🎉 Conclusión

✅ **Integración completa de APIs de hábitos**
✅ **Sincronización automática con el backend**
✅ **Modo offline-first funcional**
✅ **Mappers automáticos entre formatos**
✅ **Manejo de errores graceful**
✅ **Listo para usar**

**Los hábitos ahora se sincronizan automáticamente con el backend!** 🚀

