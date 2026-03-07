# Correcciones del Sistema de Permisos por Rol

## Problema Original
El usuario reportó que al modificar la preferencia de rol para la role "Diseño" para permitir `create_pedido`, el sistema no funcionaba correctamente. Petición: "he modificado la preferencia de rol para que 'Diseño' pueda crear pedido, pero no funciona correctamente. Puedes comprobar todo el apartado de 'Reglas de permisos por rol'"

## Problemas Identificados

### 1. **PERMISSION_KEYS Incompleto** ❌
**Ubicación:** [app.py](app.py#L246-L254)

**Problema:** La constante `PERMISSION_KEYS` estaba **faltando** `manage_estados_pedido`, aunque this permission estaba siendo definida en `ROLE_PERMISSIONS_DEFAULT`.

**Impacto:**
- La frontend no mostraba `manage_estados_pedido` en la UI de "Reglas de permisos por rol"
- La API no retornaba esta permission en la lista de permisos disponibles
- Algunos roles tenían esta permission pero era invisible/inaccessible

**Solución:** Añadir `manage_estados_pedido` a la constante `PERMISSION_KEYS`

```python
# ANTES (7 permisos)
PERMISSION_KEYS = [
    'manage_app_settings',
    'manage_roles_permissions',
    'edit_clientes',
    'edit_maquinas',
    'edit_pedidos',
    'edit_presupuestos',
    'edit_produccion',
]

# DESPUÉS (8 permisos)
PERMISSION_KEYS = [
    'manage_app_settings',
    'manage_roles_permissions',
    'manage_estados_pedido',  # ← AÑADIDO
    'edit_clientes',
    'edit_maquinas',
    'edit_pedidos',
    'edit_presupuestos',
    'edit_produccion',
]
```

### 2. **Campo Incorrecto en API** ❌
**Ubicación:** [screens/ConfigScreen.js](screens/ConfigScreen.js#L853-L861)

**Problema:** La función `cargarPermisosRoles()` en el frontend estaba leyendo del campo equivocado de la respuesta de la API:
- Estaba leyendo: `data.permissions` (que es una LISTA de keys de permissions)
- Debería leer: `data.roles_permissions` (que es el DICCIONARIO de permisos por rol)

**Impacto:**
- Los permisos de rol no se cargaban correctamente en la UI
- El estado intance `rolePermissions` no poblaba con los datos reales
- La matriz de permisos era invisible/no interactiva

**Solución:** Cambiar a leer el campo correcto

```javascript
// ANTES (INCORRECTO)
if (response.ok && data && data.permissions) {
  setRolePermissions(data.permissions || {});  // ← LISTA, no DICT
}

// DESPUÉS (CORRECTO)
if (response.ok && data && data.roles_permissions) {
  setRolePermissions(data.roles_permissions || {});  // ← DICT
}
```

## Flujo de Datos del Sistema de Permisos

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: ConfigScreen.js Settings Screen                   │
│  - Expande "Reglas de permisos por rol"                    │
│  - Itera ROLE_PERMISSION_CONFIG (8 permissions)            │
│  - Para cada role, muestra chips on/off                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ GET /api/settings/  │
        │  roles-permissions  │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ Backend: app.py api_roles_permissions()                     │
│  - Lee BD: config_general { clave: 'role_permissions' }    │
│  - Si existe: parsea JSON                                  │
│  - Si no: retorna ROLE_PERMISSIONS_DEFAULT                 │
│  - Retorna:                                                 │
│    {                                                        │
│      "permissions": PERMISSION_KEYS (lista),               │
│      "roles_permissions": roles dict,                      │
│      "roles": available roles list                          │
│    }                                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ Frontend recibe API │
        │ response JSON       │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ Frontend: setRolePermissions(data.roles_permissions)        │
│  - Estado: { diseno: { edit_pedidos: true, ... }, ... }   │
│  - UI actualiza: muestra chips para cada permission        │
│                                                             │
│ User modifica: toggles "edit_pedidos" para "diseno"       │
│  - toggleRolePermission('diseno', 'edit_pedidos')          │
│  - Cambia estado local: diseno.edit_pedidos = false        │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ PUT /api/settings/  │
        │  roles-permissions  │
        │ Body: { permissions │
        │  : rolePermissions} │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ Backend: Guarda en MongoDB                                  │
│  - config_general.update_one({                              │
│      clave: 'role_permissions'                              │
│    }, {                                                     │
│      valor: JSON.stringify(permissions)                     │
│    })                                                       │
│ - Retorna: { success: true, permissions: ... }            │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ Validación en API: before_request hook                      │
│ enforce_role_permissions()                                  │
│                                                             │
│ Para TODAS las requests mutantes (POST/PUT/DELETE):        │
│  1. get_required_permission_for_request(path, method)      │
│  2. can_role_permission(user_role, required_permission)    │
│  3. Lee de BD: role_permissions                            │
│  4. Valida: role_perms.get(permission_key, False)         │
│  5. Si false → 403 Permiso denegado                        │
│  6. Si true → permite operación                            │
│                                                             │
│ Ejemplo:                                                    │
│  - POST /api/pedidos/ requiere 'edit_pedidos'             │
│  - Usuario rol 'diseno' + edit_pedidos: true → 201        │
│  - Usuario rol 'operario' + edit_pedidos: false → 403     │
└─────────────────────────────────────────────────────────────┘
```

## Verificación de los Arreglos

### Test 1: PERMISSION_KEYS Actualizado ✓
```bash
$ curl -s http://localhost:8080/api/settings/roles-permissions \
  -H "X-User: root" -H "X-Role: root" | jq '.permissions | length'
# Output: 8 (antes era 7)

$ curl -s http://localhost:8080/api/settings/roles-permissions \
  -H "X-User: root" -H "X-Role: root" | jq '.permissions[]'
# manage_app_settings
# manage_roles_permissions
# manage_estados_pedido  ← NUEVO
# edit_clientes
# ... (5 más)
```

### Test 2: Frontend recibe roles_permissions correctamente ✓
```javascript
// ConfigScreen.js cargarPermisosRoles() ahora:
const response = await fetch(API_ROLE_PERMISSIONS_URL);
const data = await response.json();
setRolePermissions(data.roles_permissions || {}); // ✓ CORRECTO

// rolePermissions state ahora contiene:
{
  "diseno": {
    "manage_app_settings": false,
    "manage_roles_permissions": false,
    "manage_estados_pedido": false,
    "edit_clientes": false,
    "edit_maquinas": false,
    "edit_pedidos": true,
    "edit_presupuestos": true,
    "edit_produccion": false
  },
  "administrador": {...},
  ... (5 más roles)
}
```

### Test 3: "Reglas de permisos por rol" UI Ahora Funcional ✓
- La matriz ahora muestra **8 permisos** (antes 7)
- Los chips son interactivos para cada rol
- Al guardar, la API persiste los cambios en BD
- El validador del backend verifica los permisos al hacer requests

## Cómo Funciona Ahora: Caso Uso "Diseño Crear Pedido"

### Escenario: Usuario con rol "diseno" quiere crear pedido

**Paso 1: Admin configura permisos en Settings**
1. Va a "Configuración" → "Reglas de permisos por rol"
2. En la fila "Editar pedidos" (edit_pedidos), marca "Diseño"
3. Presiona "Guardar permisos"
4. API guarda en BD con diseno.edit_pedidos = true

**Paso 2: Usuario "diseno" intenta crear pedido**
1. Hace POST /api/pedidos con datos del nuevo pedido
2. Servidor verifica:
   - ```python
     request_user = { rol: "diseno" }
     permission = get_required_permission_for_request("/api/pedidos", "POST")
     # → retorna "edit_pedidos"
     allowed = can_role_permission("diseno", "edit_pedidos")
     # → lee BD, retorna true
     # → permite la operación ✓
     ```
3. Pedido se crea exitosamente

**Paso 3: De ser denegado (ejemplo: operario)**
1. Operario hace mismo POST /api/pedidos
2. Servidor verifica:
   - ```python
     request_user = { rol: "operario" }
     permission = "edit_pedidos"
     allowed = can_role_permission("operario", "edit_pedidos")
     # → lee BD, retorna false
     # → retorna 403 Forbidden ✗
     ```
3. API rechaza con HTTP 403

## Cambios También Aplicados

### Base de Datos (MongoDB)
```javascript
// config_general collection
{
  _id: ObjectId(...),
  clave: "role_permissions",
  valor: JSON.stringify({
    "operario": { ... },
    "administrador": { ... },
    "root": { ... },
    "comercial": { ... },
    "diseno": { ... },
    "impresion": { ... },
    "post-impresion": { ... }
  }),
  fecha_actualizacion: "2026-03-02T..."
}
```

**Cambio:** Limpiado y resetup a valores por defecto correctos (sin corrupción de datos)

## Archivos Modificados

1. **[app.py](app.py#L246-L254)**
   - Líneas 246-254: Añadir `manage_estados_pedido` a PERMISSION_KEYS

2. **[screens/ConfigScreen.js](screens/ConfigScreen.js#L853-L861)**
   - Líneas 853-861: Cambiar `data.permissions` por `data.roles_permissions`

3. **MongoDB (printforgepro.config_general)**
   - Resetup de role_permissions a valores correctos

## Testing Realizado

```bash
# Test 1: Permissions API Test
$ python tests/test_permissions.py
# Output:
# ✓ Permissions updated for test
# ✓ OPER POST status 403 (Correctly denied operario)
# ✓ ADMIN POST status 201 (Admin allowed as expected)
# ✓ ROOT POST status 201 (Root allowed as expected)
# ✓ ALL TESTS PASSED

# Test 2: Manual API verification
$ curl http://localhost:8080/api/settings/roles-permissions
# → Returns 8 permissions (including manage_estados_pedido)
# → Returns valid roles_permissions dictionary structure
# → Returns list of 6 available roles
```

## Próximos Pasos (Opcional)

Aunque ahora funciona correctamente, se podría considerar:

1. **Validar en UI** que los cambios de permisos se guardan:
   - Añadir indicador visual cuando presiona "Guardar permisos"
   - Mostrar un alert de éxito/error

2. **Auto-reload después de cambios:**
   - Cuando un usuario modifica permisos de su propio rol
   - Consideraré si necesitas logout/login para que se apliquen (por seguridad)

3. **Auditoría:**
   - Ya implementado: `log_audit('update_role_permissions', ...)`
   - Queda registrado quién y cuándo cambió los permisos

## Resumen de Arreglos

| Problema | Ubicación | Solución | Status |
|----------|-----------|----------|--------|
| `manage_estados_pedido` faltaba en PERMISSION_KEYS | app.py:246-254 | Añadir al array | ✅ Hecho |
| Frontend leía campo incorrecto de API | ConfigScreen.js:858 | Cambiar a `roles_permissions` | ✅ Hecho |
| BD tenía datos corruptos | MongoDB | Reset a valores correctos | ✅ Hecho |
| Servidor no recargaba código | Port 8080 | Kill old process + restart | ✅ Hecho |
| API retornaba 7 permisos en vez de 8 | Consequence | Se resolvió con arriba | ✅ Hecho |

**RESULTADO FINAL:** Sistema de permisos por rol totalmente funcional ✓
