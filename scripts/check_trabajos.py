#!/usr/bin/env python3
import argparse
import json
import sys
from urllib import request, parse

BASE = 'http://127.0.0.1:8080'


def get(url):
    try:
        with request.urlopen(url, timeout=10) as r:
            return json.load(r)
    except Exception as e:
        print(f'ERROR fetching {url}: {e}', file=sys.stderr)
        return None


def canonical_machine_id(m):
    for key in ('_id','id','maquina_id','maquina_id_bd'):
        if key in m and m[key]:
            return str(m[key])
    return None


def check_trabajos_for_machine(maquina):
    mid = canonical_machine_id(maquina)
    name = maquina.get('nombre') or maquina.get('maquina') or maquina.get('label') or ''
    if not mid:
        return {'machine': name or '<no-id>', 'machine_id': None, 'error': 'no id found', 'problems': []}
    qname = parse.quote(name)
    url = f"{BASE}/api/produccion?maquina={parse.quote(mid)}&maquina_nombre={qname}"
    data = get(url)
    problems = []
    if not data:
        return {'machine': name, 'machine_id': mid, 'error': 'no response', 'problems': []}
    trabajos = data.get('trabajos') or []
    for t in trabajos:
        issues = []
        # check common fields
        if not t.get('trabajo_id') and not t.get('id'):
            issues.append('missing trabajo_id and id')
        if 'posicion' not in t:
            issues.append('missing posicion')
        if 'estado' not in t:
            issues.append('missing estado')
        dp = t.get('datos_presupuesto') or {}
        if not dp:
            issues.append('missing datos_presupuesto')
        else:
            if not dp.get('maquina_id_bd') and not dp.get('maquina_bd'):
                issues.append('datos_presupuesto missing maquina_id_bd/maquina_bd')
        if issues:
            problems.append({'id': t.get('id') or '<no-id>', 'trabajo_id': t.get('trabajo_id'), 'numero_pedido': t.get('numero_pedido'), 'issues': issues})
    return {'machine': name, 'machine_id': mid, 'count': len(trabajos), 'problems': problems}


def list_trabajos_for_machine(maquina):
    mid = None
    for key in ('_id', 'id', 'maquina_id', 'maquina_id_bd'):
        if key in maquina and maquina[key]:
            mid = str(maquina[key])
            break
    name = maquina.get('nombre') or maquina.get('maquina') or maquina.get('label') or ''
    if not mid:
        return {'machine': name or '<no-id>', 'machine_id': None, 'trabajos': []}
    qname = parse.quote(name)
    url = f"{BASE}/api/produccion?maquina={parse.quote(mid)}&maquina_nombre={qname}"
    data = get(url) or {}
    trabajos = data.get('trabajos') or []
    # normalize fields
    rows = []
    for t in trabajos:
        row = {
            'id': t.get('id'),
            'trabajo_id': t.get('trabajo_id'),
            'numero_pedido': t.get('numero_pedido'),
            'posicion': t.get('posicion'),
            'estado': t.get('estado'),
            'maquina_id_bd': (t.get('datos_presupuesto') or {}).get('maquina_id_bd')
        }
        rows.append(row)
    return {'machine': name, 'machine_id': mid, 'trabajos': rows}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--show-rows', action='store_true', help='List one line per trabajo with id column')
    args = parser.parse_args()

    machines = get(f"{BASE}/api/maquinas")
    if not machines:
        print('ERROR: no machines response', file=sys.stderr)
        sys.exit(2)
    # machines may be dict with 'maquinas' or list
    lst = machines if isinstance(machines, list) else machines.get('maquinas') or machines.get('data') or []
    if args.show_rows:
        # print a header and then tab-separated rows
        for m in lst:
            res = list_trabajos_for_machine(m)
            print(f"--- Máquina: {res['machine']} (id={res['machine_id']}) ---")
            if not res['trabajos']:
                print('(sin trabajos)')
                continue
            # header
            print('id\ttrabajo_id\tnumero_pedido\tposicion\testado\tmaquina_id_bd')
            for r in res['trabajos']:
                print(f"{r.get('id') or ''}\t{r.get('trabajo_id') or ''}\t{r.get('numero_pedido') or ''}\t{r.get('posicion') or ''}\t{r.get('estado') or ''}\t{r.get('maquina_id_bd') or ''}")
    else:
        results = []
        for m in lst:
            res = check_trabajos_for_machine(m)
            results.append(res)
        print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
