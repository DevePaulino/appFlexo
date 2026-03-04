from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['printforgepro']

print("=== TRABAJOS POR MAQUINA ===\n")

maquinas = list(db['maquinas'].find({'empresa_id': 1}))
for maq in maquinas:
    maq_name = maq.get('nombre')
    maq_oid_str = str(maq.get('_id'))
    
    trajs = list(db['pedido_orden'].find({'maquina_id': maq_oid_str, 'empresa_id': 1}))
    contador = 0
    print(f"{maq_name}:")
    for t in trajs:
        trabajo_id = t.get('trabajo_id')
        pedido = db['pedidos'].find_one({'trabajo_id': trabajo_id})
        if pedido:
            estado = pedido.get('estado', 'N/A')
            es_prod = estado not in ['Diseño','diseno','Pendiente de Aprobación','Pendiente de Cliché','parado','Cancelado','Finalizado']
            if es_prod:
                contador += 1
            marker = "✓" if es_prod else "✗"
            print(f"  {marker} {trabajo_id}: {estado}")
    
    print(f"  Total: {contador}\n")
