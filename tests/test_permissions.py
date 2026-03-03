import requests, json, sys
BASE = 'http://localhost:8080'

# Helpers
def hdr(user):
    return {'Content-Type': 'application/json', 'X-Test-User': json.dumps(user)}

root = {'id': 'root1', 'nombre': 'Root', 'rol': 'root', 'empresa_id': 1}
admin = {'id': 'admin1', 'nombre': 'Admin', 'rol': 'administrador', 'empresa_id': 1}
oper = {'id': 'oper1', 'nombre': 'Oper', 'rol': 'operario', 'empresa_id': 1}

# Save original permissions
r = requests.get(f'{BASE}/api/settings/roles-permissions', headers=hdr(root))
if r.status_code != 200:
    print('Failed to GET original permissions', r.status_code, r.text)
    sys.exit(2)
orig = r.json().get('roles_permissions') or {}

# Set a controlled permissions matrix
matrix = dict(orig)
matrix['operario'] = dict(matrix.get('operario') or {})
matrix['operario']['edit_clientes'] = False
matrix['administrador'] = dict(matrix.get('administrador') or {})
matrix['administrador']['edit_clientes'] = True
matrix['root'] = dict(matrix.get('root') or {})
matrix['root']['edit_clientes'] = True

pu = requests.put(f'{BASE}/api/settings/roles-permissions', headers=hdr(root), json={'permissions': matrix})
if pu.status_code != 200:
    print('Failed to PUT permissions', pu.status_code, pu.text)
    sys.exit(2)
print('Permissions updated for test')

# Attempt create cliente as operario (should be denied - 403)
payload = {'nombre': 'Cliente Test Oper'}
r_oper = requests.post(f'{BASE}/api/clientes', headers=hdr(oper), json=payload)
print('OPER POST status', r_oper.status_code)
if r_oper.status_code == 403:
    print('Correctly denied operario')
else:
    print('Unexpected operario result', r_oper.status_code, r_oper.text)
    sys.exit(3)

# Attempt create cliente as administrador (should succeed - 201)
r_admin = requests.post(f'{BASE}/api/clientes', headers=hdr(admin), json={'nombre': 'Cliente Test Admin'})
print('ADMIN POST status', r_admin.status_code)
if r_admin.status_code == 201:
    print('Admin allowed as expected')
else:
    print('Unexpected admin result', r_admin.status_code, r_admin.text)
    sys.exit(4)

# Attempt create cliente as root (should succeed - 201)
r_root = requests.post(f'{BASE}/api/clientes', headers=hdr(root), json={'nombre': 'Cliente Test Root'})
print('ROOT POST status', r_root.status_code)
if r_root.status_code == 201:
    print('Root allowed as expected')
else:
    print('Unexpected root result', r_root.status_code, r_root.text)
    sys.exit(5)

# Restore original permissions
rs = requests.put(f'{BASE}/api/settings/roles-permissions', headers=hdr(root), json={'permissions': orig})
print('RESTORE status', rs.status_code)
if rs.status_code != 200:
    print('Warning: failed to restore original permissions', rs.status_code, rs.text)

print('ALL TESTS PASSED')
sys.exit(0)
