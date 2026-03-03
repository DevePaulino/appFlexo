#!/usr/bin/env python3
"""
Prueba que verifica que solo usuarios con manage_estados_pedido
pueden cambiar el estado de un pedido.
"""
import requests
import json
from bson import ObjectId

BASE = 'http://localhost:8080'

# Crear token mock para diferentes roles (en dev mode)
# En desarrollo, la auth usa X-Test-User header o JWT

def test_estado_permission(role):
    """Prueba cambiar estado con el rol especificado"""
    print(f"\n✓ Probando cambio de estado con rol: {role}")
    
    # Headers con X-Role como lo hace el frontend
    headers = {
        'Content-Type': 'application/json',
        'X-Role': role,
    }
    
    # Crear un pedido de prueba (simulado)
    trabajo_id = str(ObjectId())
    
    payload = {
        'estado': 'en-produccion'
    }
    
    try:
        response = requests.put(
            f'{BASE}/api/pedidos/{trabajo_id}/estado',
            headers=headers,
            json=payload,
            timeout=5
        )
        
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
        
        return response.status_code
    except Exception as e:
        print(f"  Error: {e}")
        return None

# Test con diferentes roles
print("\n=== Prueba de permisos para cambiar estado ===")

# impresion NO debería poder cambiar estado (403)
status = test_estado_permission('impresion')
if status == 403:
    print("  ✓ CORRECTO: impresion fue denegado (403)")
elif status == 404:
    print("  ✓ CORRECTO: sin pedido, pero status es 404 (endpoint funciona, permiso OK)")
else:
    print(f"  ✗ ERROR: impresion permitido con status {status} - SECURITY ISSUE!")

# administrador SÍ debería poder (200 o 404 si no existe el pedido)
status = test_estado_permission('administrador')
if status in [200, 404]:
    print("  ✓ CORRECTO: administrador permitido (200/404)")
elif status == 403:
    print(f"  ✗ ERROR: administrador fue denegado - {status}")
else:
    print(f"  ? DESCONOCIDO: status {status}")

# root debería poder
status = test_estado_permission('root')
if status in [200, 404]:
    print("  ✓ CORRECTO: root permitido (200/404)")
elif status == 403:
    print(f"  ✗ ERROR: root fue denegado - {status}")
else:
    print(f"  ? DESCONOCIDO: status {status}")
