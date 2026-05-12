# 📝 NoteFlow API

NoteFlow API es el motor backend diseñado para gestionar notas, listas de tareas e ideas de forma centralizada. Construido con **Next.js 15**, utiliza una arquitectura de rutas de API modernas y se conecta a una base de datos **PostgreSQL** (vía Neon DB) para ofrecer persistencia de datos escalable y eficiente.

## 🚀 Tecnologías Utilizadas

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Lenguaje:** [TypeScript](https://www.typescript.org/)
*   **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) (Alojado en [Neon](https://neon.tech/))
*   **Validación:** [Zod](https://zod.dev/) (Validación de esquemas con tipado fuerte)
*   **Despliegue:** [Vercel](https://vercel.com/)

---

## 🛠️ Estructura del Proyecto

```text
noteflow-api/
├── app/
│   └── api/                # Endpoints de la API
│       ├── notes/          # Gestión global de notas
│       └── checklist-items/# Gestión de ítems individuales
├── lib/
│   └── db.ts               # Configuración de conexión y cliente Neon
├── sql/
│   └── schema.sql          # Scripts SQL para creación de tablas
└── .env.local              # Variables de entorno (DATABASE_URL)


📡 Endpoints de la API
Notas
GET /api/notes - Obtiene todas las notas incluyendo sus ítems y etiquetas vinculadas mediante JSON Aggregation.

POST /api/notes - Crea una nueva nota (soporta tipos: note, checklist, idea).

PATCH /api/notes/[id] - Actualiza metadatos de una nota existente.

DELETE /api/notes/[id] - Elimina una nota (incluyendo eliminación en cascada si se configuró en SQL).

Checklists & Items
POST /api/notes/[id]/checklist-items - Añade una nueva subtarea a una nota de tipo checklist.

PATCH /api/checklist-items/[itemId] - Actualiza el estado (is_completed) o texto de un ítem.

DELETE /api/checklist-items/[itemId] - Elimina un ítem específico de la lista.

⚙️ Configuración del Entorno de Desarrollo
Instalación:

Bash
npm install


2. **Variables de Entorno:**
   Crea un archivo `.env.local` y añade tu Connection String de Neon:
   ```env
   DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
   
Ejecución:

Bash
npm run dev


---

## 🗄️ Esquema de Base de Datos

El sistema utiliza tres tablas relacionales para optimizar el almacenamiento:
- `notes`: Tabla principal con soporte para colores hexadecimales y tipos de nota.
- `checklist_items`: Relación 1:N con `notes` para las tareas pendientes.
- `note_tags`: Relación para categorizar ideas mediante etiquetas.

---

## ☁️ Despliegue en Producción

El proyecto está optimizado para **Vercel**. 
1. Conecta el repositorio de GitHub a Vercel.
2. Configura `DATABASE_URL` en las *Environment Variables* del proyecto en Vercel.
3. El despliegue se realizará automáticamente con cada `push` a la rama `main`.

---

## 📄 Licencia
Este proyecto es de uso personal y educativo.