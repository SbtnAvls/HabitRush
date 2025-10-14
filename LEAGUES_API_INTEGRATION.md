# Integración de APIs de Ligas - HabitRush

## ✅ Integración Completada

Se ha implementado la integración completa de las APIs de ligas con el backend.

## 🎯 Características Implementadas

### 1. **Servicio de Ligas** (`src/services/leagueService.ts`)

**APIs integradas**:
- ✅ `GET /api/leagues/current` - Liga actual del usuario y ranking
- ✅ `GET /api/users/me/league-history` - Historial de ligas del usuario

**Funcionalidades**:
- Mappers automáticos entre formatos (snake_case ↔ camelCase)
- Métodos con datos mapeados: `getCurrentLeagueMapped()`, `getLeagueHistoryMapped()`
- Manejo de casos donde el usuario no está en una liga
- Interfaces TypeScript para todas las respuestas

## 📋 APIs del Backend Integradas

### Ligas

#### GET `/api/leagues/current` *(Auth: Bearer)*
**Obtener liga actual del usuario y ranking semanal**

```typescript
const currentLeague = await LeagueService.getCurrentLeague();
// Retorna: CurrentLeagueResponse
```

**Respuesta del servidor (con liga)**:
```json
{
  "league": {
    "id": "league-uuid-123",
    "name": "Plata",
    "color": "#C0C0C0",
    "tier": 2,
    "min_xp_required": 500,
    "promotion_slots": 3,
    "demotion_slots": 3,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "competitors": [
    {
      "user_id": "user-uuid-456",
      "username": "player1",
      "weekly_xp": 540,
      "position": 1
    },
    {
      "user_id": "user-uuid-789",
      "username": "player2",
      "weekly_xp": 320,
      "position": 2
    }
  ]
}
```

**Respuesta del servidor (sin liga)**:
```json
{
  "message": "User not found in any league for the current week.",
  "competitors": []
}
```

**Casos especiales**:
- 404 `No active league week found.` → Retorna `null` (no es error, caso normal)
- 404 `League not found.` → Retorna `null`
- 200 con `message: "User not found in any league..."` → Retorna el objeto con `league: null`

**Nota**: El servicio NO lanza error cuando no hay liga activa. Esto es un caso normal y se maneja retornando `null`.

#### GET `/api/users/me/league-history` *(Auth: Bearer)*
**Obtener historial de participación en ligas**

```typescript
const history = await LeagueService.getLeagueHistory();
// Retorna: LeagueHistoryAPI[]
```

**Respuesta del servidor**:
```json
[
  {
    "weeklyXp": 540,
    "position": 2,
    "changeType": "promoted",
    "leagueName": "Plata",
    "leagueColor": "#C0C0C0",
    "weekStart": "2024-07-08T00:00:00.000Z"
  },
  {
    "weeklyXp": 280,
    "position": 5,
    "changeType": "stayed",
    "leagueName": "Bronce",
    "leagueColor": "#CD7F32",
    "weekStart": "2024-07-01T00:00:00.000Z"
  }
]
```

**Tipos de cambio (`changeType`)**:
- **`promoted`**: Ascendió a una liga superior
- **`demoted`**: Descendió a una liga inferior
- **`stayed`**: Permaneció en la misma liga
- **`new`**: Primera vez en una liga

**Errores**:
- 500 `Error fetching league history.`

## 🔧 Uso del Servicio

### En AppContext (Ya integrado)

```typescript
// Al cargar app (si está autenticado)
// getCurrentLeague retorna null si no hay liga activa (caso normal)
const currentLeague = await LeagueService.getCurrentLeague();
if (currentLeague && currentLeague.league) {
  appState.user.league = currentLeague.league.tier;
}
// Si es null, simplemente se usan los datos locales
```

### Uso Directo en Componentes

```typescript
import { LeagueService } from '../services/leagueService';

// En LeaguesScreen.tsx
const loadLeagueData = async () => {
  // Obtener liga actual con ranking
  const result = await LeagueService.getCurrentLeagueMapped();
  
  if (!result.league) {
    console.log(result.message); // "No active league this week" o mensaje del servidor
    // Usar datos locales generados (ya implementado en LeaguesScreen)
    return;
  }
  
  setLeague(result.league);
  setCompetitors(result.competitors);
  
  // Obtener historial (opcional)
  try {
    const history = await LeagueService.getLeagueHistoryMapped();
    setHistory(history);
  } catch (error) {
    console.log('No league history yet');
  }
};
```

### Ejemplo de Uso en UI

```typescript
// Mostrar ranking
competitors.map((competitor, index) => (
  <View key={competitor.userId}>
    <Text>{competitor.position}. {competitor.username}</Text>
    <Text>{competitor.weeklyXp} XP</Text>
    {competitor.position <= league.promotionSlots && (
      <Badge>↑ Promoción</Badge>
    )}
  </View>
));

// Mostrar historial
history.map((week) => (
  <View key={week.weekStart.toISOString()}>
    <Text style={{color: week.leagueColor}}>{week.leagueName}</Text>
    <Text>Posición: {week.position}</Text>
    <Text>XP: {week.weeklyXp}</Text>
    {week.changeType === 'promoted' && <Badge>↑ Ascendido</Badge>}
    {week.changeType === 'demoted' && <Badge>↓ Descendido</Badge>}
  </View>
));
```

## 📊 Estructura de Datos

### Liga (League)
```typescript
{
  id: string;
  name: string;              // "Bronce", "Plata", "Oro", etc.
  color: string;             // Color hex de la liga
  tier: number;              // 1 (mejor) a 5 (inicial)
  minXpRequired: number;     // XP mínimo para entrar
  promotionSlots: number;    // Top N que ascienden
  demotionSlots: number;     // Bottom N que descienden
}
```

### Competidor (Competitor)
```typescript
{
  userId: string;
  username: string;
  weeklyXp: number;          // XP acumulado esta semana
  position: number;          // Posición en el ranking (1-based)
}
```

### Historial de Liga (LeagueHistory)
```typescript
{
  weeklyXp: number;
  position: number;
  changeType: 'promoted' | 'demoted' | 'stayed' | 'new';
  leagueName: string;
  leagueColor: string;
  weekStart: Date;
}
```

## 🔄 Flujo de Uso

### Ver Liga Actual

```
1. Usuario abre pantalla de Ligas
   ↓
2. App llama GET /api/leagues/current
   ↓
3. Si tiene liga:
   - Muestra nombre y color
   - Muestra ranking de competidores
   - Muestra posición del usuario
   - Indica zonas de promoción/descenso
   ↓
4. Si no tiene liga:
   - Muestra mensaje explicativo
   - Sugiere ganar XP para entrar
```

### Ver Historial

```
1. Usuario navega a "Historial"
   ↓
2. App llama GET /api/users/me/league-history
   ↓
3. Muestra lista cronológica de semanas:
   - Liga de cada semana
   - Posición final
   - XP acumulado
   - Cambio de liga (ascenso/descenso)
```

## 🎨 Mappers Automáticos

### League Mapper
```typescript
// Backend → Frontend
{
  min_xp_required: 500,
  promotion_slots: 3
}
↓
{
  minXpRequired: 500,
  promotionSlots: 3
}
```

### Competitor Mapper
```typescript
// Backend → Frontend
{
  user_id: "uuid",
  weekly_xp: 540
}
↓
{
  userId: "uuid",
  weeklyXp: 540
}
```

### History Mapper
```typescript
// Backend → Frontend
{
  weekStart: "2024-07-08T00:00:00.000Z"
}
↓
{
  weekStart: Date // Objeto Date de JavaScript
}
```

## 🔒 Consideraciones

### Usuario Sin Liga

**El servicio retorna `null` en estos casos**:
- Error 404: `No active league week found` (no hay semana de liga activa)
- Error 404: `League not found`
- Usuario no está en ninguna liga esta semana

**El servicio retorna objeto con `league: null` cuando**:
```json
{
  "message": "User not found in any league for the current week.",
  "competitors": []
}
```

**Razones posibles**:
- Usuario nuevo sin suficiente XP
- Semana de liga terminó y no se creó nueva
- Usuario fue expulsado o descendió fuera de ligas
- Backend no tiene liga activa configurada esta semana

**Comportamiento de la app**:
- Si `getCurrentLeague()` retorna `null`: Usa datos locales generados
- La pantalla de ligas siempre funciona (con datos locales o del servidor)
- No se muestran errores al usuario

### Sistema de Promoción/Descenso
- **Top N** (`promotion_slots`): Ascienden a liga superior
- **Bottom N** (`demotion_slots`): Descienden a liga inferior
- **Resto**: Permanecen en la misma liga

### Semanas de Liga
- Las ligas se resetean semanalmente
- `weekStart` marca el inicio de cada semana
- El XP semanal se reinicia cada semana

## 📝 Archivos Modificados/Creados

### Nuevos
- ✅ `src/services/leagueService.ts` (160 líneas)
  - LeagueAPI interface
  - LeagueCompetitorAPI interface
  - LeagueHistoryAPI interface
  - CurrentLeagueResponse interface
  - LeagueMapper class
  - LeagueService class con 4 métodos

### Modificados
- ✅ `src/context/AppContext.tsx`
  - Importado LeagueService
  - Modificado `loadAppState()` - carga liga actual si autenticado
  - Actualiza `user.league` con el tier del servidor

## 🧪 Testing Sugerido

### Caso 1: Usuario en Liga
```typescript
const { league, competitors } = await LeagueService.getCurrentLeague();

// Verificar liga
expect(league).toBeDefined();
expect(league.name).toBe('Plata');
expect(league.tier).toBe(2);

// Verificar competitors
expect(competitors.length).toBeGreaterThan(0);
expect(competitors[0].position).toBe(1);
```

### Caso 2: Usuario Sin Liga
```typescript
const { league, competitors, message } = await LeagueService.getCurrentLeague();

expect(league).toBeUndefined();
expect(competitors).toEqual([]);
expect(message).toContain('not found in any league');
```

### Caso 3: Historial de Ligas
```typescript
const history = await LeagueService.getLeagueHistory();

expect(history.length).toBeGreaterThan(0);
expect(history[0].changeType).toBe('promoted');
expect(history[0].weekStart).toBeInstanceOf(Date);
```

## 💡 Ventajas

### Para Usuarios Autenticados
- 🏆 **Competencia en tiempo real**: Ve el ranking actualizado
- 📊 **Historial completo**: Seguimiento de progreso semanal
- 🎯 **Motivación**: Sistema de ascensos/descensos
- 🔄 **Sincronizado**: Mismo ranking en todos los dispositivos

### Para Desarrolladores
- 🗺️ **Mappers automáticos**: Sin preocuparse por snake_case vs camelCase
- 🔒 **Type-safe**: TypeScript previene errores
- 🐛 **Console logs**: Facilita debugging
- 📦 **Modular**: Servicio independiente y reutilizable

## ✅ Checklist de Integración

- [x] Crear LeagueService con todas las APIs
- [x] Interfaces y tipos completos
- [x] Mappers automáticos
- [x] Integración en AppContext
- [x] Cargar liga actual al iniciar
- [x] Manejo de usuarios sin liga
- [x] Manejo de errores
- [x] Console logs para debugging
- [x] Sin errores de linter
- [x] Documentación completa

## 🎉 Conclusión

✅ **Integración completa de APIs de ligas**
✅ **Sincronización automática con backend**
✅ **Mappers automáticos**
✅ **Manejo de casos especiales**
✅ **Listo para usar en pantalla de Ligas**

**¡El sistema de ligas está completamente integrado con el backend!** 🏆

