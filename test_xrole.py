#!/usr/bin/env python3
import requests
import json
import sys

BASE = 'http://localhost:8080'

print("=" * 70)
print("Testing X-Role Header Support")
print("=" * 70)

# Test 1: Check current diseno permissions
print("\n[Test 1] Checking Diseño role permissions in DB")
print("-" * 70)
r = requests.get(f'{BASE}/api/settings/roles-permissions')
if r.status_code != 200:
    print(f"ERROR: Status {r.status_code}")
    print(f"Response: {r.text}")
    sys.exit(1)

data = r.json()
roles = data.get('roles_permissions', {})
diseno_perms = roles.get('diseno', {})
edit_pedidos_perm = diseno_perms.get('edit_pedidos')

print(f"Diseño role exists: {bool(diseno_perms)}")
print(f"Diseño edit_pedidos permission: {edit_pedidos_perm}")

if edit_pedidos_perm != True:
    print("\nWARNING: Diseño role does NOT have edit_pedidos permission!")
    print("This is why you can't create pedidos.")
    print("\nNeed to enable edit_pedidos for Diseño role first.")
    
    # Show how to fix it
    print("\nTo fix: In ConfigScreen, go to 'Reglas de permisos por rol'")
    print("  1. Find 'Diseño' row")
    print("  2. Click the 'edit_pedidos' chip to enable it")
    print("  3. Click 'Guardar permisos'")

# Test 2: Verify X-Role header would be read
print("\n[Test 2] Testing that backend reads X-Role header")  
print("-" * 70)

# Create a test with custom X-Role header
headers = {'X-Role': 'diseno', 'X-Test-User': json.dumps({'id': 'test1', 'rol': 'operario', 'empresa_id': 1})}
r2 = requests.get(f'{BASE}/api/settings/roles-permissions', headers=headers)
print(f"Request sent with X-Role: diseno header")
print(f"Status: {r2.status_code}")

if r2.status_code != 200:
    print(f"ERROR: {r2.text}")
else:
    print("✓ Backend received the request with X-Role header")

# Test 3: Check localStorage simulation
print("\n[Test 3] How role switching works:")
print("-" * 70)
print("1. User selects 'Diseño' from role dropdown in header")
print("2. Frontend saves to localStorage: localStorage.setItem('PFP_SELECTED_ROLE', 'diseno')")
print("3. Every API request includes header: X-Role: diseno")
print("4. Backend reads X-Role header and validates using 'diseno' role's permissions")
print("5. If 'diseno' has edit_pedidos: true → create pedido succeeds")
print("   If 'diseno' has edit_pedidos: false → get 403 Forbidden")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

if edit_pedidos_perm == True:
    print("✓ Diseño role HAS edit_pedidos permission")
    print("✓ X-Role header should work for creating pedidos")
    print("\nIf still getting 403 error, check:")
    print("  - Browser console: localStorage.getItem('PFP_SELECTED_ROLE')")
    print("  - Network tab: Verify X-Role header in requests")
    print("  - Flask logs: Check if X-Role header is being received")
else:
    print("✗ Diseño role MISSING edit_pedidos permission")
    print("✗ This is why you're getting 403 Permission Denied")
    print("\nFIX: Enable edit_pedidos for Diseño role in ConfigScreen")

