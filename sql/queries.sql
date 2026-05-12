-- Consulta para obtener todas las notas con sus items y tags anidados
SELECT 
  n.*,
  -- json_agg agrupa múltiples filas hijas en un array JSON. 
  -- FILTER evita que se cree un array con un [null] si la nota no tiene items.
  json_agg(ci.*) FILTER (WHERE ci.id IS NOT NULL) as items,
  json_agg(nt.tag) FILTER (WHERE nt.id IS NOT NULL) as tags
FROM notes n
-- Usamos LEFT JOIN para que la nota se devuelva incluso si no tiene items o tags.
LEFT JOIN checklist_items ci ON n.id = ci.note_id
LEFT JOIN note_tags nt ON n.id = nt.note_id
-- Agrupamos por el ID de la nota para que la base de datos sepa qué filas comprimir juntas.
GROUP BY n.id
ORDER BY n.created_at DESC;