import fs from "node:fs";
import path from "node:path";
import pg from "pg";
const {Pool}=pg;
if(!process.env.DATABASE_URL){console.error("DATABASE_URL is required");process.exit(1)}
const schema=fs.readFileSync(path.join(process.cwd(),"PRODUCTION-DATABASE-SCHEMA.sql"),"utf8");
const pool=new Pool({connectionString:process.env.DATABASE_URL});
try{await pool.query(schema);console.log("PostgreSQL schema initialized successfully.");}catch(e){console.error("PostgreSQL schema initialization failed:",e.message);process.exitCode=1}finally{await pool.end()}
