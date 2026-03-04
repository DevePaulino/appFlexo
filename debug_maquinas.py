#!/usr/bin/env python3
"""
Debug script to check maquinas state and trabajos_en_cola counts
"""
import requests
import json

BASE_URL = "http://localhost:8080"
HEADERS = {
    "X-Empresa-Id": "1",
    "X-User-Id": "admin",
    "X-Role": "admin"
}

def main():
    print("\n" + "="*80)
    print("DEBUGGING MAQUINAS AND TRABAJOS_EN_COLA")
    print("="*80 + "\n")
    
    # 1. Get all machines
    print("1. Fetching /api/maquinas...")
    try:
        res = requests.get(f"{BASE_URL}/api/maquinas", headers=HEADERS, timeout=5)
        if res.status_code != 200:
            print(f"   ERROR: status {res.status_code}")
            print(f"   Response: {res.text[:500]}")
            return
        
        maquinas_data = res.json()
        maquinas = maquinas_data.get('maquinas', [])
        print(f"   ✓ Found {len(maquinas)} machines\n")
        
        # Display each machine
        for i, maq in enumerate(maquinas, 1):
            maq_id = maq.get('id')
            maq_nombre = maq.get('nombre', 'Unknown')
            trabajos_en_cola = maq.get('trabajos_en_cola', 'NOT_SET')
            
            print(f"   Machine {i}:")
            print(f"      ID: {maq_id}")
            print(f"      Nombre: {maq_nombre}")
            print(f"      trabajos_en_cola: {trabajos_en_cola}")
            
            # Try to get production list for this machine
            print(f"      Fetching /api/produccion?maquina={maq_id}...")
            try:
                prod_res = requests.get(
                    f"{BASE_URL}/api/produccion",
                    params={"maquina": maq_id, "page": 1, "page_size": 100},
                    headers=HEADERS,
                    timeout=5
                )
                if prod_res.status_code == 200:
                    prod_data = prod_res.json()
                    trabajos_list = prod_data.get('trabajos', [])
                    total = prod_data.get('total', len(trabajos_list))
                    print(f"         ✓ API returns total={total}, got {len(trabajos_list)} trabajos")
                    
                    # Show trabaljos states
                    states = {}
                    for t in trabajos_list:
                        estado = t.get('estado', 'unknown')
                        states[estado] = states.get(estado, 0) + 1
                    if states:
                        print(f"         States: {states}")
                else:
                    print(f"         ERROR: status {prod_res.status_code}")
            except Exception as e:
                print(f"         ERROR: {e}")
            
            # Test delete if trabajos_en_cola == 0
            if trabajos_en_cola == 0:
                print(f"      Attempting DELETE (maquina has 0 trabajos)...")
                try:
                    del_res = requests.delete(
                        f"{BASE_URL}/api/maquinas/{maq_id}",
                        headers=HEADERS,
                        timeout=5
                    )
                    if del_res.status_code == 200:
                        print(f"         ✓ DELETE succeeded!")
                    else:
                        print(f"         ✗ DELETE failed: status {del_res.status_code}")
                        print(f"         Response: {del_res.text[:300]}")
                except Exception as e:
                    print(f"         ERROR: {e}")
            print()
    
    except Exception as e:
        print(f"   ERROR fetching /api/maquinas: {e}")
        return
    
    print("\n" + "="*80)
    print("DIAGNOSIS COMPLETE")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
