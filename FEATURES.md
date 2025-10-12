# Características Detalladas de HabitRush

## 📅 Visualización de la Semana

Cada tarjeta de hábito incluye una **línea de tiempo semanal** que muestra el progreso de la semana actual:

### Burbujas de Colores
- 🟢 **Verde (Completado)**: El hábito fue completado ese día
- 🔴 **Rojo (Perdido)**: No se completó el hábito en un día que debía hacerse
- ⚪ **Gris (Futuro)**: Días que aún no han llegado
- **Sin burbuja**: Días en los que no se debe realizar el hábito según la frecuencia

### Indicador de Hoy
Un pequeño punto dorado debajo de la burbuja indica el día actual.

### Ejemplo Visual
```
L   M   X   J   V   S   D
🟢  🟢  🔴  🟢  ⚪  ⚪  
●                       (punto dorado = hoy es Jueves)
```

## 📊 Tipos de Progreso y Registro

### 1. Sí/No
El más simple. Solo marcas si completaste el hábito o no.
- **Ideal para**: Meditar, leer, hacer ejercicio
- **Al completar**: Confirmación visual simple
- **Métricas**: Porcentaje de días completados

### 2. Tiempo (Horas/Minutos)
Registra cuánto tiempo dedicaste a la actividad.
- **Ideal para**: Estudiar, practicar un instrumento, trabajar en un proyecto
- **Al completar**: Ingresas horas y minutos dedicados
- **Métricas**: 
  - Total de tiempo acumulado
  - Promedio de tiempo por día
  - Porcentaje de días completados

### 3. Cantidad (Repeticiones)
Cuenta cuántas veces realizaste la actividad.
- **Ideal para**: Flexiones, páginas leídas, vasos de agua
- **Al completar**: Ingresas el número de repeticiones
- **Métricas**:
  - Total acumulado
  - Promedio por día
  - Porcentaje de días completados

### 📝 Detalles Opcionales al Completar

Cada vez que completas un hábito, puedes agregar:

#### Notas
- Campo de texto libre para escribir cómo te fue
- Registra pensamientos, desafíos o logros
- Se muestra en el historial de detalles

#### Imágenes
- Sube hasta 5 imágenes por día
- Captura fotos con la cámara o elige de la galería
- Perfecto para progreso visual (ej: rutinas de ejercicio, proyectos creativos)
- Vista previa en miniatura en el historial
- Toca para ver en tamaño completo

## 📈 Pantalla de Detalle

Al tocar cualquier hábito, accedes a su pantalla de detalle con:

### Información General
- Nombre y descripción del hábito
- Fecha de inicio
- Fecha objetivo (si existe)
- Tipo de progreso
- Racha actual
- Estado (Activo/Inactivo)

### Métricas por Período
Tres tarjetas con estadísticas para diferentes períodos:

#### 📊 Semanal (últimos 7 días)
- Porcentaje de completado
- Días completados vs. días esperados
- Tiempo total o cantidad total (según tipo)
- Promedio diario

#### 📊 Mensual (últimos 30 días)
- Porcentaje de completado
- Días completados vs. días esperados
- Tiempo total o cantidad total (según tipo)
- Promedio diario

#### 📊 Anual (últimos 365 días)
- Porcentaje de completado
- Días completados vs. días esperados
- Tiempo total o cantidad total (según tipo)
- Promedio diario

### Historial con Detalles
Una sección especial que muestra:
- **Últimas 10 completaciones** con notas o imágenes
- **Fecha** de cada completación
- **Valor de progreso** (tiempo o cantidad si aplica)
- **Notas** escritas ese día
- **Galería de imágenes** en miniatura
- **Tap para ampliar** cualquier imagen a pantalla completa

## 🎯 Frecuencias Mejoradas

La visualización de frecuencia se muestra de forma inteligente:

- **Diario** → "Todos los días"
- **Lunes a Viernes** → "Lun-Vie"
- **Lunes a Sábado** → "Lun-Sáb"
- **Personalizado** → "Lun-Mié-Vie" (ejemplo)

## 🎮 Sistema de Gamificación

### Vidas
- ❤️❤️ Comienzas con 2 vidas
- Pierdes una vida cada vez que no completas un hábito
- Los hábitos se desactivan cuando pierdes todas las vidas

### Retos
6 retos diferentes para reactivar hábitos:
1. **Hacer 20 flexiones** (Fácil - 5 min)
2. **Leer por 15 minutos** (Fácil - 15 min)
3. **Meditar 10 minutos** (Fácil - 10 min)
4. **Hacer 30 sentadillas** (Medio - 8 min)
5. **Escribir un poema** (Medio - 20 min)
6. **Hacer 50 saltos** (Difícil - 10 min)

Al completar un reto:
- ✅ El hábito se reactiva
- ❤️ Recuperas una vida
- 🔄 La racha se resetea a 0

## 🎨 Código de Colores

### En las Tarjetas
- **Borde izquierdo verde** (#4ECDC4): Hábito activo y completado
- **Borde izquierdo amarillo** (#FFE66D): Hábito activo y pendiente
- **Borde izquierdo rojo** (#FF6B6B): Hábito inactivo

### En las Burbujas
- **Verde** (#4ECDC4): Día completado
- **Rojo** (#FF6B6B): Día perdido
- **Gris** (#E9ECEF): Día futuro
- **Dorado** (#FFD700): Indicador de hoy

## 🔔 Próximas Funcionalidades

- [ ] Notificaciones push para recordatorios diarios
- [ ] Gráficos de tendencia a largo plazo
- [ ] Logros y badges especiales
- [ ] Exportar estadísticas
- [ ] Modo oscuro
- [ ] Widgets para pantalla de inicio
- [ ] Sincronización en la nube
