#!/usr/bin/env python3
"""Normalize role `valor` in `config_opciones` collection.

Usage:
  python3 scripts/normalize_roles.py [--mongo-uri URI] [--db DBNAME] [--apply] [--backup]

By default runs in dry-run mode and prints proposed updates. Use --apply to perform updates.
If --backup is provided, a JSON backup of affected docs is written before applying.
"""
import argparse
import json
import os
import datetime
from pymongo import MongoClient


def capitalize_first(s):
    if not s:
        return s
    return s[0].upper() + s[1:]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--mongo-uri', default=os.environ.get('MONGO_URI', 'mongodb://localhost:27017'))
    p.add_argument('--db', default=os.environ.get('MONGO_DB', 'printforgepro'))
    p.add_argument('--apply', action='store_true')
    p.add_argument('--backup', action='store_true')
    args = p.parse_args()

    client = MongoClient(args.mongo_uri)
    db = client[args.db]
    col = db['config_opciones']

    cursor = col.find({'categoria': 'roles'})
    total = 0
    to_update = []
    conflicts = []

    for doc in cursor:
        total += 1
        old = doc.get('valor') or ''
        new = capitalize_first(str(old).strip())
        if new == old:
            continue

        empresa_id = doc.get('empresa_id') if 'empresa_id' in doc else None

        # check for conflicts (another doc with same empresa_id & categoria & valor == new)
        q = {'categoria': 'roles', 'valor': new}
        if empresa_id is None:
            q['empresa_id'] = {'$exists': False}
        else:
            q['empresa_id'] = empresa_id

        existing = col.find_one(q)
        if existing and str(existing.get('_id')) != str(doc.get('_id')):
            conflicts.append({'_id': str(doc.get('_id')), 'old': old, 'new': new, 'conflict_with': str(existing.get('_id'))})
            continue

        to_update.append({'_id': str(doc.get('_id')), 'old': old, 'new': new, 'empresa_id': empresa_id})

    print('Total role docs found:', total)
    print('Planned updates:', len(to_update))
    if conflicts:
        print('Conflicts detected (skipped):', len(conflicts))
        for c in conflicts:
            print(' -', c)

    if not to_update:
        print('Nothing to update.')
        return

    if args.backup:
        ts = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        backup_path = os.path.join('scripts', f'config_opciones_roles_backup_{ts}.json')
        docs = list(col.find({'_id': {'$in': [__import__('bson').ObjectId(d['_id']) for d in to_update]}}))
        # convert ObjectId to str for JSON
        for d in docs:
            d['id'] = str(d.get('_id'))
            del d['_id']
        with open(backup_path, 'w', encoding='utf-8') as fh:
            json.dump(docs, fh, ensure_ascii=False, indent=2)
        print('Backup written to', backup_path)

    # Show planned changes
    for u in to_update:
        print(f"Will update {u['_id']}: '{u['old']}' -> '{u['new']}' (empresa_id={u['empresa_id']})")

    if not args.apply:
        print('\nDry-run mode. Re-run with --apply to perform updates.')
        return

    # Apply updates
    updated = 0
    for u in to_update:
        oid = __import__('bson').ObjectId(u['_id'])
        res = col.update_one({'_id': oid}, {'$set': {'valor': u['new']}})
        if res.modified_count:
            updated += 1

    print('Applied updates:', updated)


if __name__ == '__main__':
    main()
