#!/usr/bin/env python3
"""
Script para limpiar valores vacíos en config_opciones
Elimina registros de materiales, acabados y tintas_especiales que no tengan valor
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, '/Users/osanchez/Vista-printingConditions/PrintForgePro')

from app import get_empresa_collection

def clean_empty_values():
    """Eliminar valores sin 'valor' de las categorías especificadas"""
    
    categories = ['materiales', 'acabados', 'tintas_especiales']
    
    for category in categories:
        col = get_empresa_collection('config_opciones', 0)
        
        # Buscar documentos vacíos
        empty_docs = list(col.find({
            'categoria': category,
            '$or': [
                {'valor': {'$exists': False}},
                {'valor': ''},
                {'valor': None}
            ]
        }))
        
        if empty_docs:
            print(f"\n📌 {category.upper()}: Encontrados {len(empty_docs)} registros vacíos")
            for doc in empty_docs:
                print(f"   - ID: {doc['_id']}, valor: {doc.get('valor', 'SIN VALOR')}, label: {doc.get('label', 'SIN LABEL')}")
            
            # Eliminar los documentos vacíos
            result = col.delete_many({
                'categoria': category,
                '$or': [
                    {'valor': {'$exists': False}},
                    {'valor': ''},
                    {'valor': None}
                ]
            })
            
            print(f"   ✅ Eliminados: {result.deleted_count} registros")
        else:
            print(f"\n✅ {category.upper()}: Sin registros vacíos")

if __name__ == '__main__':
    print("🧹 Iniciando limpieza de valores vacíos...\n")
    clean_empty_values()
    print("\n✅ Limpieza completada")
