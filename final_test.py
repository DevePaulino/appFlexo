#!/usr/bin/env python3
"""
Final test: Restart Flask and verify estados are created correctly
"""

from pymongo import MongoClient
from os import environ
import subprocess
import time

MONGO_URI = environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforge')
db = MongoClient(MONGO_URI)['printforge']

print("=== TEST FINAL: Limpieza, Reinicio Flask, Verificación ===")
print()

# Step 1: Clean
print("1. Limpiando BD...")
col = db['config_opciones']
deleted = col.delete_many({'categoria': 'estados_pedido'}).deleted_count
print(f"   ✓ Eliminados {deleted} documentos antiguos")

remaining = col.count_documents({'categoria': 'estados_pedido'})
assert remaining == 0, f"BD no está limpia: {remaining} documentos restantes"
print(f"   ✓ BD limpiada completamente (0 documentos)")
print()

# Step 2: Start Flask
print("2. Iniciando Flask...")
# Kill any existing Flask instances
subprocess.run(['killall', '-9', 'python'], capture_output=True)
time.sleep(1)

# Start Flask
flask_proc = subprocess.Popen(
    ['.venv/bin/python', '-m', 'flask', 'run', '--host=127.0.0.1', '--port=8080'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd='/Users/osanchez/Vista-printingConditions/PrintForgePro'
)
print(f"   ✓ Flask iniciado (PID: {flask_proc.pid})")
print()

# Step 3: Wait for Flask to start and execute init_db()
print("3. Esperando a que Flask inicie e init_db() se ejecute...")
time.sleep(4)
print(f"   ✓ Espera completada")
print()

# Step 4: Verify
print("4. Verificando estados en BD...")
estados = list(col.find({'categoria': 'estados_pedido'}).sort([('orden', 1), ('_id', 1)]))
print(f"   Total documentos: {len(estados)}")
print()

if len(estados) == 0:
    print("   ⚠️  PROBLEMA: No hay documentos. init_db() no se ejecutó correctamente.")
    print("   Revisando Flask output...")
    # Give Flask a bit more time and try again
    time.sleep(2)
    estados = list(col.find({'categoria': 'estados_pedido'}).sort([('orden', 1), ('_id', 1)]))
    print(f"   (Reintento) Total documentos: {len(estados)}")

print()
if len(estados) > 0:
    print("   Estados encontrados:")
    for idx, doc in enumerate(estados[:10], 1):  # Show first 10
        valor = doc.get('valor', 'N/A')
        orden = doc.get('orden', 'N/A')
        has_label = 'label' in doc
        has_tipo_slug = 'tipo_slug' in doc
        print(f"   {idx}. Orden={orden} | Valor={valor} | label={'✓' if has_label else '✗'} | tipo_slug={'✓' if has_tipo_slug else '✗'}")
    
    if len(estados) > 10:
        print(f"   ... ({len(estados) - 10} más)")
    print()
    
    # Check schema
    all_correct = all(
        doc.get('valor') and 
        doc.get('label') and 
        doc.get('orden') and 
        'tipo_slug' in doc
        for doc in estados
    )
    
    if len(estados) == 8 and all_correct:
        print("✅ ÉXITO: Exactamente 8 estados con esquema correcto")
    else:
        print(f"⚠️  AVISO: {len(estados)} documentos encontrados (esperaba 8)")
        if not all_correct:
            print("⚠️  Algunos documentos tienen esquema incorrecto")
else:
    print("❌ ERROR: No hay estados en BD")

print()
print("Test completado.")
