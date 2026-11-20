-- Store consumption in kilograms instead of sacks. Existing entries are converted at 16 kg per sack.

ALTER TABLE pellet_entries ADD COLUMN amount_kg INTEGER;
UPDATE pellet_entries SET amount_kg = number_of_sacks * 16;
ALTER TABLE pellet_entries ALTER COLUMN amount_kg SET NOT NULL;
ALTER TABLE pellet_entries ADD CONSTRAINT ck_pellet_entries_amount_kg CHECK (amount_kg >= 1);
ALTER TABLE pellet_entries DROP COLUMN number_of_sacks;
