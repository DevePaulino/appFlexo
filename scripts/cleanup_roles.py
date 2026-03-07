#!/usr/bin/env python3
"""
Script para limpiar roles duplicados y sin uso

Funcionalidades:
1. Encuentra y reporta roles duplicados
2. Encuentra roles sin usar por usuarios
3. Opcionalmente elimina duplicados y roles sin usar
4. Protege roles del sistema (administrador, root, operario, etc.)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
from pymongo import MongoClient
from bson import ObjectId

# Configuración de MongoDB
MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
MONGO_DB = os.environ.get('MONGODB_DB', 'impresion_app')

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
    """Ejecuta la limpieza de roles"""
    
    # Conectar a MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[MONGO_DB]
        print(f"✓ Conectado a MongoDB: {MONGO_DB}")
    except Exception as e:
        print(f"✗ Error conectando a MongoDB: {e}")
        sys.exit(1)
    
    # Configuración de empresa (usar 0 para global o 1 para primera empresa)
    empresa_id = 0
    
    # Roles protegidos del sistema
    PROTECTED_ROLES = {
        'administrador',
        'root',
        'operario',
        'comercial',
        'diseno',
        'impresion',
        'post-impresion',
    }
    
    try:
        # Colecciones relevantes
        col_config = db[f'empresa_{empresa_id}_config_opciones']
        col_usuarios = db[f'empresa_{empresa_id}_usuarios']
        
        print("\n" + "="*70)
        print("ANÁLISIS DE ROLES")
        print("="*70)
        
        # 1. Encontrar duplicados
        print("\n1. BUSCANDO ROLES DUPLICADOS...")
        roles = list(col_config.find({'categoria': 'roles'}))
        
        roles_slugs = {}
        for rol in roles:
            slug = slugify_estado(rol.get('valor', ''))
            if slug not in roles_slugs:
                roles_slugs[slug] = []
            roles_slugs[slug].append(rol)
        
        duplicados = {slug: items for slug, items in roles_slugs.items() if len(items) > 1}
        
        if duplicados:
            print(f"\n⚠ ENCONTRADOS {len(duplicados)} ROLES CON DUPLICADOS:\n")
            for slug, items in duplicados.items():
                print(f"  Slug: '{slug}'")
                for item in items:
                    count = col_usuarios.count_documents({'rol': slug})
                    internal = item.get('internal', False)
                    print(f"    - ID: {item['_id']}")
                    print(f"      Valor: {item.get('valor', 'N/A')}")
                    print(f"      Orden: {item.get('orden', 'N/A')}")
                    print(f"      Internal: {internal}")
                    print(f"      En uso: {count} usuario(s)")
        else:
            print("\n✓ No se encontraron roles duplicados")
        
        # 2. Encontrar roles sin uso
        print("\n\n2. BUSCANDO ROLES SIN USO (no protegidos)...")
        roles_sin_uso = []
        
        for rol in roles:
            slug = slugify_estado(rol.get('valor', ''))
            internal = rol.get('internal', False)
            
            # Saltar roles protegidos e internos
            if internal or slug in PROTECTED_ROLES:
                continue
            
            count = col_usuarios.count_documents({'rol': slug})
            
            if count == 0:
                roles_sin_uso.append(rol)
        
        if roles_sin_uso:
            print(f"\n⚠ ENCONTRADOS {len(roles_sin_uso)} ROLES SIN USO:\n")
            for rol in roles_sin_uso:
                print(f"  - ID: {rol['_id']}")
                print(f"    Valor: {rol.get('valor', 'N/A')}")
                print(f"    Orden: {rol.get('orden', 'N/A')}")
                print(f"    Creado: {rol.get('fecha_creacion', 'N/A')}\n")
        else:
            print("\n✓ No se encontraron roles sin uso (fuera de protegidos)")
        
        # 3. Estadísticas
        print("\n\n" + "="*70)
        print("RESUMEN")
        print("="*70)
        print(f"\nTotal de roles: {len(roles)}")
        
        total_protected = sum(1 for r in roles if r.get('internal', False) or slugify_estado(r.get('valor', '')) in PROTECTED_ROLES)
        print(f"Roles protegidos: {total_protected}")
        
        print(f"Roles con duplicados: {len(duplicados)}")
        print(f"Roles sin uso (no protegidos): {len(roles_sin_uso)}")
        
        total_a_limpiar = sum(len(items)-1 for items in duplicados.values()) + len(roles_sin_uso)
        print(f"\nTotal de items a eliminar: {total_a_limpiar}")
        
        # 4. Preguntar si desea limpiar
        if total_a_limpiar > 0:
            print("\n" + "="*70)
            response = input("\n¿Deseas proceder con la limpieza? (s/n): ").strip().lower()
            
            if response == 's':
                cleaned = 0
                
                # Limpiar duplicados (mantener solo el primero)
                for slug, items in sorted(duplicados.items()):
                    items_sorted = sorted(items, key=lambda x: x.get('orden', 999))
                    # Mantener el primero (orden más bajo)
                    for item_to_delete in items_sorted[1:]:
                        print(f"\n  Eliminando rol duplicado: {item_to_delete.get('valor')} (ID: {item_to_delete['_id']})")
                        col_config.delete_one({'_id': item_to_delete['_id']})
                        cleaned += 1
                
                # Limpiar roles sin uso
                for rol in roles_sin_uso:
                    slug = slugify_estado(rol.get('valor', ''))
                    print(f"\n  Eliminando rol sin uso: {rol.get('valor')} (ID: {rol['_id']})")
                    col_config.delete_one({'_id': rol['_id']})
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
