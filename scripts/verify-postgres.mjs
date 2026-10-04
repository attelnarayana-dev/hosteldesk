import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is required"); process.exit(1); }
const pool = new Pool({connectionString:process.env.DATABASE_URL});
try {
  const tables=['customers','rooms','beds','students','guests','payments','student_history','guest_history','audit_logs'];
  for (const t of tables) {
    const r=await pool.query(`select count(*)::int as count from ${t}`);
    console.log(`${t}: ${r.rows[0].count}`);
  }
  const tenants=await pool.query(`select tenant_id,count(*)::int as customers from customers group by tenant_id order by tenant_id nulls first`);
  console.log('tenant/customer distribution:', JSON.stringify(tenants.rows));
  console.log('PostgreSQL verification OK');
} catch(e) { console.error('PostgreSQL verification failed:',e.message); process.exitCode=1; }
finally { await pool.end(); }
