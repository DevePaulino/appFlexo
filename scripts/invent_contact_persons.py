#!/usr/bin/env python3
from pymongo import MongoClient
from datetime import datetime
import random, re, json

def slugify(name):
    s = name.lower()
    s = s.replace('ñ','n')
    s = re.sub(r'[^a-z0-9]+','', s)
    return s[:30]

def main():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['printforgepro']
    col = db['clientes']

    rows = list(col.find({'empresa_id':1}))
    if not rows:
        print(json.dumps({'updated_count':0, 'updated':[]}, ensure_ascii=False))
        return

    puestos = ['Responsable de Compras','Gerente','Director Comercial','Administrativo','Jefe de Producción']
    updated = []

    for r in rows:
        _id = r.get('_id')
        nombre = r.get('nombre') or 'Cliente'
        persona = r.get('persona_contacto') or r.get('contacto') or ''

        # deterministic generation based on _id
        seed = str(_id)
        random.seed(seed)

        if persona:
            parts = persona.split()
            first = parts[0]
            last = parts[-1] if len(parts)>1 else 'Perez'
        else:
            first = random.choice(['Luis','Ana','Marta','Diego','Sonia','Raul'])
            last = random.choice(['Gonzalez','Martinez','Sanchez','Ruiz','Diaz'])
            persona = f"{first} {last}"

        domain = slugify(nombre) or 'cliente'
        contacto_nombre = persona
        contacto_email = f"{first.lower()}.{last.lower()}@{domain}.com"
        contacto_telefono = random.choice(['6','7']) + ''.join(str(random.randint(0,9)) for _ in range(8))
        contacto_puesto = random.choice(puestos)

        update_doc = {
            'contacto_nombre': contacto_nombre,
            'contacto_email': contacto_email,
            'contacto_telefono': contacto_telefono,
            'contacto_puesto': contacto_puesto,
            'updated_at': datetime.utcnow()
        }

        col.update_one({'_id': _id}, {'$set': update_doc})
        updated.append({'_id': str(_id), 'contacto_nombre': contacto_nombre, 'contacto_email': contacto_email, 'contacto_telefono': contacto_telefono, 'contacto_puesto': contacto_puesto})

    print(json.dumps({'updated_count': len(updated), 'updated': updated}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
