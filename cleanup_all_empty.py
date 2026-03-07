#!/usr/bin/env python3
"""Eliminar estados vacíos de forma agresiva"""

import sys
sys.path.insert(0, '/Users/osanchez/Vista-printingConditions/PrintForgePro')

from app import get_empresa_collection

col = get_empresa_collection('config_opciones', 0)

print("=== Buscando documentos vacíos ===")
vacios = list(col.find({'categoria': 'estados_pedido'}))

print(f"Total documentos: {len(vacios)}\n")

# Separar en vacíos y válidos
validos = []
para_eliminar = []

for doc in vacios:
    valor = doc.get('valor')
    orden = doc.get('orden')
    
    # Si valor es None o está vacío, eliminar
    if valor is None or (isinstance(valor, str) and valor.strip() == ''):
        para_eliminar.append(doc['_id'])
        print(f"❌ VACÍO: valor={repr(valor)}, orden={repr(orden)}")
    else:
        validos.append(doc)
        print(f"✓ VALID: valor={repr(valor)}, orden={repr(orden)}")

if para_eliminar:
    print(f"\n=== Eliminando {len(para_eliminar)} documentos ===")
    for doc_id in para_eliminar:
        col.delete_one({'_id': doc_id})
        print(f"✓ Eliminado: {doc_id}")

print(f"\n=== Resultado final ===")
finales = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
print(f"Total estados válidos: {len(finales)}")
for doc in finales:
    print(f"  Orden: {doc.get('orden')} | Valor: {repr(doc.get('valor'))}")
