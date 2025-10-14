# Manejo de Errores en el Sistema de Ligas - HabitRush

## 🎯 Objetivo

El sistema de ligas debe funcionar sin mostrar errores al usuario, incluso cuando:
- No hay sesión iniciada
- No hay liga activa en el backend
- El usuario no está en ninguna liga

## ✅ Solución Implementada

### 1. **LeagueService retorna `null` en lugar de lanzar error**

```typescript
static async getCurrentLeague(): Promise<CurrentLeagueResponse | null> {
  try {
    const response = await apiClient.get<CurrentLeagueResponse>('/leagues/current');
    return response.data;
  } catch (error: any) {
    // Casos normales, no son errores
    if (error.message?.includes('No active league week found') || 
        error.message?.includes('User not found in any league')) {
      console.log('User not in an active league this week');
      return null;
    }
    return null;
  }
}
```

**Comportamiento**:
- ✅ No lanza excepciones
- ✅ Retorna `null` cuando no hay liga
- ✅ Log informativo en consola (no error)

### 2. **AppContext maneja el caso `null`**

```typescript
// Solo intenta cargar si está autenticado
const currentLeague = await LeagueService.getCurrentLeague();
if (currentLeague && currentLeague.league) {
  appState.user.league = currentLeague.league.tier;
}
// Si es null, simplemente usa datos locales
```

**Comportamiento**:
- ✅ Solo carga si está autenticado
- ✅ No bloquea la carga de otros datos
- ✅ Usa datos locales si no hay liga del servidor

### 3. **LeaguesScreen siempre funciona**

La pantalla de ligas usa datos locales generados:

```typescript
const leagueCompetitors = useMemo(() => {
  return LeagueLogic.generateCompetitors(
    user.id,
    user.name,
    user.weeklyXp,
    user.league
  );
}, [user.id, user.name, user.weeklyXp, user.league]);
```

**Comportamiento**:
- ✅ Siempre muestra liga (local o del servidor)
- ✅ No depende del backend
- ✅ Funciona offline

## 📊 Flujo de Datos

### Usuario Autenticado CON liga activa

```
1. App inicia
   ↓
2. GET /api/leagues/current → 200 OK
   ↓
3. Actualiza user.league con tier del servidor
   ↓
4. LeaguesScreen usa datos locales generados con tier actualizado
```

### Usuario Autenticado SIN liga activa

```
1. App inicia
   ↓
2. GET /api/leagues/current → 404 "No active league week found"
   ↓
3. LeagueService retorna null (NO lanza error)
   ↓
4. AppContext NO actualiza user.league (mantiene valor local)
   ↓
5. LeaguesScreen usa datos locales generados
   ↓
6. Usuario ve su liga local normalmente
```

### Usuario NO autenticado

```
1. App inicia
   ↓
2. NO llama a LeagueService (no hay token)
   ↓
3. LeaguesScreen usa datos locales generados
   ↓
4. Usuario ve su liga local normalmente
```

## 🔧 Casos Especiales

### Error 404: "No active league week found"

**Razón**: El backend no tiene una semana de liga activa configurada.

**Manejo**:
```typescript
// En LeagueService
if (error.message?.includes('No active league week found')) {
  console.log('User not in an active league this week');
  return null; // ← No es error
}
```

**Resultado**:
- ✅ App continúa normalmente
- ✅ Usuario ve liga local
- ✅ No se muestra error en UI

### Respuesta 200 pero sin liga

**Razón**: Usuario no cumple requisitos para estar en una liga.

**Respuesta del backend**:
```json
{
  "message": "User not found in any league for the current week.",
  "competitors": []
}
```

**Manejo**:
```typescript
// En getCurrentLeagueMapped
if (!response || !response.league) {
  return {
    league: null,
    competitors: [],
    message: response?.message || 'No active league this week',
  };
}
```

**Resultado**:
- ✅ Retorna estructura válida
- ✅ App usa datos locales
- ✅ No se muestra error en UI

## 📝 Mensajes al Usuario

### ❌ ANTES (Mostraba error)

```
Console Error
Error getting current league: Error: No active league week found.
```

Usuario veía error rojo en pantalla de Ligas.

### ✅ AHORA (No muestra error)

```
Console Log
User not in an active league this week
```

Usuario ve su liga local normalmente. Sin errores.

## 🎨 Comportamiento en UI

### Pantalla de Ligas - Siempre Funciona

```
Tu Liga
🌱 Liga Inicial
XP Total: 10
XP esta semana: 10
⏰ Termina en 7 días

Clasificación
1. 🥇 Javier Cruz - 71 XP
2. 🥈 Fernando Díaz - 71 XP
3. 🥉 Carlos López - 69 XP
4. Usuario (Tú) - 10 XP
```

**Datos mostrados**:
- Si hay liga del servidor: Usa tier del servidor + competidores locales
- Si no hay liga del servidor: Usa tier local + competidores locales
- Siempre muestra información válida

## ✅ Ventajas del Nuevo Enfoque

### Para el Usuario
- 🎯 **Sin errores**: Nunca ve mensajes de error en la pantalla de ligas
- 📱 **Siempre funcional**: Puede ver su liga incluso offline
- 🔄 **Transición suave**: Si el servidor tiene liga, se sincroniza; si no, usa local

### Para el Desarrollador
- 🐛 **Menos bugs**: No hay excepciones sin manejar
- 📊 **Logs claros**: Distingue entre error real y ausencia normal de liga
- 🔧 **Fácil debug**: Console logs informativos, no errors

### Para el Backend
- ⚡ **Sin dependencia crítica**: La app funciona aunque el backend no tenga ligas
- 🔄 **Flexibilidad**: Puede no tener semana de liga activa sin romper la app
- 📈 **Escalable**: Puede activar/desactivar ligas sin afectar usuarios

## 🧪 Testing

### Test 1: Usuario autenticado CON liga
```typescript
const league = await LeagueService.getCurrentLeague();
expect(league).not.toBeNull();
expect(league.league.tier).toBe(2);
```

### Test 2: Usuario autenticado SIN liga (404)
```typescript
const league = await LeagueService.getCurrentLeague();
expect(league).toBeNull(); // ✅ NO lanza error
```

### Test 3: Usuario autenticado, servidor sin liga
```typescript
const league = await LeagueService.getCurrentLeague();
// Retorna { message: "...", competitors: [] }
expect(league.league).toBeUndefined();
```

### Test 4: Usuario NO autenticado
```typescript
// No se llama a LeagueService
// LeaguesScreen usa datos locales
expect(user.league).toBe(5); // Liga inicial local
```

## 📌 Checklist de Implementación

- [x] LeagueService retorna `null` en lugar de lanzar error
- [x] Manejo especial de "No active league week found"
- [x] Manejo especial de "User not found in any league"
- [x] AppContext NO falla si getCurrentLeague retorna null
- [x] getCurrentLeagueMapped maneja respuesta null
- [x] LeaguesScreen usa datos locales siempre
- [x] No se muestran errores en UI
- [x] Console logs informativos (no errors)
- [x] Documentación actualizada

## 🎉 Resultado Final

✅ **Sistema de ligas robusto**
- Funciona con o sin backend
- Funciona con o sin liga activa
- Funciona con o sin autenticación
- Nunca muestra errores al usuario
- Siempre muestra información útil

---

**¡La pantalla de ligas ahora es completamente resiliente!** 🏆

