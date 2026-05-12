# Seguridad en la API

## 1. SQL Injection (Inyección SQL)
La inyección SQL ocurre cuando la entrada del usuario se concatena directamente en una consulta. Un atacante puede manipular la consulta enviando código malicioso en lugar de datos normales para acceder a información sensible o destruir tablas.

Ejemplo Vulnerable (Concatenación directa):
const title = req.body.title; // El usuario envía: "'; DROP TABLE notes;--"
const query = "SELECT * FROM notes WHERE title = '" + title + "'";
// Resultado desastroso: La base de datos ejecuta el DROP TABLE.

Solución: Consultas Parametrizadas
Las consultas parametrizadas envían la estructura de la consulta y los valores por separado. La base de datos trata los parámetros estrictamente como datos, nunca como código:

// Seguro: consulta parametrizada
const query = "SELECT * FROM notes WHERE title = $1";
await db.query(query, [req.body.title]);

## 2. Variables de Entorno
El connection string (URL de conexión) de la base de datos nunca debe aparecer en el código fuente. Se debe usar un archivo .env.local (excluido en .gitignore) para que las credenciales no se suban al repositorio público.