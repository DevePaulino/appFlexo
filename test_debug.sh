#!/bin/bash

echo "🔍 Verificando datos..."
echo ""

echo "1️⃣ Consultando presupuestos existentes:"
curl -s http://localhost:8080/api/presupuestos | python3 -m json.tool

echo ""
echo "2️⃣ Generando datos de prueba..."
curl -s -X POST http://localhost:8080/api/test-data | python3 -m json.tool

echo ""
echo "3️⃣ Consultando presupuestos después de generar:"
curl -s http://localhost:8080/api/presupuestos | python3 -m json.tool

echo ""
echo "✅ Verificación completada"
