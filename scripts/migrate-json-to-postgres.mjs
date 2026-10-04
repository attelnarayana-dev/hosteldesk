import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const root = process.cwd();
const dbPath = path.join(root, "data", "db.json");
const schemaPath = path.join(root, "PRODUCTION-DATABASE-SCHEMA.sql");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Put it in .env.local or export it before running the migration.");
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const tenantId = "TENANT-DEMO";
const now = new Date().toISOString();

const arr = (name) => Array.isArray(source[name]) ? source[name] : [];
const money = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const iso = (v, fallback = now) => {
  if (!v) return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
};
const textOrNull = (v) => (v === undefined || v === null || String(v).trim() === "" ? null : String(v));
const json = (v) => JSON.stringify(v ?? {});

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

const customers = arr("customers").map((c) => ({
  id: c.id,
  tenantId: c.tenantId || tenantId,
  hostelName: c.hostelName || "HostelDesk Hostel",
  ownerName: c.ownerName || c.name || null,
  mobile: c.mobile || null,
  email: c.email,
  passwordHash: c.passwordHash || sha256(c.password || ""),
  role: c.role || "CUSTOMER",
  status: c.status || "Active",
  createdAt: iso(c.createdAt),
}));

// The old JSON version stores the super-admin in `users`. Preserve that login
// as a production customer record with SUPER_ADMIN role.
for (const u of arr("users")) {
  if (!customers.some((c) => c.email === u.email)) {
    customers.push({
      id: u.id === "u1" ? "SUPER-001" : `SUPER-${u.id}`,
      tenantId: null,
      hostelName: "HostelDesk",
      ownerName: u.name || "Super Admin",
      mobile: null,
      email: u.email,
      passwordHash: u.passwordHash || sha256(u.password || ""),
      role: "SUPER_ADMIN",
      status: "Active",
      createdAt: now,
    });
  }
}

// Current app runtime creates this demo customer when it is missing.
if (!customers.some((c) => c.email === "demo@hosteldesk.local")) {
  customers.push({
    id: "CUST-DEMO",
    tenantId,
    hostelName: "Demo Hostel",
    ownerName: "Demo Owner",
    mobile: null,
    email: "demo@hosteldesk.local",
    passwordHash: sha256("Demo@123"),
    role: "CUSTOMER",
    status: "Active",
    createdAt: now,
  });
}

const students = arr("students").map((s) => ({
  id: s.id,
  tenantId: s.tenantId || tenantId,
  fullName: s.fullName || "Unknown",
  mobile: textOrNull(s.mobile),
  gender: textOrNull(s.gender),
  dob: textOrNull(s.dob),
  documentNumber: textOrNull(s.documentNumber),
  emergency: textOrNull(s.emergency),
  address: textOrNull(s.address),
  roomNumber: textOrNull(s.roomNumber || s.room),
  floor: textOrNull(s.floor),
  bed: textOrNull(s.bed),
  advance: money(s.advance),
  monthlyRent: money(s.monthlyRent),
  status: s.status || "Active",
  frontProofKey: textOrNull(s.frontProofKey || s.frontProof),
  backProofKey: textOrNull(s.backProofKey || s.backProof),
  createdAt: iso(s.createdAt),
  updatedAt: s.updatedAt ? iso(s.updatedAt) : null,
  rawData: s,
}));

const guests = arr("guests").map((g) => ({
  id: g.id,
  tenantId: g.tenantId || tenantId,
  fullName: g.fullName || "Unknown",
  payload: g,
  status: g.status || "Active",
  createdAt: iso(g.createdAt),
  updatedAt: g.updatedAt ? iso(g.updatedAt) : null,
}));

const rooms = [];
const beds = [];
for (const r of arr("rooms")) {
  const room = {
    id: r.id,
    tenantId: r.tenantId || tenantId,
    floor: String(r.floor ?? ""),
    roomNumber: String(r.roomNumber ?? ""),
  };
  rooms.push(room);
  for (const b of Array.isArray(r.beds) ? r.beds : []) {
    beds.push({
      id: b.id,
      tenantId: r.tenantId || tenantId,
      roomId: r.id,
      label: String(b.label ?? ""),
      status: b.status || "Available",
      studentId: b.studentId || null,
    });
  }
}

const payments = arr("payments").map((p) => ({
  id: p.id,
  tenantId: p.tenantId || tenantId,
  studentId: p.studentId,
  studentName: textOrNull(p.studentName),
  month: textOrNull(p.month),
  amount: money(p.amount),
  paidAt: iso(p.paidAt),
  note: textOrNull(p.note),
}));

const studentHistory = arr("studentHistory").map((h) => ({
  id: h.id || `SH-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  tenantId: h.tenantId || tenantId,
  studentId: h.studentId || h.id || null,
  snapshot: h.snapshot || h,
  checkedOutAt: iso(h.checkedOutAt || h.at),
}));

const guestHistory = arr("guestHistory").map((h) => ({
  id: h.id || `GH-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  tenantId: h.tenantId || tenantId,
  guestId: h.guestId || h.id || null,
  snapshot: h.snapshot || h,
  checkedOutAt: iso(h.checkedOutAt || h.at),
}));

const auditLogs = arr("auditLogs").map((a) => ({
  tenantId: a.tenantId || tenantId,
  actorCustomerId: a.actorCustomerId || null,
  action: a.action || "UNKNOWN",
  targetType: a.targetType || (a.studentId ? "student" : a.guestId ? "guest" : a.room ? "room" : null),
  targetId: a.targetId || a.studentId || a.guestId || a.room || null,
  metadata: a.metadata || a,
  createdAt: iso(a.createdAt || a.at),
}));

const schema = fs.readFileSync(schemaPath, "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schema);

    for (const c of customers) {
      await client.query(`
        insert into customers (id, tenant_id, hostel_name, owner_name, mobile, email, password_hash, role, status, created_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        on conflict (id) do update set
          tenant_id=excluded.tenant_id, hostel_name=excluded.hostel_name, owner_name=excluded.owner_name,
          mobile=excluded.mobile, email=excluded.email, password_hash=excluded.password_hash,
          role=excluded.role, status=excluded.status
      `, [c.id, c.tenantId, c.hostelName, c.ownerName, c.mobile, c.email, c.passwordHash, c.role, c.status, c.createdAt]);
    }

    for (const r of rooms) {
      await client.query(`insert into rooms(id,tenant_id,floor,room_number) values($1,$2,$3,$4) on conflict(id) do update set tenant_id=excluded.tenant_id,floor=excluded.floor,room_number=excluded.room_number`, [r.id,r.tenantId,r.floor,r.roomNumber]);
    }

    for (const s of students) {
      await client.query(`
        insert into students(id,tenant_id,full_name,mobile,gender,dob,document_number,emergency,address,room_number,floor,bed,advance,monthly_rent,status,front_proof_key,back_proof_key,created_at,updated_at,raw_data)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        on conflict(id) do update set tenant_id=excluded.tenant_id,full_name=excluded.full_name,mobile=excluded.mobile,gender=excluded.gender,dob=excluded.dob,document_number=excluded.document_number,emergency=excluded.emergency,address=excluded.address,room_number=excluded.room_number,floor=excluded.floor,bed=excluded.bed,advance=excluded.advance,monthly_rent=excluded.monthly_rent,status=excluded.status,front_proof_key=excluded.front_proof_key,back_proof_key=excluded.back_proof_key,updated_at=excluded.updated_at,raw_data=excluded.raw_data
      `, [s.id,s.tenantId,s.fullName,s.mobile,s.gender,s.dob,s.documentNumber,s.emergency,s.address,s.roomNumber,s.floor,s.bed,s.advance,s.monthlyRent,s.status,s.frontProofKey,s.backProofKey,s.createdAt,s.updatedAt,json(s.rawData)]);
    }

    for (const b of beds) {
      await client.query(`insert into beds(id,tenant_id,room_id,label,status,student_id) values($1,$2,$3,$4,$5,$6) on conflict(id) do update set tenant_id=excluded.tenant_id,room_id=excluded.room_id,label=excluded.label,status=excluded.status,student_id=excluded.student_id`, [b.id,b.tenantId,b.roomId,b.label,b.status,b.studentId]);
    }

    for (const g of guests) {
      await client.query(`insert into guests(id,tenant_id,full_name,payload,status,created_at,updated_at) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do update set tenant_id=excluded.tenant_id,full_name=excluded.full_name,payload=excluded.payload,status=excluded.status,updated_at=excluded.updated_at`, [g.id,g.tenantId,g.fullName,json(g.payload),g.status,g.createdAt,g.updatedAt]);
    }

    for (const p of payments) {
      await client.query(`insert into payments(id,tenant_id,student_id,student_name,month,amount,paid_at,note) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(id) do update set tenant_id=excluded.tenant_id,student_id=excluded.student_id,student_name=excluded.student_name,month=excluded.month,amount=excluded.amount,paid_at=excluded.paid_at,note=excluded.note`, [p.id,p.tenantId,p.studentId,p.studentName,p.month,p.amount,p.paidAt,p.note]);
    }

    for (const h of studentHistory) {
      await client.query(`insert into student_history(id,tenant_id,student_id,snapshot,checked_out_at) values($1,$2,$3,$4,$5) on conflict(id) do update set tenant_id=excluded.tenant_id,student_id=excluded.student_id,snapshot=excluded.snapshot,checked_out_at=excluded.checked_out_at`, [h.id,h.tenantId,h.studentId,json(h.snapshot),h.checkedOutAt]);
    }

    for (const h of guestHistory) {
      await client.query(`insert into guest_history(id,tenant_id,guest_id,snapshot,checked_out_at) values($1,$2,$3,$4,$5) on conflict(id) do update set tenant_id=excluded.tenant_id,guest_id=excluded.guest_id,snapshot=excluded.snapshot,checked_out_at=excluded.checked_out_at`, [h.id,h.tenantId,h.guestId,json(h.snapshot),h.checkedOutAt]);
    }

    for (const a of auditLogs) {
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata,created_at) values($1,$2,$3,$4,$5,$6,$7)`, [a.tenantId,a.actorCustomerId,a.action,a.targetType,a.targetId,json(a.metadata),a.createdAt]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  console.log("PostgreSQL migration completed.");
  console.log(JSON.stringify({customers:customers.length,rooms:rooms.length,beds:beds.length,students:students.length,guests:guests.length,payments:payments.length,studentHistory:studentHistory.length,guestHistory:guestHistory.length,auditLogs:auditLogs.length},null,2));
} catch (error) {
  console.error("PostgreSQL migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
