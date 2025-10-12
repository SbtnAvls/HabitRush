# Changelog - HabitRush

## [1.3.0] - 2025-10-05

### ✨ Nuevas Características

#### 🔄 Sistema de Activar/Desactivar Hábitos
- **Toggle al crear hábito**: Elige si el hábito comienza activo o inactivo
- **Separación de listas**: Hábitos activos e inactivos mostrados en secciones separadas
- **Activación rápida**: Toca cualquier hábito inactivo en la lista para activarlo
- **Botón en detalle**: Opción de "Activar/Desactivar" en la pantalla de detalle
- **Confirmación al desactivar**: Alerta que explica qué se borrará y qué se mantendrá

#### 🗑️ Borrado Inteligente al Desactivar
- **Se borra**: Progreso, racha y datos de completación
- **Se mantiene**: Notas e imágenes agregadas en cada día
- **Alerta informativa**: Mensaje claro antes de confirmar la desactivación:
  - "Se borrará todo tu progreso y racha"
  - "Se mantendrán las notas e imágenes que agregaste"
  - "Podrás reactivarlo cuando quieras"

#### 📋 Lista Organizada
- **Sección "Hábitos Activos"**: Con indicador visual
- **Sección "Hábitos Inactivos"**: Con texto "Toca para activar"
- **Feedback visual**: Los hábitos inactivos mantienen su diseño pero sin opciones de completar

### 🔧 Mejoras Técnicas

#### Nuevos Campos
- **activeByUser**: Campo boolean para estado controlado por usuario
- **isActive**: Mantiene el estado del sistema (por vidas)
- **Diferenciación clara** entre desactivación manual y por pérdida de vidas

#### Lógica Actualizada
- **activateHabit()**: Activa un hábito por decisión del usuario
- **deactivateHabit()**: Desactiva y borra progreso manteniendo notas
- **getUserStats()**: Actualizado para considerar activeByUser

### 🎨 UI/UX

#### Modal de Creación
- **Dos opciones visuales**: Activo (verde) e Inactivo (rojo)
- **Descripciones claras**: Explica qué significa cada opción
- **Estado por defecto**: Activo

#### Pantalla de Detalle
- **Botón en header**: "Activar" o "Desactivar" según estado
- **Colores dinámicos**: Verde para activar, rojo para desactivar
- **Navegación automática**: Regresa a la lista después del cambio

---

## [1.2.0] - 2025-10-05

### ✨ Nuevas Características

#### 📝 Sistema de Registro Detallado
- **Modal inteligente al completar hábitos** que se adapta según el tipo de progreso
- **Registro de tiempo**: Input específico para horas y minutos
- **Registro de cantidad**: Input numérico para contar repeticiones
- **Confirmación visual**: Para hábitos tipo Sí/No

#### 📸 Soporte de Imágenes
- **Captura o selección de imágenes** al completar hábitos
- **Hasta 5 imágenes por día** 
- **Opciones de origen**: Cámara o galería
- **Optimización automática**: Las imágenes se redimensionan a 1024x1024
- **Vista en miniatura** en el historial
- **Vista ampliada**: Modal para ver imágenes en pantalla completa

#### 📓 Sistema de Notas
- **Campo de texto libre** al completar cada hábito
- **Registro de pensamientos y reflexiones** del día
- **Visualización en historial** con formato limpio

#### 📊 Historial con Detalles
- **Nueva sección en detalle** que muestra las últimas 10 completaciones con contenido extra
- **Tarjetas individuales** por cada día con detalles
- **Información mostrada**:
  - Fecha formateada y legible
  - Valor de progreso (tiempo o cantidad)
  - Notas del día
  - Galería de imágenes en miniatura
- **Filtrado inteligente**: Solo muestra días donde se agregaron notas o imágenes

#### 🎨 Mejoras Visuales
- **Modal de completar** con diseño moderno y limpio
- **Inputs especializados** para cada tipo de progreso
- **Botones de acción** claros y accesibles
- **Transiciones suaves** entre modales
- **Badges visuales** para estado completado

### 🔧 Mejoras Técnicas

#### Tipos y Estructura
- **HabitCompletion actualizado** con campos `notes` e `images`
- **Nuevo componente CompleteHabitModal** modular y reutilizable
- **Nuevo componente CompletionDetailItem** para mostrar historial
- **Integración con react-native-image-picker**

#### Lógica Actualizada
- **markHabitCompleted** ahora acepta progressData, notes e images
- **Almacenamiento completo** de todos los datos adicionales
- **Serialización correcta** de arrays de imágenes
- **Context actualizado** con nuevas firmas de funciones

### 🐛 Correcciones
- **Manejo de imágenes** con validación y límites
- **Estados del modal** correctamente sincronizados
- **Limpieza de formularios** al cerrar modales

---

## [1.1.0] - 2025-10-05

### ✨ Nuevas Características

#### 📊 Pantalla de Detalle del Hábito
- **Nueva pantalla completa** con información detallada al tocar cualquier hábito
- **Métricas por período**: Estadísticas semanales, mensuales y anuales
- **Información completa**: Nombre, descripción, fechas, tipo de progreso, racha y estado
- **Navegación fluida**: Integrada con React Navigation

#### 📅 Visualización Semanal Mejorada
- **Línea de tiempo horizontal** con burbujas de colores en cada tarjeta de hábito
- **Código de colores intuitivo**:
  - 🟢 Verde: Día completado
  - 🔴 Rojo: Día perdido (no completado)
  - ⚪ Gris: Día futuro
  - Sin burbuja: Día que no corresponde según frecuencia
- **Indicador del día actual**: Punto dorado debajo de la burbuja de hoy
- **Solo muestra días relevantes**: Las burbujas aparecen solo en los días que debe realizarse el hábito

#### 🎯 Tipos de Progreso
- **Sí/No**: Marcado simple de completado
- **Tiempo**: Registro de horas/minutos dedicados
- **Cantidad**: Conteo de repeticiones o veces
- **Métricas adaptadas**: Las estadísticas se ajustan según el tipo de progreso

#### ✏️ Descripción de Hábitos
- **Campo opcional** para agregar descripción al crear hábitos
- **Visualización** en la pantalla de detalle

#### 📱 Mejoras en la UI/UX

##### Texto de Frecuencia Inteligente
- **"Todos los días"** en lugar de "Diario"
- **"Lun-Vie"** para hábitos de días laborables
- **"Lun-Sáb"** para hábitos de 6 días
- **Formato compacto** para combinaciones personalizadas (ej: "Lun-Mié-Vie")

##### Modal de Creación Mejorado
- **Diseño reorganizado** con mejor flujo de información
- **Campo de descripción** con área de texto multilínea
- **Selección de tipo de progreso** con descripciones explicativas
- **Validaciones mejoradas** para mejor experiencia

##### Tarjetas de Hábitos
- **Icono de fuego** 🔥 junto a la racha
- **Diseño más limpio** y organizado
- **Área táctil completa** para navegar al detalle
- **Visualización clara** del estado del hábito

### 🔧 Mejoras Técnicas

#### Tipos TypeScript Actualizados
```typescript
- ProgressType: 'yes_no' | 'time' | 'count'
- ProgressData: interface para datos de progreso
- Habit: Agregados campos description y progressType
- HabitCompletion: Agregado campo progressData
```

#### Lógica de Métricas
- **Cálculo preciso** de días esperados según frecuencia
- **Métricas específicas** por tipo de progreso
- **Promedios diarios** calculados automáticamente
- **Soporte para múltiples períodos** (semana, mes, año)

#### Sistema de Navegación
- **Stack Navigator** para flujo de detalle de hábitos
- **Navegación por parámetros** para pasar habitId
- **Integración completa** con Tab Navigator existente

### 📝 Documentación
- **README actualizado** con nuevas características
- **FEATURES.md** con documentación detallada de características
- **CHANGELOG.md** con historial de cambios
- **Comentarios en código** para mejor mantenibilidad

### 🐛 Correcciones
- **Tipos TypeScript** corregidos para navegación
- **Estilos de burbujas** arreglados para evitar conflictos
- **Validaciones** mejoradas en formularios
- **Manejo de estados** optimizado

---

## [1.0.0] - 2025-10-05

### 🎉 Lanzamiento Inicial

#### Características Principales
- ✅ Creación y gestión de hábitos
- ✅ Sistema de frecuencias (diario, semanal, personalizado)
- ✅ Sistema de vidas (2 vidas iniciales)
- ✅ Sistema de rachas
- ✅ Retos para reactivar hábitos
- ✅ Almacenamiento local con AsyncStorage
- ✅ Navegación por tabs (Inicio y Perfil)
- ✅ Estadísticas básicas
- ✅ Interfaz moderna y colorida

#### Tecnologías
- React Native 0.81.4
- TypeScript
- React Navigation
- AsyncStorage
- React Context para estado global

---

## Próximas Versiones

### [1.3.0] - Planificado
- [ ] Notificaciones push
- [ ] Gráficos de tendencia
- [ ] Modo oscuro
- [ ] Compartir progreso

### [1.4.0] - Planificado
- [ ] Sincronización en la nube
- [ ] Logros y badges
- [ ] Exportar estadísticas
- [ ] Widgets para pantalla de inicio
- [ ] Personalización de retos
