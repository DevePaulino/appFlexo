# Eliminación de Roles + Limpieza de Duplicados

## Resumen de Cambios

Se ha implementado:
1. **Eliminación de roles** con validaciones de uso
2. **Limpieza automática** de estados duplicados y sin uso
3. **Limpieza automática** de roles duplicados y sin usar

---

## 1. Eliminación de Roles (Frontend)

### Validaciones Implementadas

Al intentar eliminar un rol, el sistema valida:

✅ **Es un rol protegido del sistema** (administrador, root)?
- ❌ **No se puede eliminar** - Se muestra error "No se puede eliminar este rol protegido del sistema"

✅ **¿Está siendo usado por algún usuario?**
- Llama a: `GET /api/settings/rol-usage?rol_id=<id>`
- Si retorna `in_use=true` con N usuarios
- ❌ **No se puede eliminar** - Se muestra error: "Este rol está siendo utilizado por N usuario(s)"

✅ **Si pasa todas las validaciones**
- ✅ **Se elimina** el rol
- Se actualiza automáticamente la matriz de permisos

### Archivo Modificado
- `screens/ConfigScreen.js` - Función `eliminarValor()`

---

## 2. Nuevo Endpoint Backend

### `GET /api/settings/rol-usage`

**Descripción**: Valida si un rol está siendo usado por algún usuario

**Parámetros**:
- `rol_id` (requerido) - ID del rol en MongoDB

**Respuesta exitosa (200)**:
```json
{
  "rol_id": "69a4c5ae6a944a3b2d60efc0",
  "rol_valor": "Comercial",
  "in_use": true,
  "count": 3
}
```

**Respuesta cuando no está en uso**:
```json
{
  "rol_id": "69a4c5ae6a944a3b2d60efc0",
  "rol_valor": "TestRole",
  "in_use": false,
  "count": 0
}
```

**Lógica**:
1. Valida que `rol_id` sea un ObjectId válido
2. Busca el rol en `config_opciones` con `categoria='roles'`
3. Normaliza el valor del rol (slugifica)
4. Cuenta cuántos usuarios tienen ese rol
5. Retorna `in_use=true` si count > 0

### Archivo Modificado
- `app.py` - Nuevo endpoint `check_rol_usage()`

---

## 3. Scripts de Limpieza

### A. `scripts/cleanup_estados.py`

**Función**: Limpiar estados de pedidos duplicados y sin uso

**Ejecutar**:
```bash
cd /Users/osanchez/Vista-printingConditions/PrintForgePro
source .venv/bin/activate
python3 scripts/cleanup_estados.py
```

**Qué hace**:

1. **Analiza la BD**:
   - Encuentra estados duplicados (mismo valor slugificado)
   - Encuentra estados sin uso en ningún pedido
   - Reporta en detalle

2. **Protecciones**:
   ```python
   PROTECTED_ESTADOS = {
       'diseno',
       'pendiente-de-aprobacion',
       'pendiente-de-cliche',
       'pendiente-de-impresion',
       'pendiente-post-impresion',
       'finalizado',
       'parado',
       'cancelado',
   }
   ```
   - Los estados protegidos **NO se eliminan**, aunque estén sin uso

3. **Limpieza**:
   - Solicita confirmación antes de eliminar
   - Mantiene la versión más antigua de cada duplicado (orden más bajo)
   - Elimina estados sin uso (excepto protegidos)
   - Reporta total de items eliminados

**Ejemplo de salida**:
```
========================================================================
ANÁLISIS DE ESTADOS DE PEDIDOS
========================================================================

1. BUSCANDO ESTADOS DUPLICADOS...

⚠ ENCONTRADOS 1 ESTADOS CON DUPLICADOS:

  Slug: 'diseno'
    - ID: 69a4c5ae6a944a3b2d60efcf
      Valor: Diseño
      Orden: 1
      En uso: 5 trabajo(s)
    - ID: 69a4c5ae6a944a3b2d60ef00
      Valor: diseño
      Orden: 15
      En uso: 0 trabajo(s)

2. BUSCANDO ESTADOS SIN USO...

⚠ ENCONTRADOS 2 ESTADOS SIN USO:

  - ID: 69a4c5ae6a944a3b2d60ef01
    Valor: TestEstado
    Orden: 10

========================================================================
RESUMEN
========================================================================

Total de estados de pedidos: 8
Estados con duplicados: 1
Estados sin uso: 2

Total de items a eliminar: 3

¿Deseas proceder con la limpieza? (s/n): 
```

### B. `scripts/cleanup_roles.py`

**Función**: Limpiar roles duplicados y sin usar

**Ejecutar**:
```bash
cd /Users/osanchez/Vista-printingConditions/PrintForgePro
source .venv/bin/activate
python3 scripts/cleanup_roles.py
```

**Qué hace**:

1. **Analiza la BD**:
   - Encuentra roles duplicados
   - Encuentra roles sin usuarios asignados
   - Reporta en detalle

2. **Protecciones**:
   ```python
   PROTECTED_ROLES = {
       'administrador',
       'root',
       'operario',
       'comercial',
       'diseno',
       'impresion',
       'post-impresion',
   }
   ```
   - Los roles protegidos y `internal=true` **NO se eliminan**
   - Aunque estén sin usuarios

3. **Limpieza**:
   - Solicita confirmación
   - Mantiene el rol más antiguo de duplicados
   - Elimina roles sin usar (excepto protegidos)
   - Reporta total de eliminaciones

---

## 4. Integración en UI

### ConfigScreen.js - Sección Usuarios/Roles

Cuando el usuario intenta eliminar un rol:

```
1. Verifica: ¿Es administrador o root?
   ↓ Sí → Alert: "No se puede eliminar este rol protegido"
   ↓ No → Continúa

2. Llama: GET /api/settings/rol-usage?rol_id=<id>
   ↓
3. Valida respuesta:
   ↓ in_use=false → Continúa
   ↓ in_use=true → Alert: "Está siendo utilizado por N usuario(s)"
   
4. Ejecuta: DELETE /api/settings/<id>
   ↓
5. Actualiza:
   - Recarga settings
   - Recarga permisos de roles
```

---

## 5. Flujo de Uso Recomendado

### Paso 1: Ejecutar Limpieza (Admin)
```bash
# Terminal 1: Inicia el backend
source .venv/bin/activate
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=8080

# Terminal 2: Ejecuta limpieza
cd /Users/osanchez/Vista-printingConditions/PrintForgePro
source .venv/bin/activate
python3 scripts/cleanup_estados.py
python3 scripts/cleanup_roles.py
```

### Paso 2: Usar la UI para eliminar roles manualmente
1. Navega a: Configuración → Usuarios → Roles
2. Intenta eliminar un rol personalizado
3. Sistema valida automáticamente:
   - Si está siendo usado → Error
   - Si es protegido → Error
   - Si está disponible → Se elimina

---

## 6. Base de Datos Afectada

### Colecciones impactadas:
- `empresa_0_config_opciones` - Roles y estados de pedidos
- `empresa_0_usuarios` - Usuarios asignados a roles
- `empresa_0_trabajos` - Trabajos con estados

### Campos clave:
- `config_opciones.categoria` - 'roles' o 'estados_pedido'
- `config_opciones.valor` - Nombre del rol/estado
- `usuarios.rol` - Rol asignado (slugificado)
- `trabajos.estado` - Estado actual (slugificado)

---

## 7. Validaciones y Protecciones

### Estados Protegidos (No se pueden eliminar):
- diseno
- pendiente-de-aprobacion
- pendiente-de-cliche
- pendiente-de-impresion
- pendiente-post-impresion
- finalizado
- parado
- cancelado

### Roles Protegidos (No se pueden eliminar):
- administrador
- root
- operario
- comercial
- diseno
- impresion
- post-impresion

### Estados Internos (No se pueden eliminar):
- Rolesy estados con `internal=true`

---

## 8. Consideraciones de Seguridad

✅ **Prevent accidental deletion of system roles**
- Roles protegidos no se pueden eliminar desde UI

✅ **Prevent breaking user assignments**
- No permite eliminar un rol si hay usuarios asignados
- Obliga a reasignar usuarios primero

✅ **Prevent breaking workflows**
- No permite eliminar estados en uso en pedidos
- Obliga a cambiar estado del pedido primero

✅ **Audit trail**
- Cada eliminación se registra en logs
- Se puede ver quién eliminó qué

---

## 9. Testing Manual

### Test 1: Eliminar un rol en uso
```bash
# Crear un rol de prueba y asignar a un usuario
# Intentar eliminarlo desde UI
# Resultado esperado: Error "Este rol está siendo utilizado por 1 usuario(s)"
```

### Test 2: Eliminar un rol protegido
```bash
# Intentar eliminar "administrador"
# Resultado esperado: Error "No se puede eliminar este rol protegido"
```

### Test 3: Eliminar un estado en uso
```bash
# Crear un estado y usarlo en un pedido
# Intentar eliminarlo desde Funcionalidades web
# Resultado esperado: Error "Este estado está siendo utilizado en 1 pedido(s)"
```

### Test 4: Ejecutar script de limpieza
```bash
python3 scripts/cleanup_estados.py
python3 scripts/cleanup_roles.py
# Verificar que se detectan y limpian duplicados correctamente
```

---

## 10. Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `screens/ConfigScreen.js` | Validación de roles en uso en `eliminarValor()` |
| `app.py` | Nuevo endpoint `/api/settings/rol-usage` |
| `scripts/cleanup_estados.py` | NUEVO - Script de limpieza de estados |
| `scripts/cleanup_roles.py` | NUEVO - Script de limpieza de roles |

---

**Última actualización**: 3 de marzo de 2026
