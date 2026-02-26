#!/usr/bin/env python3
"""
Script para generar datos de prueba en la base de datos
Uso: python3 generar_datos_prueba.py
"""

import requests
import sys
import json

def check_server():
    """Verifica que el servidor esté disponible"""
    try:
        response = requests.get('http://localhost:8080/api/debug/info', timeout=2)
        if response.status_code == 200:
            return True, response.json()
        return False, None
    except:
        return False, None

def generar_datos_prueba():
    """Genera presupuestos de prueba llamando al endpoint"""
    
    print("=" * 60)
    print("🧪 GENERADOR DE DATOS DE PRUEBA")
    print("=" * 60)
    
    # Verificar servidor
    print("\n📡 Verificando servidor...")
    servidor_ok, info = check_server()
    
    if not servidor_ok:
        print("❌ Error de conexión. ¿El servidor backend está corriendo?")
        print("   Inicia el servidor con: python3 app.py")
        return False
    
    print("✅ Servidor disponible")
    print(f"   - Trabajos actuales: {info['trabajos']}")
    print(f"   - Presupuestos actuales: {info['presupuestos']}")
    print(f"   - Pedidos actuales: {info['pedidos']}")
    
    if info['presupuestos'] > 0:
        print("\n⚠️  Ya hay presupuestos en la BD. Los nuevos se agregarán.")
    
    # Generar datos
    print("\n📝 Generando datos de prueba...")
    try:
        response = requests.post('http://localhost:8080/api/test-data', timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['mensaje']}")
            print(f"📊 Total insertado: {data['cantidad']} presupuestos")
            
            # Verificar nuevamente
            print("\n✔️  Verificando inserción...")
            _, info_after = check_server()
            print(f"   - Trabajos ahora: {info_after['trabajos']}")
            print(f"   - Presupuestos ahora: {info_after['presupuestos']}")
            print(f"   - Pedidos ahora: {info_after['pedidos']}")
            
            if info_after['presupuestos'] > info['presupuestos']:
                print("\n🎉 ¡Datos generados correctamente!")
                print("\n👉 Próximos pasos:")
                print("   1. Abre la app en http://localhost:19006")
                print("   2. Ve a la pestaña 'Presupuestos'")
                print("   3. Presiona el botón 'Recargar'")
                print("   4. Deberías ver los presupuestos")
                return True
            else:
                print("\n⚠️  No se detectó cambio en presupuestos")
                return False
        else:
            print(f"❌ Error {response.status_code}")
            print(response.json())
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout: el servidor tardó demasiado en responder")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print()
    exito = generar_datos_prueba()
    print()
    sys.exit(0 if exito else 1)

