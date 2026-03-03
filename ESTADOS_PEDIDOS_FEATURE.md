# Gestión de Estados de Pedidos - Feature Documentation

## Overview
Se ha implementado un nuevo sistema completo para gestionar los estados de pedidos directamente desde la sección de **Funcionalidades web** en la Configuración de la aplicación.

## Cambios Realizados

### 1. **Frontend (ConfigScreen.js)**

#### Nuevas APIs
- **`API_ESTADO_USAGE_URL`**: Endpoint para validar si un estado está siendo usado en pedidos
  - URL: `http://localhost:8080/api/settings/estado-usage?estado_id=<id>`
  - Retorna: `{ in_use: boolean, count: number }`

#### Nuevos Permisos de Rol
Se añadió un nuevo permiso a la matriz de permisos:
- **`manage_estados_pedido`**: "Editar estados de pedidos"
  - Hint: "Permite crear, modificar y eliminar estados disponibles."
  - Default: `True` para `root` y `administrador`
  - Default: `False` para otros roles

#### Cambios en ConfigScreen.js
1. **Se amplió la sección Funcionalidades web** para incluir:
   - Componente de gestión de "Modo de creación" (existente)
   - **Nuevo componente de gestión de "Estados de pedido"** 
     - Permite añadir nuevos estados
     - Permite editar nombres de estados
     - Permite eliminar estados (con restricciones)
     - Permite reordenar estados (arriba/abajo)

2. **Se extendió la función `eliminarValor()`** para:
   - Validar si un estado está siendo usado en algún pedido
   - Prevenir eliminación de estados protegidos del sistema
   - Mostrar mensajes de error específicos al usuario

3. **Estados protegidos** (no se pueden eliminar ni editar):
   - `diseno`
   - `pendiente-de-aprobacion`
   - `pendiente-de-cliche`
   - `pendiente-de-impresion`
   - `pendiente-post-impresion`
   - `finalizado`
   - `parado`
   - `cancelado`

### 2. **Backend (app.py)**

#### Nuevos Endpoints

**`GET /api/settings/estado-usage`**
- **Parámetro**: `estado_id` (obligatorio)
- **Descripción**: Valida si un estado de pedido está siendo usado en algún trabajo/pedido
- **Respuesta exitosa (200)**:
  ```json
  {
    "estado_id": "69a4c5ae6a944a3b2d60efcf",
    "estado_valor": "Diseño",
    "in_use": false,
    "count": 0
  }
  ```
- **Lógica**:
  - Obtiene el estado de la colección `config_opciones`
  - Cuenta cuántos trabajos en la colección `trabajos` tienen ese estado
  - Retorna `in_use=true` si hay al menos un trabajo con ese estado

#### Actualizaciones de Permisos

Se actualizó el diccionario `ROLE_PERMISSIONS_DEFAULT` para incluir `manage_estados_pedido`:

```python
ROLE_PERMISSIONS_DEFAULT = {
    'operario': {..., 'manage_estados_pedido': False, ...},
    'administrador': {..., 'manage_estados_pedido': True, ...},
    'root': {..., 'manage_estados_pedido': True, ...},
    'comercial': {..., 'manage_estados_pedido': False, ...},
    'diseno': {..., 'manage_estados_pedido': False, ...},
    'impresion': {..., 'manage_estados_pedido': False, ...},
    'post-impresion': {..., 'manage_estados_pedido': False, ...},
}
```

## Flujo de Funcionalidad

### 1. Añadir un nuevo estado de pedido
1. Usuario navega a Configuración > Funcionalidades web
2. En la sección "Estados de pedido", escribe el nombre del nuevo estado
3. Hace clic en "+ Añadir"
4. El frontend envía POST a `/api/settings/opcion?categoria=estados_pedido&valor=<nombre>`
5. El estado se añade a la colección `config_opciones`
6. Se actualiza automáticamente en toda la app

### 2. Editar un estado de pedido
1. Usuario hace clic en el icono ✎ (edit) junto al estado
2. Se activa la edición inline
3. Escribe el nuevo nombre y presiona Enter
4. El frontend envía PUT a `/api/settings/<id>` con el nuevo valor
5. El cambio se refleja inmediatamente en todos los lugares donde se usa

### 3. Eliminar un estado de pedido
1. Usuario hace clic en el icono ✕ (delete) junto al estado
2. **Sistema valida**:
   - ¿Es un estado protegido? → Muestra error "No se puede eliminar (protegido del sistema)"
   - ¿Está siendo usado? → Llama a `/api/settings/estado-usage?estado_id=<id>`
   - Si retorna `in_use=true` → Muestra error con el número de pedidos afectados
3. Si pasa las validaciones → Envía DELETE a `/api/settings/<id>`
4. El estado se elimina de la BD y se actualiza la app

### 4. Reordenar estados
1. Usuario hace clic en ↑ o ↓ junto a un estado
2. El frontend reordena localmente y envía POST a `/api/settings/reorder`
3. El nuevo orden se guarda en la BD
4. El orden se refleja en todas las interfaces

## Integración con Permisos de Roles

El nuevo permiso `manage_estados_pedido` se puede gestionar desde:
- **Usuarios > Reglas de permisos por rol**
- Cada rol puede tener habilitado/deshabilitado el permiso de editar estados

**Nota**: Actualmente, el frontend en ConfigScreen.js no valida este permiso al mostrar/permitir la edición de estados. Se recomienda agregar esta validación en futuras versiones.

## Datos Sincronizados Automáticamente

Cuando se añade/edita/elimina un estado:

1. **En ConfigScreen.js**: Se recarga la lista de estados (`cargarSettings()`)
2. **En cualquier componente que use estados**: Necesita llamar a `/api/settings?categoria=estados_pedido`
3. **En TrabajoScreen.js**: Se recarga automáticamente si está abierto

## Consideraciones Técnicas

### Estados en la BD
- **Almacenamiento**: Colección `config_opciones` con `categoria='estados_pedido'`
- **Formato**: Slugificado para comparación (ej: "Diseño" → "diseno")
- **Protección**: Solo los estados en `PROTECTED_ESTADOS_PEDIDO_KEYS` están protegidos

### Validación de Eliminación
- Antes de eliminar, se valida contra la colección `trabajos`
- Compare el valor slugificado del estado con el campo `estado` en trabajos
- Si `count > 0`, se impide la eliminación

## Test Manual

Para probar la funcionalidad:

```bash
# 1. Iniciar el backend
source .venv/bin/activate
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=8080

# 2. Abrir en navegador
# http://localhost:8081/app?section=funcionalidades

# 3. Probar:
# - Añadir nuevo estado: "Prueba"
# - Editar estado: cambiar a "Test"
# - Reordenar: mover arriba/abajo
# - Eliminar: debería funcionar si no hay pedidos
# - Crear un pedido de prueba con ese estado y luego intentar eliminar (debe fallar)
```

## API Endpoints Relacionados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/settings` | Obtiene todas las opciones de configuración |
| POST | `/api/settings/opcion` | Crea una nueva opción (estado, rol, material, etc.) |
| PUT | `/api/settings/<id>` | Edita una opción existente |
| DELETE | `/api/settings/<id>` | Elimina una opción |
| POST | `/api/settings/reorder` | Reordena opciones de una categoría |
| **GET** | **`/api/settings/estado-usage`** | **Valida si un estado está en uso (NUEVO)** |
| GET | `/api/settings/estados-pedido-rules` | Obtiene reglas de estados |
| PUT | `/api/settings/estados-pedido-rules` | Actualiza reglas de estados |
| GET | `/api/settings/roles-permissions` | Obtiene matriz de permisos |
| PUT | `/api/settings/roles-permissions` | Actualiza matriz de permisos |

## Próximos Pasos Recomendados

1. **Validación de permisos en UI**: Deshabilitar botones de edición si el usuario no tiene permiso `manage_estados_pedido`
2. **Estados por rol**: Extender la matriz de permisos para que cada rol pueda tener una lista de estados permitidos/visibles
3. **Historial**: Registrar cambios en estados (quién los creó, cuándo, qué cambió)
4. **Validación en frontend**: Mejorar mensajes de error al usuario
5. **Sincronización real-time**: Usar WebSockets para actualizar estados en tiempo real cuando otro usuario los modifica

---

**Última actualización**: 3 de marzo de 2026
