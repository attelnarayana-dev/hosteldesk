import { NextResponse } from "next/server";
import { query, withTransaction } from "../../../lib/db";
import { requireCustomer, authErrorResponse } from "../../../lib/auth";

function mapRoom(r) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    floor: r.floor,
    roomNumber: r.room_number,
    beds: r.beds || [],
  };
}

export async function GET() {
  try {
    const s = await requireCustomer();
    const r = await query(
      `select r.id,r.tenant_id,r.floor,r.room_number,
              coalesce(json_agg(json_build_object('id',b.id,'label',b.label,'status',b.status,'studentId',b.student_id)
              order by b.label) filter (where b.id is not null),'[]'::json) as beds
         from rooms r
         left join beds b on b.room_id=r.id and b.tenant_id=r.tenant_id
        where r.tenant_id=$1
        group by r.id
        order by r.floor,r.room_number`,
      [s.tenantId]
    );
    return NextResponse.json({ rooms: r.rows.map(mapRoom) });
  } catch (e) {
    return authErrorResponse(NextResponse, e);
  }
}

export async function POST(req) {
  try {
    const s = await requireCustomer();
    const b = await req.json();
    const floor = String(b.floor || "").trim();
    const roomNumber = String(b.roomNumber || "").trim();
    const count = Math.max(1, Math.min(20, Number(b.bedCount) || 1));
    if (!floor || !roomNumber) return NextResponse.json({ error: "Floor and Room Number are required" }, { status: 400 });

    const result = await withTransaction(async (client) => {
      const exists = await client.query(`select 1 from rooms where tenant_id=$1 and room_number=$2`, [s.tenantId, roomNumber]);
      if (exists.rowCount) return { error: "Room already exists", status: 409 };
      const id = `R-${s.tenantId}-${roomNumber}`;
      await client.query(`insert into rooms(id,tenant_id,floor,room_number) values($1,$2,$3,$4)`, [id, s.tenantId, floor, roomNumber]);
      const beds = [];
      for (let i = 0; i < count; i++) {
        const label = String.fromCharCode(65 + i);
        const bedId = `${id}-${label}`;
        await client.query(`insert into beds(id,tenant_id,room_id,label,status,student_id) values($1,$2,$3,$4,'Available',null)`, [bedId, s.tenantId, id, label]);
        beds.push({ id: bedId, label, status: "Available", studentId: null });
      }
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'CREATE_ROOM','room',$3,$4)`, [s.tenantId, s.customerId, id, JSON.stringify({ roomNumber, floor, bedCount: count })]);
      return { room: { id, tenantId: s.tenantId, floor, roomNumber, beds } };
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    return authErrorResponse(NextResponse, e);
  }
}
