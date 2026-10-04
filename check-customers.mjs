import { query } from './lib/db.js';

try {
  const r = await query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'customers'
    ORDER BY ordinal_position
  `);

  console.table(r.rows);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
