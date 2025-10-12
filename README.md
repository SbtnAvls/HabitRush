# HabitRush 🏃‍♂️

Una aplicación móvil para crear y mantener hábitos con un sistema gamificado de vidas y retos.

## Características Principales

### 🎯 Gestión de Hábitos
- **Crear hábitos personalizados** con nombre, descripción, frecuencia y fecha objetivo
- **Frecuencias flexibles**: Diario, semanal o personalizado (días específicos)
- **Tipos de progreso**: Sí/No, Tiempo (horas/minutos) o Cantidad (repeticiones)
- **Seguimiento de rachas** para mantener la motivación
- **Fecha objetivo opcional** para metas a largo plazo
- **Visualización semanal** con burbujas de colores para cada día
- **Pantalla de detalle** con métricas semanales, mensuales y anuales

### ❤️ Sistema de Vidas y Retos
- **2 vidas iniciales** para cada usuario
- **Pierdes una vida** cuando no completas un hábito en el día asignado
- **Visualización clara** del estado de vidas con corazones
- **10 retos únicos** para ganar vidas extras
- **Recompensas de 1 a 3 vidas** por reto completado
- **Retos de una sola vez** y **retos ilimitados**

### 🏆 Sistema de Retos
- **Retos automáticos** cuando un hábito se desactiva por perder la racha
- **Diversidad de retos**: Ejercicio, aprendizaje, meditación y creatividad
- **Recuperación de vidas** al completar retos exitosamente
- **Reactivación de hábitos** después de completar un reto

### 📊 Estadísticas y Perfil
- **Dashboard principal** con estadísticas en tiempo real
- **Perfil de usuario** con historial completo
- **Seguimiento de progreso** y logros

## Instalación

### Prerrequisitos
- Node.js >= 20
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd HabitRush
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Instalación de dependencias nativas (iOS)**
```bash
cd ios && pod install && cd ..
```

4. **Ejecutar la aplicación**

Para Android:
```bash
npm run android
```

Para iOS:
```bash
npm run ios
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── HabitCard.tsx   # Tarjeta individual de hábito
│   └── AddHabitModal.tsx # Modal para crear hábitos
├── context/            # Contexto global de la aplicación
│   └── AppContext.tsx  # Estado global y funciones
├── navigation/         # Configuración de navegación
│   └── AppNavigator.tsx # Navegación principal
├── screens/           # Pantallas de la aplicación
│   ├── HomeScreen.tsx # Pantalla principal
│   └── ProfileScreen.tsx # Pantalla de perfil
├── services/          # Lógica de negocio
│   ├── storage.ts     # Manejo de almacenamiento local
│   └── habitLogic.ts  # Lógica de hábitos y vidas
└── types/             # Definiciones de TypeScript
    └── index.ts       # Interfaces y tipos
```

## Cómo Usar la Aplicación

### 1. Crear tu Primer Hábito
- Toca el botón "+" en la pantalla principal
- Ingresa el nombre y descripción del hábito
- Selecciona la frecuencia (diario, semanal o personalizado)
- Elige el tipo de progreso (Sí/No, Tiempo o Cantidad)
- **Elige el estado inicial**: Activo o Inactivo
- Opcionalmente, establece una fecha objetivo
- Guarda el hábito

### 2. Completar Hábitos
- Cada día que debas completar un hábito, aparecerá como "Pendiente"
- Toca "Completar" cuando hayas realizado la actividad
- Se abrirá un modal según el tipo de progreso:
  - **Sí/No**: Confirmación simple
  - **Tiempo**: Ingresa horas y minutos
  - **Cantidad**: Ingresa el número de repeticiones
- **Opcionales**: Agrega notas y hasta 5 imágenes
- La burbuja del día se pintará de color verde
- Tu racha se incrementará automáticamente

### 3. Ver Detalles y Métricas
- Toca cualquier tarjeta de hábito para ver su detalle
- Visualiza métricas semanales, mensuales y anuales
- Revisa estadísticas específicas según el tipo de progreso:
  - **Sí/No**: Porcentaje de completado
  - **Tiempo**: Total de horas/minutos y promedio diario
  - **Cantidad**: Total acumulado y promedio diario
- **Historial con detalles**: Ve las últimas 10 completaciones con notas e imágenes
- **Galería de imágenes**: Toca cualquier imagen para verla en grande

### 4. Manejo de Vidas
- Si no completas un hábito en el día asignado, perderás una vida
- La burbuja del día se pintará de color rojo
- Cuando pierdas todas las vidas, los hábitos se desactivarán
- Completa retos para reactivar hábitos y recuperar vidas

### 5. Sistema de Retos
- Cuando un hábito se desactiva, podrás seleccionar "Reactivar"
- Se te asignará un reto aleatorio para completar
- Una vez completado el reto, el hábito se reactivará y recuperarás una vida

### 6. Activar/Desactivar Hábitos Manualmente
- **Ver hábitos inactivos**: Desplázate hacia abajo en la lista para ver la sección "Hábitos Inactivos"
- **Activar rápido**: Toca cualquier hábito inactivo en la lista para activarlo instantáneamente
- **En el detalle**: Toca el botón "Activar" o "Desactivar" en la esquina superior derecha
- **Al desactivar**: 
  - Aparecerá una alerta de confirmación
  - Se borrará tu progreso y racha
  - Se mantendrán tus notas e imágenes
  - Podrás reactivarlo cuando quieras

### 7. Completar Retos para Ganar Vidas
- **Ver retos disponibles**: Scroll hasta "Retos para Obtener Vidas" debajo de los hábitos
- **Grid de 3 columnas**: Visualiza hasta 10 retos diferentes
- **Indicadores visuales**:
  - Badge rojo "!" si el reto está disponible para redimir
  - Borde verde si puedes completarlo ahora
  - Badge de "Completado" para retos de una sola vez ya redimidos
- **Retos disponibles**:
  1. 🌟 Semana Perfecta (+1 vida, una vez)
  2. 🏆 Mes Imparable (+2 vidas, ilimitado)
  3. ⏰ Salvación de Último Momento (+1 vida, una vez)
  4. 🌅 Madrugador (+1 vida, una vez)
  5. 👑 Triple Corona (+2 vidas, una vez)
  6. 🎯 Objetivo Alcanzado (+3 vidas, ilimitado)
  7. 🏅 Coleccionista de Logros (+2 vidas, una vez)
  8. 💪 Superviviente (+2 vidas, ilimitado)
  9. ⏳ Maestro del Tiempo (+3 vidas, ilimitado)
  10. 📝 Escritor Prolífico (+2 vidas, una vez)

## Tecnologías Utilizadas

- **React Native** - Framework principal
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local persistente
- **React Context** - Manejo de estado global

## Características Técnicas

- **Persistencia de datos** con AsyncStorage
- **Estado global** con React Context
- **Navegación por tabs** con React Navigation
- **Componentes reutilizables** y modulares
- **Manejo de fechas** y lógica de frecuencia
- **Sistema de notificaciones** (preparado para futuras implementaciones)

## Próximas Funcionalidades

- [ ] Notificaciones push para recordatorios
- [ ] Estadísticas detalladas y gráficos
- [ ] Logros y badges
- [ ] Compartir progreso en redes sociales
- [ ] Modo oscuro
- [ ] Personalización de retos
- [ ] Sincronización en la nube

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**¡Construye hábitos duraderos con HabitRush!** 🚀