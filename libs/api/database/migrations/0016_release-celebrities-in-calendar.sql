-- Celebrities in your calendar is released: the celebrity pages add a person to the calendar (#32).
UPDATE "roadmap_items"
SET "status" = 'done', "released_on" = '2026-11-26', "updated_at" = now()
WHERE "category" = 'celebrities' AND "title" ->> 'en' = 'Celebrities in your calendar';
