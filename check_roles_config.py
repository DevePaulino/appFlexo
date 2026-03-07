#!/usr/bin/env python3
import requests
import json

BASE = 'http://localhost:8080'

print("=" * 70)
print("Role Configuration Verification")
print("=" * 70)

# Check what roles exist in settings
print("\n[1] API settings?categoria=roles")
print("-" * 70)
r = requests.get(f'{BASE}/api/settings?categoria=roles')
if r.status_code == 200:
    items = r.json().get('items', [])
    print(f"Found {len(items)} roles:")
    for item in items:
        print(f"  - valor: '{item.get('valor')}' | label: '{item.get('label')}'")
else:
    print(f"ERROR: {r.status_code}")

# Check roles in system
print("\n[2] Backend ROLE_PERMISSIONS_DEFAULT")
print("-" * 70)
r2 = requests.get(f'{BASE}/api/settings/roles-permissions')
if r2.status_code == 200:
    roles_dict = r2.json().get('roles_permissions', {})
    roles_list = sorted(roles_dict.keys())
    print(f"Available roles: {roles_list}")
else:
    print(f"ERROR: {r2.status_code}")

# Check user role in DB
print("\n[3] User role in MongoDB")
print("-" * 70)
try:
    from pymongo import MongoClient
    client = MongoClient('mongodb://localhost:27017/')
    db = client['printforgepro']
    user = db.usuarios.find_one({'email': 'admin@local.dev'})
    if user:
        print(f"admin@local.dev rol: '{user.get('rol')}'")
        print(f"Rol type: {type(user.get('rol')).__name__}")
    else:
        print("User not found")
except Exception as e:
    print(f"ERROR: {e}")

# Summary
print("\n" + "=" * 70)
print("ROLE MATCHING CHECK")
print("=" * 70)
print("puedeCrear checks for: ['root', 'administrador', 'comercial', 'diseno']")
print("Does 'diseno' exist in ROLE_PERMISSIONS_DEFAULT? ")
print("Check the roles from [2] above.")
