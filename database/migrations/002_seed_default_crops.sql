INSERT INTO crops (farm_id, crop_name, crop_variety, planting_date)
SELECT NULL, 'Tomato', 'Roma', DATE '2026-04-06'
WHERE NOT EXISTS (
  SELECT 1 FROM crops WHERE crop_name = 'Tomato'
);

INSERT INTO crops (farm_id, crop_name, crop_variety, planting_date)
SELECT NULL, 'Potato', 'Kufri Jyoti', DATE '2026-04-06'
WHERE NOT EXISTS (
  SELECT 1 FROM crops WHERE crop_name = 'Potato'
);

INSERT INTO crops (farm_id, crop_name, crop_variety, planting_date)
SELECT NULL, 'Bell Pepper', 'California Wonder', DATE '2026-04-06'
WHERE NOT EXISTS (
  SELECT 1 FROM crops WHERE crop_name = 'Bell Pepper'
);

INSERT INTO crops (farm_id, crop_name, crop_variety, planting_date)
SELECT NULL, 'Eggplant', 'Black Beauty', DATE '2026-04-06'
WHERE NOT EXISTS (
  SELECT 1 FROM crops WHERE crop_name = 'Eggplant'
);
