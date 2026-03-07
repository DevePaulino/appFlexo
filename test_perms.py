#!/usr/bin/env python3
"""Quick test to verify permission logic"""

ROLE_PERMISSIONS_DEFAULT = {
    'impresion': {
        'manage_estados_pedido': False,
    },
    'administrador': {
        'manage_estados_pedido': True,
    },
}

def can_role_permission(role_key, permission_key):
    try:
        if not role_key or not permission_key:
            return False
        if str(role_key).strip() == 'root':
            return True
        role = str(role_key).strip()
        role_perms = ROLE_PERMISSIONS_DEFAULT.get(role)
        if isinstance(role_perms, dict):
            return bool(role_perms.get(permission_key, False))
        return False
    except Exception:
        return False

# Test
print("Testing can_role_permission:")
print(f"  impresion + manage_estados_pedido = {can_role_permission('impresion', 'manage_estados_pedido')} (expect False)")
print(f"  administrador + manage_estados_pedido = {can_role_permission('administrador', 'manage_estados_pedido')} (expect True)")
print(f"  root + manage_estados_pedido = {can_role_permission('root', 'manage_estados_pedido')} (expect True)")
