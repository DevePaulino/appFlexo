#!/usr/bin/env python3
from pymongo import MongoClient

def main():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['printforgepro']
    for d in db['clientes'].find({'origen':'seed_from_pedidos'}):
        print(d.get('cliente_id'), '|', d.get('nombre'), '| dir:', d.get('direccion_fiscal'), '| cif:', d.get('cif'))

if __name__ == '__main__':
    main()
