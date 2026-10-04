import { NextResponse } from "next/server";
import { query, withTransaction } from "../../../lib/db";
import { requireCustomer, authErrorResponse, money } from "../../../lib/auth";

function mapStudent(r) {
  const raw = r.raw_data && typeof r.raw_data === "object" ? r.raw_data : {};
  return {
    ...raw,
    id: r.id,
    tenantId: r.tenant_id,
    fullName: r.full_name,
    mobile: r.mobile ?? raw.mobile ?? "",
    gender: r.gender ?? raw.gender ?? "",
    dob: r.dob ?? raw.dob ?? "",
    documentNumber: r.document_number ?? raw.documentNumber ?? "",
    emergency: r.emergency ?? raw.emergency ?? "",
    address: r.address ?? raw.address ?? "",
    room: r.room_number ?? raw.room ?? "",
    roomNumber: r.room_number ?? raw.roomNumber ?? r.room_number ?? "",
    floor: r.floor ?? raw.floor ?? "",
    bed: r.bed ?? raw.bed ?? "",
    advance: r.advance ?? raw.advance ?? 0,
    monthlyRent: r.monthly_rent ?? raw.monthlyRent ?? 0,
    status: r.status,
    frontProof: r.front_proof_key ?? raw.frontProof ?? "",
    backProof: r.back_proof_key ?? raw.backProof ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET() {
  try {
    const s = await requireCustomer();
    const r = await query(`select * from students where tenant_id=$1 and status='Active' order by created_at desc`, [s.tenantId]);
    return NextResponse.json({ students: r.rows.map(mapStudent) });
  } catch (e) {
    return authErrorResponse(NextResponse, e);
  }
}

export async function POST(req) {
  try {
    const s = await requireCustomer();
    const b = await req.json();
    if (!b.fullName?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const result = await withTransaction(async (client) => {
      const roomR = await client.query(`select * from rooms where tenant_id=$1 and room_number=$2 for update`, [s.tenantId, b.roomNumber]);
      const room = roomR.rows[0];
      if (!room) return { error: "Select an available room and bed", status: 400 };
      const bedR = await client.query(`select * from beds where tenant_id=$1 and room_id=$2 and label=$3 for update`, [s.tenantId, room.id, b.bed]);
      const bed = bedR.rows[0];
      if (!bed) return { error: "Select an available room and bed", status: 400 };
      if (bed.status === "Occupied") return { error: "Bed already occupied", status: 409 };

      const id = `STU-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const raw = { ...b, room: room.room_number, roomNumber: room.room_number, floor: room.floor, bed: bed.label };
      await client.query(`
        insert into students(id,tenant_id,full_name,mobile,gender,dob,document_number,emergency,address,room_number,floor,bed,advance,monthly_rent,status,front_proof_key,back_proof_key,created_at,raw_data)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Active',$15,$16,$17,$18)`,
        [id,s.tenantId,b.fullName.trim(),b.mobile||null,b.gender||null,b.dob||null,b.documentNumber||null,b.emergency||null,b.address||null,room.room_number,room.floor,bed.label,money(b.advance),money(b.monthlyRent),b.frontProof||null,b.backProof||null,createdAt,JSON.stringify(raw)]
      );
      await client.query(`update beds set status='Occupied',student_id=$1 where id=$2 and tenant_id=$3`, [id, bed.id, s.tenantId]);
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'CREATE_STUDENT','student',$3,$4)`, [s.tenantId,s.customerId,id,JSON.stringify({room:room.room_number,bed:bed.label})]);
      const r = await client.query(`select * from students where id=$1`, [id]);
      return { student: mapStudent(r.rows[0]) };
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    return authErrorResponse(NextResponse, e);
  }
}

export async function PUT(req) {
  try {
    const s = await requireCustomer();
    const b = await req.json();
    const allowed = ["fullName","mobile","gender","dob","documentNumber","advance","monthlyRent","emergency","address","frontProof","backProof"];
    const result = await withTransaction(async (client) => {
      const current = await client.query(`select * from students where id=$1 and tenant_id=$2 for update`, [b.id,s.tenantId]);
      if (!current.rowCount) return { error: "Student not found", status: 404 };
      const old = current.rows[0];
      const raw = { ...(old.raw_data || {}) };
      for (const k of allowed) if (b[k] !== undefined) raw[k] = b[k];
      const vals = {
        fullName: b.fullName !== undefined ? b.fullName : old.full_name,
        mobile: b.mobile !== undefined ? b.mobile : old.mobile,
        gender: b.gender !== undefined ? b.gender : old.gender,
        dob: b.dob !== undefined ? b.dob : old.dob,
        documentNumber: b.documentNumber !== undefined ? b.documentNumber : old.document_number,
        advance: b.advance !== undefined ? money(b.advance) : old.advance,
        monthlyRent: b.monthlyRent !== undefined ? money(b.monthlyRent) : old.monthly_rent,
        emergency: b.emergency !== undefined ? b.emergency : old.emergency,
        address: b.address !== undefined ? b.address : old.address,
        frontProof: b.frontProof !== undefined ? b.frontProof : old.front_proof_key,
        backProof: b.backProof !== undefined ? b.backProof : old.back_proof_key,
      };
      const updatedAt = new Date().toISOString();
      await client.query(`update students set full_name=$1,mobile=$2,gender=$3,dob=$4,document_number=$5,advance=$6,monthly_rent=$7,emergency=$8,address=$9,front_proof_key=$10,back_proof_key=$11,updated_at=$12,raw_data=$13 where id=$14 and tenant_id=$15`, [vals.fullName,vals.mobile||null,vals.gender||null,vals.dob||null,vals.documentNumber||null,vals.advance,vals.monthlyRent,vals.emergency||null,vals.address||null,vals.frontProof||null,vals.backProof||null,updatedAt,JSON.stringify(raw),b.id,s.tenantId]);
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'UPDATE_STUDENT','student',$3,$4)`, [s.tenantId,s.customerId,b.id,JSON.stringify({fields:Object.keys(b).filter(k=>allowed.includes(k))})]);
      const r = await client.query(`select * from students where id=$1`, [b.id]);
      return { student: mapStudent(r.rows[0]) };
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    return authErrorResponse(NextResponse, e);
  }
}

export async function DELETE(req) {
  try {
    const s = await requireCustomer();
    const b = await req.json();
    const result = await withTransaction(async (client) => {
      const current = await client.query(`select * from students where id=$1 and tenant_id=$2 for update`, [b.id,s.tenantId]);
      if (!current.rowCount) return { error: "Student not found", status: 404 };
      const row = current.rows[0];
      const archived = mapStudent(row);
      archived.status = "Checked Out";
      archived.checkedOutAt = new Date().toISOString();
      const room = await client.query(`select id from rooms where tenant_id=$1 and room_number=$2`, [s.tenantId,row.room_number]);
      if (room.rowCount) await client.query(`update beds set status='Available',student_id=null where tenant_id=$1 and room_id=$2 and label=$3`, [s.tenantId,room.rows[0].id,row.bed]);
      await client.query(`insert into student_history(id,tenant_id,student_id,snapshot,checked_out_at) values($1,$2,$3,$4,$5)`, [`SH-${Date.now()}`,s.tenantId,row.id,JSON.stringify(archived),archived.checkedOutAt]);
      await client.query(`delete from students where id=$1 and tenant_id=$2`, [row.id,s.tenantId]);
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'CHECKOUT_STUDENT','student',$3,$4)`, [s.tenantId,s.customerId,row.id,JSON.stringify({room:row.room_number,bed:row.bed})]);
      return { ok: true, student: archived };
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    return authErrorResponse(NextResponse, e);
  }
}
