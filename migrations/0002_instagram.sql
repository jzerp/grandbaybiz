-- Optional Instagram handle (stored without the @, e.g. "baysidehandyman").
ALTER TABLE listings ADD COLUMN instagram TEXT NOT NULL DEFAULT '';
