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
    db = client['pressmateapp']
    col = db['clientes']

    q = {'origen':'seed_from_pedidos', 'empresa_id': 1}
    rows = list(col.find(q))
    if not rows:
        rows = list(col.find({'empresa_id':1}))

    first_names = ['Carlos','Maria','Lucia','Javier','Ana','Laura','Miguel','Sergio','Pablo','Elena']
    last_names = ['Garcia','Martinez','Lopez','Sanchez','Perez','Gomez','Fernandez','Ruiz','Herrera','Vargas']
    streets = ['Calle Mayor','Avenida de la Industria','Calle del Sol','Plaza de la Constitucion','Calle Nueva','Camino Real','Calle del Comercio']
    provinces = ['Valencia','Madrid','Barcelona','Alicante','Sevilla','Zaragoza','Malaga','Bilbao']
    company_types = ['S.L.','S.A.','S.L.U.','Autonomo']

    updated = []

    for r in rows:
        _id = r.get('_id')
        name = r.get('nombre') or r.get('empresa') or 'Cliente'
        seed = str(_id)
        random.seed(seed)
        slug = slugify(name)

        tipo = random.choice(company_types)
        street = random.choice(streets)
        num = random.randint(1,300)
        cp = str(random.randint(10000,52999))
        provincia = random.choice(provinces)
        ciudad = provincia
        pais = 'España'

        # phones
        prefix = random.choice(['91','93','96','95','98','97','60','61','62','63','64','65','66','67','68','69'])
        rest = ''.join(str(random.randint(0,9)) for _ in range(7))
        telefono = prefix + rest
        movil_prefix = random.choice(['6','7','7','6'])
        movil = movil_prefix + ''.join(str(random.randint(0,9)) for _ in range(8))

        contacto = random.choice(first_names) + ' ' + random.choice(last_names)
        persona_contacto = contacto
        # razon_social: keep original name but append company type if missing
        razon_social = name
        if not any(suffix.lower() in name.lower() for suffix in ['s.l','sl','s.a','sa','slu','s.l.u','autonomo']):
            razon_social = f"{name} {tipo}"
        email = f'info@{slug}.es' if slug else f'contacto{random.randint(1,999)}@example.com'
        web = f'https://www.{slug}.es' if slug else ''

        direccion_fiscal = f"{street} {num}, {cp} {ciudad} ({provincia})"

        notas = r.get('notas_adicionales','')
        notas = (notas + ' ') if notas else ''
        notas += 'Informacion de contacto y fiscal enriquecida automaticamente.'

        update_doc = {
            'telefono': telefono,
            'movil': movil,
            'contacto': contacto,
            'persona_contacto': persona_contacto,
            'razon_social': razon_social,
            'email': email,
            'web': web,
            'direccion_fiscal': direccion_fiscal,
            'codigo_postal': cp,
            'ciudad': ciudad,
            'provincia': provincia,
            'pais': pais,
            'tipo_empresa': tipo,
            'notas_adicionales': notas,
            'updated_at': datetime.utcnow()
        }

        col.update_one({'_id': _id}, {'$set': update_doc})
        updated.append({'_id': str(_id), 'nombre': name, 'email': email, 'telefono': telefono, 'contacto': contacto, 'direccion_fiscal': direccion_fiscal})

    print(json.dumps({'updated_count': len(updated), 'updated': updated}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
