# API REST para Integración con Sistemas ERP

Esta documentación describe los endpoints REST disponibles para que sistemas externos (como ERPs) creen pedidos automáticamente en PrintForgePro.

## Base URL
```
http://localhost:8080
```

## Autenticación

Todos los endpoints requieren los siguientes headers:

```
X-Empresa-Id: <empresa_id>
X-User-Id: <usuario_id>
X-Role: <rol>
```

Ejemplo:
```
X-Empresa-Id: 1
X-User-Id: erp_integration
X-Role: erp
```

---

## 1. Crear Pedido desde ERP

**Endpoint:** `POST /api/pedidos/crear-desde-erp`

**Descripción:** Crea un nuevo pedido en PrintForgePro desde un sistema externo.

### Parámetros (JSON Body)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `trabajo_id` | string | ✅ Sí | Identificador único del trabajo/pedido en el ERP |
| `cliente` | string | ✅ Sí | Nombre del cliente |
| `referencia` | string | ✅ Sí | Referencia/código del pedido |
| `nombre` | string | ❌ No | Nombre del pedido (por defecto: "Pedido {numero}") |
| `fecha_entrega` | string | ❌ No | Fecha de entrega (formato ISO 8601: YYYY-MM-DD) |
| `datos_presupuesto` | object | ❌ No | Datos adicionales del presupuesto (tirada, tinta, material, etc.) |
| `estado` | string | ❌ No | Estado inicial (por defecto: "diseno") |

### Ejemplo de Solicitud

```bash
curl -X POST http://localhost:8080/api/pedidos/crear-desde-erp \
  -H "Content-Type: application/json" \
  -H "X-Empresa-Id: 1" \
  -H "X-User-Id: erp_system" \
  -H "X-Role: erp" \
  -d '{
    "trabajo_id": "ERP-2026-001234",
    "cliente": "ACME Corp",
    "referencia": "REF-001",
    "nombre": "Folletos 100 unidades",
    "fecha_entrega": "2026-03-15",
    "datos_presupuesto": {
      "tirada": "100",
      "material": "PP",
      "acabado": ["Mate"],
      "selectedTintas": ["Y", "K"],
      "formatoAncho": "10",
      "formatoLargo": "15"
    },
    "estado": "diseno"
  }'
```

### Respuesta Exitosa (201)

```json
{
  "success": true,
  "message": "Pedido creado exitosamente desde ERP",
  "pedido": {
    "_id": "69a843720aa97f3d463156df",
    "empresa_id": 1,
    "trabajo_id": "ERP-2026-001234",
    "numero_pedido": "1005",
    "cliente": "ACME Corp",
    "referencia": "REF-001",
    "nombre": "Folletos 100 unidades",
    "fecha_pedido": "2026-03-04T15:30:00.123456",
    "fecha_entrega": "2026-03-15",
    "estado": "Diseño",
    "datos_presupuesto": { ... },
    "origen": "erp",
    "created_by": "erp_system (ERP Integration)"
  },
  "pedido_id": "69a843720aa97f3d463156df",
  "numero_pedido": "1005"
}
```

### Respuesta si ya existe (200)

Si un pedido ya existe para el `trabajo_id` proporcionado:

```json
{
  "success": true,
  "message": "Pedido ya existe para este trabajo_id",
  "pedido": { ... },
  "pedido_id": "69a843720aa97f3d463156df"
}
```

### Errores

- **400:** Faltan campos requeridos
```json
{
  "error": "trabajo_id es requerido"
}
```

- **500:** Error interno del servidor
```json
{
  "error": "Error creando pedido: ..."
}
```

---

## 2. Validar Modo Automático

**Endpoint:** `GET /api/pedidos/validar-modo-automatico`

**Descripción:** Verifica si el modo automático está habilitado en PrintForgePro. Útil para que el ERP decida si debe crear pedidos automáticamente.

### Ejemplo de Solicitud

```bash
curl http://localhost:8080/api/pedidos/validar-modo-automatico \
  -H "X-Empresa-Id: 1" \
  -H "X-User-Id: erp_system" \
  -H "X-Role: erp"
```

### Respuesta (200)

Si modo automático está habilitado:
```json
{
  "success": true,
  "modo": "automatico",
  "modo_automatico": true,
  "mensaje": "Modo automático habilitado"
}
```

Si modo manual está habilitado:
```json
{
  "success": true,
  "modo": "manual",
  "modo_automatico": false,
  "mensaje": "Modo manual habilitado"
}
```

---

## Flujo de Integración Recomendado

### 1. **Validar disponibilidad**
```
GET /api/pedidos/validar-modo-automatico
├─ Si modo_automatico = true → Proceder con crear pedido
└─ Si modo_automatico = false → Notificar al usuario, no crear automáticamente
```

### 2. **Crear pedido**
```
POST /api/pedidos/crear-desde-erp
├─ Si success = true → Pedido creado ✓
├─ Si Pedido ya existe → Retorna pedido existente
└─ Si error → Registrar error y reintentar
```

### 3. **Registrar resultado**
- Guardar `pedido_id` en tu sistema ERP
- Guardar `numero_pedido` para referencia interna
- Registrar en tabla de auditoría/sincronización

---

## Ejemplo: Script Python para Integración

```python
import requests
import json

ERP_API_URL = "http://localhost:8080"
EMPRESA_ID = "1"
USER_ID = "erp_integration"
ROLE = "erp"

headers = {
    "Content-Type": "application/json",
    "X-Empresa-Id": EMPRESA_ID,
    "X-User-Id": USER_ID,
    "X-Role": ROLE
}

def validar_modo_automatico():
    """Verifica si modo automático está habilitado"""
    url = f"{ERP_API_URL}/api/pedidos/validar-modo-automatico"
    response = requests.get(url, headers=headers)
    return response.json()

def crear_pedido_desde_erp(trabajo_id, cliente, referencia, **kwargs):
    """Crea un pedido en PrintForgePro"""
    url = f"{ERP_API_URL}/api/pedidos/crear-desde-erp"
    
    payload = {
        "trabajo_id": trabajo_id,
        "cliente": cliente,
        "referencia": referencia,
        **kwargs  # nombre, fecha_entrega, datos_presupuesto, estado, etc.
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Uso
if __name__ == "__main__":
    # Validar modo
    modo_response = validar_modo_automatico()
    print("Modo:", modo_response)
    
    if modo_response.get('modo_automatico'):
        # Crear pedido
        pedido_response = crear_pedido_desde_erp(
            trabajo_id="ERP-2026-001234",
            cliente="ACME Corp",
            referencia="REF-001",
            nombre="Folletos 100 unidades",
            fecha_entrega="2026-03-15",
            datos_presupuesto={
                "tirada": "100",
                "material": "PP",
                "acabado": ["Mate"],
                "selectedTintas": ["Y", "K"]
            }
        )
        print("Resultado:", pedido_response)
```

---

## Ejemplo: Script JavaScript/Node.js

```javascript
const ERP_API_URL = "http://localhost:8080";
const EMPRESA_ID = "1";
const USER_ID = "erp_integration";
const ROLE = "erp";

const headers = {
  "Content-Type": "application/json",
  "X-Empresa-Id": EMPRESA_ID,
  "X-User-Id": USER_ID,
  "X-Role": ROLE
};

async function validarModoAutomatico() {
  const response = await fetch(
    `${ERP_API_URL}/api/pedidos/validar-modo-automatico`,
    { method: 'GET', headers }
  );
  return response.json();
}

async function crearPedidoDesdeERP(trabajo_id, cliente, referencia, opciones = {}) {
  const payload = {
    trabajo_id,
    cliente,
    referencia,
    ...opciones
  };
  
  const response = await fetch(
    `${ERP_API_URL}/api/pedidos/crear-desde-erp`,
    { 
      method: 'POST', 
      headers,
      body: JSON.stringify(payload)
    }
  );
  return response.json();
}

// Uso
(async () => {
  const modo = await validarModoAutomatico();
  console.log("Modo:", modo);
  
  if (modo.modo_automatico) {
    const resultado = await crearPedidoDesdeERP(
      "ERP-2026-001234",
      "ACME Corp",
      "REF-001",
      {
        nombre: "Folletos 100 unidades",
        fecha_entrega: "2026-03-15",
        datos_presupuesto: {
          tirada: "100",
          material: "PP"
        }
      }
    );
    console.log("Resultado:", resultado);
  }
})();
```

---

## Estados Disponibles

Los valores válidos para `estado` son:
- `diseno` → "Diseño"
- `produccion` → "Producción"
- `calidad` → "Calidad"
- `expedicion` → "Expedición"
- `finalizado` → "Finalizado"
- `parado` → "Parado"
- `cancelado` → "Cancelado"

---

## Notas Importantes

1. **Idempotencia:** Si envías el mismo `trabajo_id` dos veces, el sistema devuelve el pedido existente sin crear duplicados.

2. **Origen:** Los pedidos creados via ERP se marcan con `origen: "erp"` para auditoría.

3. **Auditoría:** Todas las operaciones se registran en la tabla de auditoría con detalles del usuario ERP.

4. **Numeración automática:** Los números de pedido se generan automáticamente y son secuenciales por empresa.

5. **Sincronización:** Guarda el `pedido_id` retornado en tu sistema ERP para futuras referencias y actualizaciones.

6. **Extensibilidad:** El campo `datos_presupuesto` es flexible y puede contener cualquier estructura JSON. Así, cuando se añadan nuevos campos a un pedido o presupuesto en futuras versiones, simplemente envía los nuevos datos en este objeto y serán guardados automáticamente sin necesidad de cambios en los endpoints.

7. **Compatibilidad futura:** El sistema está diseñado para be compatible con evoluciones futuras:
   - Nuevos campos en `datos_presupuesto` se ignoran si no son reconocidos (forward-compatible)
   - Campos opcionales pueden convertirse en requeridos cuando sea necesario
   - El versionado se maneja mediante `X-API-Version` si es necesario en el futuro

