#!/usr/bin/env python3
"""
Simple script to query the local backend and detect duplicate trabajo ids
in the production queues (excluding estados parado/cancelado/finalizado).
Run with: ./.venv/bin/python scripts/check_production_duplicates.py
"""
import json
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

BASE = 'http://localhost:8080'

def fetch_json(path):
    url = BASE + path
    try:
        req = Request(url)
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except HTTPError as e:
        print(f'HTTP error {e.code} when fetching {url}')
    except URLError as e:
        print(f'URL error {e} when fetching {url}')
    except Exception as e:
        print(f'Error fetching {url}: {e}')
    return None


def normalize_id(t):
    return str(t.get('id') or t.get('trabajo_id') or t.get('_id') or '')


def main():
    mdata = fetch_json('/api/maquinas')
    if not mdata or 'maquinas' not in mdata:
        print('No se pudo obtener máquinas o respuesta inválida')
        return

    maquinas = mdata['maquinas']
    overall_ids = {}
    duplicates_overall = {}

    blocked = {'parado', 'cancelado', 'finalizado'}

    for maq in maquinas:
        mid = maq.get('id')
        print(f'Checking maquina id={mid} nombre="{maq.get("nombre")}"')
        trabajos_path = f'/api/produccion?maquina={mid}&page=1&page_size=1000'
        tdata = fetch_json(trabajos_path)
        trabajos = (tdata or {}).get('trabajos', [])
        # filter
        trabajos = [t for t in trabajos if (t.get('estado') not in blocked)]

        ids = {}
        duplicates = {}
        for t in trabajos:
            nid = normalize_id(t)
            if not nid:
                print('  - Trabajo sin id encontrado:', t)
                continue
            if nid in ids:
                duplicates.setdefault(nid, []).append(t)
            else:
                ids[nid] = t
            # overall
            if nid in overall_ids:
                duplicates_overall.setdefault(nid, []).append((mid, t))
            else:
                overall_ids[nid] = (mid, t)

        if duplicates:
            print(f'  DUPLICADOS en máquina {mid}: {len(duplicates)} ids repetidos')
            for k, vals in duplicates.items():
                print(f'    id {k} aparece {1 + len(vals)} veces (muestra):')
                # show first occurrence + duplicates
                first = ids.get(k)
                print('      - primera:', {k: first.get('nombre') if first else None})
                for v in vals:
                    print('      - dup:', {k: v.get('nombre')})
        else:
            print('  No duplicates in this machine (page=1)')

    if duplicates_overall:
        print('\nDUPLICADOS GLOBALES entre máquinas:')
        for k, entries in duplicates_overall.items():
            first_mid, first_t = overall_ids.get(k)
            print(f'  id {k} en maquina {first_mid} y en {len(entries)} otras apariciones:')
            print('    - primera:', first_t.get('nombre'))
            for mid, t in entries:
                print('    - otra:', f'maquina={mid}', t.get('nombre'))
    else:
        print('\nNo se encontraron duplicados globales entre máquinas (page=1).')

if __name__ == '__main__':
    main()
