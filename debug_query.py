from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']

stm = db['maquinas'].find_one({'nombre': 'Stress Test Machine'})
print("Stress Test Machine:")
print(f"  id: {stm.get('id')}")
print(f"  _id: {stm.get('_id')}")

query_terms = []
if stm.get('id') is not None:
    query_terms.append({'maquina_id': stm.get('id'), 'empresa_id': 1})
if stm.get('_id') is not None:
    query_terms.append({'maquina_id': stm.get('_id'), 'empresa_id': 1})
    query_terms.append({'maquina_id': str(stm.get('_id')), 'empresa_id': 1})

if query_terms:
    query = {'$or': query_terms} if len(query_terms) > 1 else query_terms[0]
else:
    query = {'maquina_id': stm.get('id'), 'empresa_id': 1}

print(f"\nQuery: {query}")

ordenes = list(db['pedido_orden'].find(query))
print(f"\nOrdenes encontradas: {len(ordenes)}")
for o in ordenes:
    print(f"  {o.get('trabajo_id')}: maquina_id={o.get('maquina_id')}")
