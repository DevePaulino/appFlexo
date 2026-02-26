#!/usr/bin/env python3
import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'produccion.db')

def crear_datos_prueba():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Datos de trabajos
    trabajos = [
        ('Flexo Labelmaker', 'ACME Inc', 'REF-001-FLEX', 'diseno', '2026-02-24', '2026-02-26', 0),
        ('Impresión Digital', 'TechPrint SL', 'REF-002-DIGIT', 'pendiente-de-impresion', '2026-02-23', '2026-02-27', 0),
        ('Troquel Especial', 'PrintShop Pro', 'REF-003-TROQUE', 'pendiente-post-impresion', '2026-02-22', '2026-02-28', 2),
        ('Acabado Premium', 'LuxePrint Ltd', 'REF-004-ACABA', 'pendiente-de-aprobacion', '2026-02-24', '2026-03-01', 0),
        ('Serie Limitada', 'DesignCo', 'REF-005-LIMIT', 'finalizado', '2026-02-20', '2026-02-25', 0),
    ]
    
    for nombre, cliente, referencia, estado, fecha_pedido, fecha_entrega, dias_retraso in trabajos:
        try:
            c.execute('''INSERT INTO trabajos 
                        (nombre, cliente, referencia, estado, fecha_pedido, fecha_entrega, dias_retraso)
                        VALUES (?, ?, ?, ?, ?, ?, ?)''',
                     (nombre, cliente, referencia, estado, fecha_pedido, fecha_entrega, dias_retraso))
        except sqlite3.IntegrityError:
            print(f"Trabajo {referencia} ya existe, saltando...")
    
    conn.commit()
    
    # Ahora crear presupuestos para cada trabajo
    c.execute('SELECT id, nombre, cliente, referencia FROM trabajos')
    trabajos = c.fetchall()
    
    for trabajo_id, nombre, cliente, referencia in trabajos:
        # Crear presupuesto
        numero_presupuesto = f'PRESUP-{trabajo_id:03d}'
        fecha_presupuesto = datetime.now().isoformat()
        
        # Datos completos del presupuesto (como JSON)
        datos_json = {
            'cliente': cliente,
            'vendedor': 'Oscar Sánchez',
            'formato': '210x297mm',
            'maquina': 'Nilpeter FA',
            'material': 'Papel couché 250g',
            'acabado': 'Mate',
            'tirada': 5000,
            'tintas': 4,
            'troquel': 'Sí',
            'observaciones': f'Presupuesto para {nombre}'
        }
        
        try:
            c.execute('''INSERT INTO presupuestos 
                        (trabajo_id, numero_presupuesto, fecha_presupuesto, aprobado, referencia, datos_json)
                        VALUES (?, ?, ?, ?, ?, ?)''',
                     (trabajo_id, numero_presupuesto, fecha_presupuesto, 1, referencia, json.dumps(datos_json)))
        except sqlite3.IntegrityError:
            print(f"Presupuesto para trabajo {trabajo_id} ya existe, saltando...")
    
    # Crear pedidos para algunos trabajos (los que tienen presupuesto aprobado)
    c.execute('SELECT id, trabajo_id, referencia FROM presupuestos WHERE aprobado = 1')
    presupuestos = c.fetchall()
    
    for presupuesto_id, trabajo_id, referencia in presupuestos:
        # Obtener datos del presupuesto
        c.execute('SELECT datos_json FROM presupuestos WHERE id = ?', (presupuesto_id,))
        datos_json_row = c.fetchone()
        
        numero_pedido = f'PED-{trabajo_id:03d}'
        fecha_pedido = datetime.now().isoformat()
        
        try:
            c.execute('''INSERT INTO pedidos 
                        (trabajo_id, numero_pedido, fecha_pedido, referencia, datos_presupuesto)
                        VALUES (?, ?, ?, ?, ?)''',
                     (trabajo_id, numero_pedido, fecha_pedido, referencia, datos_json_row[0]))
        except sqlite3.IntegrityError:
            print(f"Pedido para trabajo {trabajo_id} ya existe, saltando...")
    
    conn.commit()
    
    # Mostrar resumen
    c.execute('SELECT COUNT(*) FROM trabajos')
    num_trabajos = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM presupuestos')
    num_presupuestos = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM pedidos')
    num_pedidos = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM maquinas')
    num_maquinas = c.fetchone()[0]
    
    conn.close()
    
    print(f'✓ Datos de prueba creados exitosamente!')
    print(f'  Trabajos: {num_trabajos}')
    print(f'  Presupuestos: {num_presupuestos}')
    print(f'  Pedidos: {num_pedidos}')
    print(f'  Máquinas: {num_maquinas}')

if __name__ == '__main__':
    crear_datos_prueba()
