# Migración completada

Toda la lógica del backend ha sido migrada a MongoDB. SQLite y los archivos .db ya no son necesarios.

Puedes eliminar los archivos .db y limpiar cualquier referencia a SQLite.

- Si encuentras `import sqlite3` o `DB_PATH` en el código, puedes borrarlos.
- Todos los endpoints y helpers usan ahora MongoDB.
