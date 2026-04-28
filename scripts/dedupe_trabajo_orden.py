#!/usr/bin/env python3
import os
import sys
import json
from datetime import datetime
from pymongo import MongoClient
from bson import json_util, ObjectId


def dump_backup(db, out_path):
    col = db['trabajo_orden']
    with open(out_path, 'w', encoding='utf-8') as f:
        for doc in col.find():
            f.write(json_util.dumps(doc))
            f.write('\n')


def normalize_trabajo_id(db):
    col = db['trabajo_orden']
    # Find docs where trabajo_id exists and is not a string
    cursor = col.find({'trabajo_id': {'$exists': True, '$ne': None}})
    updated = 0
    for d in cursor:
        t = d.get('trabajo_id')
        if isinstance(t, str):
            continue
        new_val = str(t)
        try:
            col.update_one({'_id': d['_id']}, {'$set': {'trabajo_id': new_val}})
            updated += 1
        except Exception as e:
            print('Error normalizing', d['_id'], e)
    return updated


def find_duplicate_groups(db, limit=1000):
    col = db['trabajo_orden']
    pipeline = [
        {'$group': {
            '_id': {'empresa_id': '$empresa_id', 'maquina_id': '$maquina_id', 'trabajo_id': '$trabajo_id'},
            'count': {'$sum': 1},
            'ids': {'$push': '$_id'}
        }},
        {'$match': {'count': {'$gt': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': limit}
    ]
    return list(col.aggregate(pipeline, allowDiskUse=True))


def apply_dedupe(db, groups):
    col = db['trabajo_orden']
    deleted = []
    kept = []
    for g in groups:
        ids = g.get('ids') or []
        if not ids or len(ids) <= 1:
            continue
        # Keep the earliest ObjectId (smallest)
        ids_sorted = sorted(ids, key=lambda x: (str(x)))
        keep = ids_sorted[0]
        to_del = ids_sorted[1:]
        res = col.delete_many({'_id': {'$in': to_del}})
        kept.append(str(keep))
        deleted.extend([str(x) for x in to_del])
    return kept, deleted


def create_unique_index(db):
    col = db['trabajo_orden']
    # create unique composite index on empresa_id + trabajo_id
    try:
        col.create_index([('empresa_id', 1), ('trabajo_id', 1)], unique=True, sparse=True)
        return True
    except Exception as e:
        print('Error creating unique index:', e)
        return False


def main():
    import argparse
    p = argparse.ArgumentParser(description='Dedupe trabajo_orden and create unique index (safe).')
    p.add_argument('--db', default=os.environ.get('MONGO_DBNAME', 'pressmateapp'))
    p.add_argument('--apply', action='store_true', help='Apply changes (otherwise dry-run)')
    p.add_argument('--limit', type=int, default=10000, help='Max duplicate groups to process')
    args = p.parse_args()

    client = MongoClient(os.environ.get('MONGO_URI', 'mongodb://localhost:27017/'))
    db = client[args.db]

    ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    backup_dir = os.path.join('backups', 'agent')
    os.makedirs(backup_dir, exist_ok=True)
    backup_path = os.path.join(backup_dir, f'trabajo_orden_backup_{ts}.ndjson')

    print('Backing up trabajo_orden to', backup_path)
    dump_backup(db, backup_path)
    print('Backup complete')

    print('Normalizing trabajo_id to string where needed...')
    updated = normalize_trabajo_id(db)
    print('Normalized', updated, 'documents')

    print('Finding duplicate groups...')
    groups = find_duplicate_groups(db, limit=args.limit)
    print('Duplicate groups found:', len(groups))

    report = {
        'timestamp': ts,
        'db': args.db,
        'backup': backup_path,
        'duplicate_groups_count': len(groups),
        'groups_sample': []
    }

    for g in groups[:50]:
        report['groups_sample'].append({
            'empresa_id': g['_id'].get('empresa_id'),
            'maquina_id': g['_id'].get('maquina_id'),
            'trabajo_id': g['_id'].get('trabajo_id'),
            'count': g.get('count'),
            'ids_sample': [str(x) for x in (g.get('ids') or [])[:10]]
        })

    report_path = os.path.join(backup_dir, f'dedupe_report_{ts}.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print('Report written to', report_path)

    if not args.apply:
        print('Dry-run complete. To apply dedupe and create index, re-run with --apply')
        return

    print('Applying dedupe: deleting duplicate docs (keeping one per group)')
    kept, deleted = apply_dedupe(db, groups)
    print('Deleted', len(deleted), 'documents; kept', len(kept))

    applied_report = {
        'timestamp': ts,
        'deleted_count': len(deleted),
        'deleted_ids': deleted[:1000],
        'kept_count': len(kept),
        'kept_ids': kept[:1000]
    }
    applied_path = os.path.join(backup_dir, f'dedupe_applied_{ts}.json')
    with open(applied_path, 'w', encoding='utf-8') as f:
        json.dump(applied_report, f, indent=2, ensure_ascii=False)
    print('Applied report written to', applied_path)

    print('Creating unique index on (empresa_id, trabajo_id)')
    ok = create_unique_index(db)
    if ok:
        print('Unique index created successfully')
    else:
        print('Failed to create unique index; check logs')

    print('Done')


if __name__ == '__main__':
    main()
