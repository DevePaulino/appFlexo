#!/usr/bin/env python3
"""Dump all collections from a MongoDB database into JSON files under backups/mongodumps/<timestamp>/

This is a fallback when `mongodump` isn't available.
"""
import os
import sys
from datetime import datetime
import json
from pymongo import MongoClient
from bson.json_util import dumps


def get_mongo_uri():
    return os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')


def main():
    uri = get_mongo_uri()
    db_name = os.environ.get('MONGO_DBNAME', 'printforgepro')
    ts = datetime.utcnow().strftime('%Y%m%d_%H%M%SZ')
    out_dir = os.path.join('backups', 'mongodumps', ts)
    os.makedirs(out_dir, exist_ok=True)

    print('Connecting to', uri)
    client = MongoClient(uri)
    db = client[db_name]

    cols = db.list_collection_names()
    if not cols:
        print('No collections found in', db_name)

    for col in cols:
        docs = list(db[col].find({}))
        out_path = os.path.join(out_dir, f'{col}.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            # Use bson.json_util.dumps to preserve ObjectId/ISODate
            f.write(dumps(docs, indent=2))
        print(f'Wrote {len(docs)} docs to {out_path}')

    print('Dump completed ->', out_dir)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('ERROR:', e, file=sys.stderr)
        sys.exit(2)
