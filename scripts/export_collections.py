#!/usr/bin/env python3
import argparse
import os
import json
from bson import json_util
from pymongo import MongoClient


def export_collection(db, name, out_dir):
    path = os.path.join(out_dir, f"{name}.json")
    with open(path, "w", encoding="utf-8") as f:
        cursor = db[name].find()
        for doc in cursor:
            f.write(json_util.dumps(doc))
            f.write("\n")
    print(f"Exported {name} -> {path}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--uri", default="mongodb://localhost:27017/printforgepro")
    p.add_argument("--collections", default="trabajo_orden,pedidos,trabajos")
    p.add_argument("--out", default="backups/migration_exports")
    args = p.parse_args()

    os.makedirs(args.out, exist_ok=True)
    client = MongoClient(args.uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = None
    if db is None:
        db = client['printforgepro']

    for col in args.collections.split(','):
        export_collection(db, col.strip(), args.out)


if __name__ == '__main__':
    main()
