#!/usr/bin/env python3
"""
Script para limpiar estados de pedidos duplicados y sin uso

Funcionalidades:
1. Encuentra y reporta estados duplicados por empresa
2. Encuentra estados sin uso
3. Opcionalmente elimina duplicados y sin uso
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
import unicodedata
from pymongo import MongoClient
from bson import ObjectId

# Configuración de MongoDB - usar la misma que app.py
MONGO_URI = 'mongodb://localhost:27017/pressmateapp'
MONGO_DB = 'pressmateapp'

def slugify_estado(texto):
    """Normaliza un estado para comparación (Python puro)"""
    s = str(texto or '')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s

def main():
    """Ejecuta la limpieza de estados por empresa"""
    
    # Conectar a MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[MONGO_DB]
        print(f"✓ Conectado a MongoDB: {MONGO_DB}\n")
    except Exception as e:
        print(f"✗ Error conectando a MongoDB: {e}")
        sys.exit(1)
    
    # NOTA: Por ahora usamos colección global 'config_opciones'
    # En el futuro, esto puede adaptarse para múltiples empresas usando colecciones como 'empresa_1_config_opciones', etc.
    col = db['config_opciones']
    
    # Obtener todos los estados
    estados_docs = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
    
    if not estados_docs:
        print("✓ No hay estados registrados\n")
        return
    
    print("=" * 70)
    print("ANÁLISIS DE ESTADOS DE PEDIDOS")
    print("=" * 70)
    
    print(f"\nTotal de estados: {len(estados_docs)}\n")
    
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
    print("1. BUSCANDO ESTADOS DUPLICADOS...\n")
    
    has_duplicates = False
    for slug, docs in sorted(slugs.items()):
        if len(docs) > 1:
            has_duplicates = True
            docs_sorted = sorted(docs, key=lambda x: (x.get('orden', 999), str(x.get('_id'))))
            keep_doc = docs_sorted[0]
            docs_to_delete = docs_sorted[1:]
            
            print(f"⚠ [{slug}]: {len(docs)} versiones")
            print(f"  ✓ Mantener: \"{keep_doc.get('valor')}\" (id: {str(keep_doc['_id'])[:12]}...)")
            for doc in docs_to_delete:
                print(f"  ✗ Eliminar:  \"{doc.get('valor')}\" (id: {str(doc['_id'])[:12]}...)")
                duplicados_a_eliminar.append(doc['_id'])
    
    if not has_duplicates:
        print("✓ No se encontraron estados duplicados\n")
    else:
        print()
    
    # Buscar estados sin uso (no usados en ningún trabajo)
    print("2. BUSCANDO ESTADOS SIN USO...\n")
    
    col_pedidos = db.get_collection('pedidos')
    estados_sin_uso = []
    
    for doc in estados_docs:
        valor = doc.get('valor', '')
        slug = slugify_estado(valor)
        # Contar usos en pedidos
        count = col_pedidos.count_documents({'estado': slug})
        if count == 0:
            # Proteger estados del sistema
            protected_estados = [slugify_estado(v) for v in ['Diseño', 'Finalizado', 'Parado', 'Cancelado']]
            if slug not in protected_estados:
                estados_sin_uso.append(doc)
    
    if estados_sin_uso:
        for doc in estados_sin_uso:
            print(f"⚠ Estado sin uso: \"{doc.get('valor')}\" (id: {str(doc['_id'])[:12]}...)")
            duplicados_a_eliminar.append(doc['_id'])
    else:
        print("✓ No se encontraron estados sin uso\n")
    
    # Resumen
    print("=" * 70)
    print("RESUMEN")
    print("=" * 70 + "\n")
    print(f"Total de estados de pedidos: {len(estados_docs)}")
    print(f"Estados con duplicados: {len([s for s, d in slugs.items() if len(d) > 1])}")
    print(f"Estados sin uso: {len(estados_sin_uso)}")
    print(f"Total de items a eliminar: {len(duplicados_a_eliminar)}\n")
    
    if not duplicados_a_eliminar:
        print("✓ No hay nada que limpiar")
        return
    
    # Pedir confirmación
    respuesta = input("¿Deseas eliminar estos items? (s/n): ").strip().lower()
    
    if respuesta == 's':
        result = col.delete_many({'_id': {'$in': duplicados_a_eliminar}})
        print(f"\n✓ Se eliminaron {result.deleted_count} items")
        
        # Verificar cantidad final
        estados_finales = col.count_documents({'categoria': 'estados_pedido'})
        print(f"✓ Estados restantes: {estados_finales}\n")
    else:
        print("Operación cancelada.\n")

if __name__ == '__main__':
    main()
        for estado in estados:
            slug = slugify_estado_py(estado.get('valor', ''))
            count = col_trabajos.count_documents({'estado': slug})
            
            if count == 0:
                estados_sin_uso.append(estado)
        
        if estados_sin_uso:
            print(f"\n⚠ ENCONTRADOS {len(estados_sin_uso)} ESTADOS SIN USO:\n")
            for estado in estados_sin_uso:
                print(f"  - ID: {estado['_id']}")
                print(f"    Valor: {estado.get('valor', 'N/A')}")
                print(f"    Orden: {estado.get('orden', 'N/A')}")
                print(f"    Creado: {estado.get('fecha_creacion', 'N/A')}\n")
        else:
            print("\n✓ No se encontraron estados sin uso")
        
        # 3. Resumen
        print("\n\n" + "="*70)
        print("RESUMEN")
        print("="*70)
        print(f"\nTotal de estados de pedidos: {len(estados)}")
        print(f"Estados con duplicados: {len(duplicados)}")
        print(f"Estados sin uso: {len(estados_sin_uso)}")
        
        total_a_limpiar = sum(len(items)-1 for items in duplicados.values()) + len(estados_sin_uso)
        print(f"\nTotal de items a eliminar: {total_a_limpiar}")
        
        # 4. Preguntar si desea limpiar
        if total_a_limpiar > 0:
            print("\n" + "="*70)
            response = input("\n¿Deseas proceder con la limpieza? (s/n): ").strip().lower()
            
            if response == 's':
                cleaned =0
                
                # Limpiar duplicados (mantener solo el primero)
                for slug, items in sorted(duplicados.items()):
                    items_sorted = sorted(items, key=lambda x: x.get('orden', 999))
                    # Mantener el primero (orden más bajo)
                    for item_to_delete in items_sorted[1:]:
                        print(f"\n  Eliminando estado duplicado: {item_to_delete.get('valor')} (ID: {item_to_delete['_id']})")
                        col_config.delete_one({'_id': item_to_delete['_id']})
                        cleaned += 1
                
                # Limpiar estados sin uso (excepto los protegidos)
                protected_estados = {
                    'diseno',
                    'pendiente-de-aprobacion',
                    'pendiente-de-cliche',
                    'pendiente-de-impresion',
                    'pendiente-post-impresion',
                    'finalizado',
                    'parado',
                    'cancelado',
                }
                
                for estado in estados_sin_uso:
                    slug = slugify_estado_py(estado.get('valor', ''))
                    
                    # No eliminar estados protegidos
                    if slug in protected_estados:
                        print(f"\n  Saltando estado protegido: {estado.get('valor')} (ID: {estado['_id']})")
                        continue
                    
                    print(f"\n  Eliminando estado sin uso: {estado.get('valor')} (ID: {estado['_id']})")
                    col_config.delete_one({'_id': estado['_id']})
                    cleaned += 1
                
                print(f"\n\n✓ LIMPIEZA COMPLETADA")
                print(f"  Total de items eliminados: {cleaned}")
            else:
                print("\nLimpieza cancelada.")
        
        print("\n")
        
    except Exception as e:
        print(f"\n✗ Error durante el análisis: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        client.close()

if __name__ == '__main__':
    main()
