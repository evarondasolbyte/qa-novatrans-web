# 🎯 Sistema de Prioridades para Pruebas de Novatrans

## 📋 **Descripción**

El sistema de prioridades permite ejecutar pruebas específicas según su importancia crítica, optimizando el tiempo de ejecución en CI/CD y facilitando el testing por fases.

## 🏷️ **Clasificación de Prioridades**

### **🔴 ALTA - Pruebas Críticas**
- **Acceso a pantallas** - Funcionalidad básica
- **Login y autenticación** - Seguridad core
- **Filtros principales** - Funcionalidades esenciales
- **Búsquedas básicas** - Operaciones fundamentales
- **CRUD básico** - Crear, editar, eliminar registros
- **Selección de datos** - Interacciones principales

### **🟡 MEDIA - Pruebas Importantes**
- **Filtros secundarios** - Funcionalidades importantes
- **Validaciones específicas** - Casos edge importantes
- **Ordenación** - Funcionalidades de organización
- **Reset de filtros** - Comportamiento esperado
- **Validaciones de formularios** - Integridad de datos

### **🟢 BAJA - Pruebas Secundarias**
- **Cambio de idiomas** - Funcionalidades cosméticas
- **Scroll y navegación** - Comportamiento de UI
- **Ocultar/mostrar columnas** - Personalización de vista
- **Búsquedas con caracteres especiales** - Casos edge raros
- **Ordenación avanzada** - Funcionalidades opcionales

## 🚀 **Uso del Sistema**

### **Ejecutar por Prioridad (Todas las categorías)**
```cmd
# Solo pruebas críticas
run-simple.bat --prioridad alta

# Solo pruebas importantes
run-simple.bat --prioridad media

# Solo pruebas secundarias
run-simple.bat --prioridad baja

# Todas las pruebas (por defecto)
run-simple.bat --prioridad todas
```

### **Ejecutar por Categoría + Prioridad**
```cmd
# Solo pruebas críticas de usuarios
run-simple.bat usuarios --prioridad alta

# Solo pruebas importantes de auditorías
run-simple.bat auditorias --prioridad media

# Solo pruebas secundarias de siniestros
run-simple.bat siniestros --prioridad baja
```

### **Ejecutar por Categoría (Todas las prioridades)**
```cmd
# Todas las pruebas de una categoría
run-simple.bat usuarios
run-simple.bat auditorias
run-simple.bat ficheros
```

## 📊 **Distribución de Prioridades por Archivo**

### **configuracion_usuarios.cy.js**
- **ALTA (11 pruebas)**: Acceso, filtros principales, búsquedas básicas, CRUD
- **MEDIA (8 pruebas)**: Filtros secundarios, ordenación, validaciones
- **BAJA (13 pruebas)**: Idiomas, scroll, personalización de vista

### **utilidades_auditorias.cy.js**
- **ALTA (12 pruebas)**: Acceso, filtros principales, búsquedas, selección
- **MEDIA (8 pruebas)**: Ordenación, validaciones, reset
- **BAJA (8 pruebas)**: Idiomas, scroll, personalización

## 🎯 **Casos de Uso Recomendados**

### **🔄 CI/CD Pipeline**
```cmd
# Desarrollo rápido - Solo crítico
run-simple.bat --prioridad alta

# Testing completo - Crítico + Importante
run-simple.bat --prioridad alta
run-simple.bat --prioridad media

# Release completo - Todas las pruebas
run-simple.bat --prioridad todas
```

### **🐛 Debugging**
```cmd
# Si falla login - Solo pruebas de acceso
run-simple.bat usuarios --prioridad alta

# Si fallan filtros - Solo pruebas de filtrado
run-simple.bat auditorias --prioridad alta

# Si falla UI - Solo pruebas de interfaz
run-simple.bat usuarios --prioridad baja
```

### **⚡ Testing Rápido**
```cmd
# Verificación rápida de funcionalidad core
run-simple.bat --prioridad alta

# Testing de regresión media
run-simple.bat --prioridad media

# Testing completo antes de release
run-simple.bat --prioridad todas
```

## 📈 **Beneficios**

1. **⚡ Velocidad**: Ejecutar solo pruebas críticas reduce tiempo de CI/CD
2. **🎯 Enfoque**: Priorizar pruebas según el contexto (desarrollo vs release)
3. **🔧 Debugging**: Aislar problemas por nivel de criticidad
4. **📊 Reportes**: Identificar fallos por prioridad en reportes
5. **🚀 Eficiencia**: Optimizar recursos de testing

## 🔧 **Implementación Técnica**

### **En archivos .cy.js:**
```javascript
const casos = [
    { numero: 1, nombre: 'TC001 - Login', funcion: login, prioridad: 'ALTA' },
    { numero: 2, nombre: 'TC002 - Cambiar idioma', funcion: cambiarIdioma, prioridad: 'BAJA' }
];

// Filtrado automático por prioridad
const prioridadFiltro = Cypress.env('prioridad');
const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
    ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
    : casos;
```

### **En script .bat:**
```batch
# Ejecutar con prioridad específica
npx cypress run --spec archivo.cy.js --env prioridad=alta
```

## 📝 **Notas Importantes**

- Las prioridades se muestran en el nombre del test: `[ALTA]`, `[MEDIA]`, `[BAJA]`
- Si no se especifica prioridad, se ejecutan todas las pruebas
- El sistema es case-insensitive: `alta`, `ALTA`, `Alta` funcionan igual
- Las prioridades se pueden modificar fácilmente en cada archivo `.cy.js`
