#!/usr/bin/env python
"""Test API endpoint idempotency"""
import subprocess
import json
import time

# Start Flask
print("Starting Flask...")
flask_proc = subprocess.Popen(
    ['.venv/bin/python', '-m', 'flask', 'run', '--host=127.0.0.1', '--port=8080'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd='/Users/osanchez/Vista-printingConditions/PrintForgePro'
)

time.sleep(6)

# Make first request
print("\n--- First API call ---")
result1 = subprocess.run([
    'curl', '-s',
    'http://localhost:8080/api/settings?categoria=estados_pedido',
    '-H', 'X-Empresa-Id: 1',
    '-H', 'X-User-Id: test',
    '-H', 'X-Role: admin'
], capture_output=True, text=True)

try:
    data1 = json.loads(result1.stdout)
    items1 = data1.get('items', [])
    print(f"First call returned: {len(items1)} items")
except:
    print(f"First call failed: {result1.stdout[:200]}")
    print(f"Error: {result1.stderr[:200]}")
    items1 = []

# Make second request (should be idempotent)
print("\n--- Second API call (should be idempotent) ---")
time.sleep(1)
result2 = subprocess.run([
    'curl', '-s',
    'http://localhost:8080/api/settings?categoria=estados_pedido',
    '-H', 'X-Empresa-Id: 1',
    '-H', 'X-User-Id: test',
    '-H', 'X-Role: admin'
], capture_output=True, text=True)

try:
    data2 = json.loads(result2.stdout)
    items2 = data2.get('items', [])
    print(f"Second call returned: {len(items2)} items")
except:
    print(f"Second call failed: {result2.stdout[:200]}")
    items2 = []

# Analyze
if len(items1) == 8 and len(items2) == 8:
    print("\n✓ SUCCESS! Both calls returned 8 items (expected)")
    vals1 = [i['valor'] for i in items1]
    vals2 = [i['valor'] for i in items2]
    print(f"  Same values: {vals1 == vals2}")
else:
    print(f"\n✗ FAILED: Got {len(items1)} and {len(items2)} items (expected 8 each)")

# Kill Flask
flask_proc.terminate()
flask_proc.wait(timeout=5)
print("\nFlask stopped.")
