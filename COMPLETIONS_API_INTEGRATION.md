# Integración de APIs de Completions - HabitRush

## ✅ Integración Completada

Se ha implementado la sincronización completa de completaciones de hábitos (habit completions) con el backend, incluyendo manejo de imágenes.

## 🎯 Características Implementadas

### 1. **Servicio Completo de Completions** (`src/services/completionService.ts`)

✅ **Todas las APIs integradas**:
- `GET /api/habits/:habitId/completions` - Obtener completaciones de un hábito
- `POST /api/habits/:habitId/completions` - Crear/actualizar completación
- `PUT /api/completions/:id` - Actualizar notas de completación
- `DELETE /api/completions/:id` - Eliminar completación
- `POST /api/completions/:id/images` - Añadir imagen a completación
- `DELETE /api/images/:id` - Eliminar imagen

### 2. **Mappers Automáticos** (`CompletionMapper`)

Conversión transparente entre formatos:

**Frontend (local)**:
```typescript
{
  habitId: 'habit_123',
  date: Date,
  completed: true,
  progressData: {
    type: 'count',
    value: 8,
    targetValue: 10
  },
  notes: 'Two sets remaining',
  images: ['url1', 'url2']
}
```

**Backend (API)**:
```typescript
{
  id: 'completion_456',
  habit_id: 'habit_123',
  user_id: 'user_789',
  date: '2025-10-12',
  completed: true,
  progress_type: 'count',
  progress_value: 8,
  target_value: 10,
  notes: 'Two sets remaining',
  created_at: '2025-10-12T10:00:00.000Z',
  updated_at: '2025-10-12T10:00:00.000Z'
}
```

### 3. **Sincronización Automática en AppContext**

✅ **Al iniciar la app**:
- Si está autenticado, carga completaciones del servidor
- Carga completaciones de TODOS los hábitos del usuario

✅ **Al marcar hábito completado**:
1. Si autenticado: Crea en el servidor directamente
2. Si no autenticado: Guarda en storage local

✅ **Política de storage**:
- Autenticados: NO guardan completaciones en storage
- Locales: SÍ guardan completaciones en storage

## 📋 APIs del Backend Integradas

### GET `/api/habits/:habitId/completions`
**Obtener completaciones de un hábito**

```typescript
const completions = await CompletionService.getHabitCompletions('habit_123');
// Retorna: HabitCompletion[]
```

**Respuesta del servidor**:
```json
[
  {
    "id": "completion_456",
    "habit_id": "habit_123",
    "user_id": "user_789",
    "date": "2025-10-12",
    "completed": true,
    "progress_type": "count",
    "progress_value": 8,
    "target_value": 10,
    "notes": "Two sets remaining",
    "created_at": "2025-10-12T10:00:00.000Z",
    "updated_at": "2025-10-12T10:00:00.000Z"
  }
]
```

**Errores**:
- 500: `Error getting habit completions`

### POST `/api/habits/:habitId/completions`
**Crear o actualizar completación**

```typescript
const completion = {
  habitId: 'habit_123',
  date: new Date('2025-10-12'),
  completed: true,
  progressData: {
    type: 'count',
    value: 8,
    targetValue: 10
  },
  notes: 'Two sets remaining'
};

await CompletionService.createOrUpdateCompletion('habit_123', completion);
```

**Body enviado al servidor**:
```json
{
  "date": "2025-10-12",
  "completed": true,
  "progress_type": "count",
  "progress_value": 8,
  "target_value": 10,
  "notes": "Two sets remaining"
}
```

**Errores**:
- 400: `date, completed and progress_type are required fields.`
- 500: `Invalid progress_type provided`

### PUT `/api/completions/:id`
**Actualizar notas de completación**

```typescript
await CompletionService.updateCompletionNotes('completion_456', 'Adjusted goal');
```

**Body enviado**:
```json
{
  "notes": "Adjusted goal"
}
```

**Errores**:
- 400: `notes field is required to update a habit completion.`
- 404: `Habit completion not found`

### DELETE `/api/completions/:id`
**Eliminar completación**

```typescript
await CompletionService.deleteCompletion('completion_456');
// Retorna: void (204 No Content)
```

**Errores**:
- 404: `Habit completion not found`

### POST `/api/completions/:id/images`
**Añadir imagen a completación**

```typescript
await CompletionService.addImage(
  'completion_456',
  'https://cdn.example.com/proof.png',
  'https://cdn.example.com/thumb.png' // opcional
);
```

**Body enviado**:
```json
{
  "imageUrl": "https://cdn.example.com/proof.png",
  "thumbnailUrl": "https://cdn.example.com/thumb.png"
}
```

**Respuesta 201**:
```json
{
  "id": "image_789",
  "completion_id": "completion_456",
  "image_url": "https://cdn.example.com/proof.png",
  "thumbnail_url": "https://cdn.example.com/thumb.png",
  "uploaded_at": "2025-10-12T10:05:00.000Z"
}
```

**Errores**:
- 400: `imageUrl is required.`
- 500: `Completion not found or user does not have permission.`
- 500: `Maximum number of images (5) for this completion reached.`

### DELETE `/api/images/:id`
**Eliminar imagen**

```typescript
await CompletionService.deleteImage('image_789');
// Retorna: void (204 No Content)
```

**Errores**:
- 404: `Image not found`

## 🔄 Estrategia de Sincronización

### Usuarios Autenticados

```
Usuario marca hábito completado
     ↓
Crear completación localmente (temporal)
     ↓
Enviar al servidor (POST /habits/:id/completions)
     ↓
Actualizar estado en memoria
     ↓
NO guardar en storage ✅
```

### Usuarios Locales

```
Usuario marca hábito completado
     ↓
Crear completación localmente
     ↓
Guardar en storage
     ↓
Actualizar estado
```

### Carga Inicial

```
Usuario abre app autenticado
     ↓
Cargar hábitos del servidor
     ↓
Para cada hábito, cargar completaciones
     ↓
Combinar todas las completaciones
     ↓
Actualizar estado (NO storage) ✅
```

## 🔧 Uso del Servicio

### En AppContext (Ya integrado)

```typescript
// Marcar hábito completado
await markHabitCompleted(habitId, progressData, notes, images);
// Se sincroniza automáticamente si está autenticado ✅

// Al cargar app (autenticado)
// Carga automáticamente todas las completaciones del servidor ✅
```

### Uso Directo (Si necesitas más control)

```typescript
import { CompletionService } from '../services/completionService';

// Obtener completaciones de un hábito
const completions = await CompletionService.getHabitCompletions('habit_123');

// Crear/actualizar completación
const completion = {
  habitId: 'habit_123',
  date: new Date(),
  completed: true,
  progressData: { type: 'yes_no' }
};
await CompletionService.createOrUpdateCompletion('habit_123', completion);

// Actualizar notas
await CompletionService.updateCompletionNotes('completion_456', 'New notes');

// Eliminar completación
await CompletionService.deleteCompletion('completion_456');

// Añadir imagen
await CompletionService.addImage('completion_456', 'https://...', 'https://...');

// Eliminar imagen
await CompletionService.deleteImage('image_789');

// Obtener todas las completaciones (múltiples hábitos)
const allCompletions = await CompletionService.getAllCompletions(['habit1', 'habit2']);
```

## 📊 Diferencias entre Modelos

### Modelo Frontend (Local)
```typescript
interface HabitCompletion {
  habitId: string;
  date: Date;
  completed: boolean;
  progressData?: ProgressData;
  notes?: string;
  images?: string[];
}

interface ProgressData {
  type: ProgressType;
  value?: number;
  targetValue?: number;
}
```

### Modelo Backend (API)
```typescript
interface HabitCompletionAPI {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // ISO string
  completed: boolean;
  progress_type: 'yes_no' | 'time' | 'count';
  progress_value?: number;
  target_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**Los mappers convierten automáticamente entre estos formatos** ✅

## 🎨 Flujo Completo de Usuario

### Crear Hábito y Completar

```
1. Usuario se autentica
   ↓
2. Crea hábito "Exercise"
   → POST /api/habits (se crea en servidor)
   ↓
3. Marca como completado hoy
   → POST /api/habits/{id}/completions
   ↓
4. Añade nota "Felt great!"
   → Incluida en el POST anterior
   ↓
5. Sube foto de progreso
   → POST /api/completions/{id}/images
   ↓
6. Cierra app
   ↓
7. Abre app al día siguiente
   → GET /api/habits (carga hábitos)
   → GET /api/habits/{id}/completions (carga completaciones)
   ↓
8. Ve su progreso de ayer con foto ✅
```

## 🔒 Política de Storage

### Completaciones de Usuarios Autenticados
- ❌ NUNCA se guardan en storage local
- ✅ Solo en memoria (estado de React)
- ✅ Fuente única: El servidor
- ✅ Se borran al cerrar sesión

### Completaciones de Usuarios Locales
- ✅ SÍ se guardan en storage local
- ✅ Persisten entre sesiones
- ✅ Modo completamente offline

## 🧪 Testing

### Probar Completaciones

1. **Autenticado - Crear completación**
   ```typescript
   // Marcar hábito completado
   await markHabitCompleted('habit_123', { type: 'count', value: 5 }, 'Great!');
   // Verificar en servidor: GET /api/habits/habit_123/completions
   ```

2. **Autenticado - Verificar no storage**
   ```typescript
   // Después de marcar completado
   const storage = await StorageService.loadAppState();
   // storage.completions debe estar vacío o no incluir las del servidor
   ```

3. **Local - Crear completación**
   ```typescript
   // Sin autenticación
   await markHabitCompleted('habit_local', { type: 'yes_no' });
   // Verificar en storage
   const storage = await StorageService.loadAppState();
   // storage.completions debe incluir la completación
   ```

4. **Cerrar sesión**
   ```typescript
   await logout();
   // Verificar que completions esté vacío en el estado
   // Verificar que completions esté vacío en storage
   ```

## 📝 Archivos Modificados/Creados

### Nuevos
- ✅ `src/services/completionService.ts` (250 líneas)
  - HabitCompletionAPI interface
  - CompletionImageAPI interface
  - DTOs para crear/actualizar
  - CompletionMapper class
  - CompletionService class con 8 métodos

### Modificados
- ✅ `src/context/AppContext.tsx`
  - Importado CompletionService
  - Modificado `loadAppState()` - carga completaciones del servidor
  - Modificado `markHabitCompleted()` - crea en servidor si autenticado

## 💡 Uso Avanzado

### Sincronización Manual

```typescript
const { state, isAuthenticated } = useAppContext();

// Sincronizar completaciones manualmente
if (isAuthenticated) {
  const habitIds = state.habits.map(h => h.id);
  const completions = await CompletionService.syncCompletions(habitIds);
  // Actualizar estado manualmente si necesitas
}
```

### Manejo de Imágenes

```typescript
// Después de marcar completado con imágenes
const completion = state.completions[state.completions.length - 1];

// Si está autenticado y hay imágenes locales (URIs)
if (isAuthenticated && images?.length) {
  // Primero necesitas subir las imágenes a un CDN
  const uploadedUrl = await uploadImageToCDN(images[0]);
  
  // Luego vincular al completion
  await CompletionService.addImage(
    completionId, // Del servidor
    uploadedUrl,
    thumbnailUrl // opcional
  );
}
```

**Nota**: La app actualmente guarda URIs locales. Para usuarios autenticados, necesitarás implementar la subida a un CDN antes de vincular con la completación.

## ⚠️ Consideraciones

### Subida de Imágenes
- Las imágenes actualmente se guardan como URIs locales
- Para usuarios autenticados, necesitas:
  1. Subir imagen a un CDN (AWS S3, Cloudinary, etc.)
  2. Obtener URL pública
  3. Vincular URL con la completación usando la API

### Límite de Imágenes
- Máximo 5 imágenes por completación (validado en el servidor)
- Error 500 si se intenta añadir más de 5

### Actualización vs Creación
- La API `POST /habits/:id/completions` hace **upsert**
- Si ya existe una completación para esa fecha, la actualiza
- Si no existe, la crea

## 🎯 Beneficios

### Para Usuarios Autenticados
- 📊 **Historial completo**: Todas las completaciones en la nube
- 🔄 **Sincronización real**: Múltiples dispositivos
- 📸 **Imágenes en la nube**: No ocupan espacio local
- 🔐 **Datos seguros**: Respaldo automático

### Para Usuarios Locales
- 💾 **Funcionalidad offline**: Sin cambios
- 🔒 **Privacidad garantizada**: Datos solo locales
- ⚡ **Rendimiento igual**: Sin llamadas al servidor

## ✅ Checklist de Integración

- [x] Crear CompletionService con todas las APIs
- [x] Crear mappers entre formatos
- [x] Integrar en AppContext
- [x] Cargar completaciones del servidor al iniciar
- [x] Crear completación en servidor al marcar completado
- [x] NO guardar en storage si autenticado
- [x] Limpiar completaciones al cerrar sesión
- [x] Manejo de errores graceful
- [x] Sin errores de linter
- [x] Documentación completa

## 🎉 Conclusión

✅ **Integración completa de APIs de completions**
✅ **Sincronización automática con el backend**
✅ **Política clara de storage**
✅ **Mappers automáticos entre formatos**
✅ **Soporte para imágenes**
✅ **Listo para usar**

**¡Las completaciones ahora se sincronizan automáticamente con el backend!** 🚀

