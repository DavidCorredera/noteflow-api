# Teoría del Backend: NoteFlow

## 1. El patrón Cliente-Servidor y Por qué necesitamos un backend
Una app móvil nunca debe conectarse directamente a una base de datos. Si el *connection string* estuviese embebido en la app, cualquiera podría descompilarla y tener acceso total a los datos.
- **Cliente:** La app móvil (interfaz de usuario).
- **Servidor (API):** Actúa como guardián. Valida los datos entrantes y verifica los permisos.
- **Base de Datos:** PostgreSQL, donde reside la información real.

## 2. API REST y Métodos HTTP
Una API REST permite al cliente comunicarse con el servidor mediante peticiones HTTP, mapeando operaciones de datos:
- **GET:** Leer datos.
- **POST:** Crear datos.
- **PATCH:** Modificar datos parcialmente.
- **DELETE:** Eliminar datos.

## 3. Códigos de Estado HTTP
- **200 OK:** La petición se ha completado con éxito.
- **201 Created:** Se ha creado un recurso exitosamente.
- **400 Bad Request:** Los datos enviados por el cliente son inválidos.
- **401 Unauthorized:** El cliente no está autenticado.
- **404 Not Found:** El recurso solicitado no existe.
- **500 Internal Server Error:** Error en el servidor. *Nota: Nunca se debe devolver el error real de la base de datos al cliente por seguridad.*

---

## 4. Bases de datos relacionales
Las bases de datos relacionales organizan los datos en tablas con filas y columnas. Cada tabla representa una entidad del dominio y se conectan mediante claves.

- **ACID:** Propiedades de Atomicidad, Consistencia, Aislamiento y Durabilidad. Garantizan que las transacciones son fiables. Ejemplo: sin atomicidad, podrías crear una nota sin sus ítems asociados, dejando datos huérfanos e inconsistentes.
- **Primary Key (PK):** Identificador único. En NoteFlow usamos `UUID` en lugar de enteros porque permite que el cliente móvil genere el ID offline y lo sincronice después sin conflictos.
- **Foreign Key (FK):** Columna que referencia la PK de otra tabla. Usamos `ON DELETE CASCADE` para que, si borramos una nota, todos sus checklist items y tags asociados se borren automáticamente.
- **DDL vs DML:** 
  - **DDL** (Data Definition Language): Define estructura (`CREATE`, `ALTER`, `DROP`).
  - **DML** (Data Manipulation Language): Manipula datos (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

## 5. Diagrama Entidad-Relación de NoteFlow

El sistema consta de 3 tablas principales:
1. **notes**: Tabla principal. Contiene `id`, `title`, `content`, `type`, `color`, `created_at` y `updated_at`.
2. **checklist_items**: Relacionada con `notes` (Muchos a Uno) a través de `note_id`. Contiene el estado `is_completed` y el texto.
3. **note_tags**: Relacionada con `notes` (Muchos a Uno) a través de `note_id`. Contiene el texto del `tag`.