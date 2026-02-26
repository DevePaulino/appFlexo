#!/bin/bash

echo "🧹 Limpiando datos antiguos..."
rm -f produccion.db
echo "✅ Base de datos eliminada"

echo ""
echo "🚀 Iniciando servidor backend..."
echo "   Presiona Ctrl+C para detener"
echo ""

python3 app.py
