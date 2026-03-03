#!/usr/bin/env python3
"""
Script para limpiar estados duplicados en la colección config_opciones
Mantiene el registro más antiguo (orden más bajo) y elimina los duplicados.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from bson import ObjectId
import re
import unicodedata

MONGO_URI = 'mongodb://localhost:27017/printforgepro'
MONGO_DB = 'printforgepro'

def slugify_estado(texto):
    """Normaliza un estado para comparación"""
    import unicodedata
    s = str(texto or '')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s

def main():
    """Limpia duplicados de estados"""
    
    # Conectar a MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[MONGO_DB]
        print(f"✓ Conectado a MongoDB: {MONGO_DB}\n")
    except Exception as e:
        print(f"✗ Error conectando a MongoDB: {e}")
        sys.exit(1)
    
    # Usar la colección config_opciones
    col = db['config_opciones']
    
    # Obtener todos los estados
    estados_docs = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
    
    if not estados_docs:
        print("✓ No hay estados registrados")
        return
    
    print(f"Total de estados: {len(estados_docs)}\n")
    
    # Agrupar por slug para encontrar duplicados
    slugs = {}
    for doc in estados_docs:
        valor = doc.get('valor', '')
        slug = slugify_estado(valor)
        if slug not in slugs:
            slugs[slug] = []
        slugs[slug].append(doc)
    
    # Encontrar duplicados
    duplicados_a_eliminar = []
    print("=" * 70)
    print("ESTADOS DUPLICADOS ENCONTRADOS")
    print("=" * 70)
    
    found_any = False
    for slug, docs in sorted(slugs.items()):
        if len(docs) > 1:
            found_any = True
            print(f"\n⚠ [{slug}]: {len(docs)} versiones")
            # Mantener el de orden más bajo, eliminar el resto
            docs_sorted = sorted(docs, key=lambda x: (x.get('orden', 999), str(x.get('_id'))))
            keep_doc = docs_sorted[0]
            docs_to_delete = docs_sorted[1:]
            
            print(f"  ✓ Mantener: \"{keep_doc.get('valor')}\" (orden: {keep_doc.get('orden')}, id: {str(keep_doc['_id'])[:12]}...)")
            for doc in docs_to_delete:
                print(f"  ✗ Eliminar:  \"{doc.get('valor')}\" (orden: {doc.get('orden')}, id: {str(doc['_id'])[:12]}...)")
                duplicados_a_eliminar.append(doc['_id'])
    
    if not found_any:
        print("✓ No se encontraron duplicados")
        return
    
    print("\n" + "=" * 70)
    print(f"Total de duplicados a eliminar: {len(duplicados_a_eliminar)}")
    print("=" * 70 + "\n")
    
    # Pedir confirmación
    respuesta = input("¿Deseas eliminar estos duplicados? (s/n): ").strip().lower()
    
    if respuesta == 's':
        # Eliminar
        result = col.delete_many({'_id': {'$in': duplicados_a_eliminar}})
        print(f"\n✓ Se eliminaron {result.deleted_count} duplicados")
        
        # Verificar
        estados_despues = col.count_documents({'categoria': 'estados_pedido'})
        print(f"✓ Estados restantes: {estados_despues}\n")
    else:
        print("Operación cancelada.")

if __name__ == '__main__':
    main()
