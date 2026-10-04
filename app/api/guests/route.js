import { NextResponse } from "next/server";
import { query, withTransaction } from "../../../lib/db";
import { requireCustomer, authErrorResponse, money } from "../../../lib/auth";

function mapGuest(r) {
  const payload = r.payload && typeof r.payload === "object" ? r.payload : {};
  return { ...payload, id:r.id, tenantId:r.tenant_id, fullName:r.full_name, status:r.status, createdAt:r.created_at, updatedAt:r.updated_at };
}

export async function GET() {
  try {
    const s = await requireCustomer();
    const r = await query(`select * from guests where tenant_id=$1 and status='Active' order by created_at desc`, [s.tenantId]);
    return NextResponse.json({ guests:r.rows.map(mapGuest) });
  } catch(e) { return authErrorResponse(NextResponse,e); }
}

export async function POST(req) {
  try {
    const s=await requireCustomer(); const b=await req.json();
    if(!b.fullName?.trim()) return NextResponse.json({error:"Guest name required"},{status:400});
    const days=Math.max(1,Number(b.stayDays||1));
    const checkIn=b.checkInDate||new Date().toISOString().slice(0,10);
    const out=new Date(checkIn+"T12:00:00"); out.setDate(out.getDate()+days);
    const id=`GST-${Date.now()}`; const createdAt=new Date().toISOString();
    const guest={id,tenantId:s.tenantId,createdAt,...b,amount:money(b.amount),stayDays:days,checkInDate:checkIn,checkOutDate:b.checkOutDate||out.toISOString().slice(0,10),room:b.roomNumber||b.room||"",floor:b.floor||"",bed:b.bed||"",status:"Active",guestHistory:[]};
    await query(`insert into guests(id,tenant_id,full_name,payload,status,created_at) values($1,$2,$3,$4,'Active',$5)`,[id,s.tenantId,guest.fullName,JSON.stringify(guest),createdAt]);
    await query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'CREATE_GUEST','guest',$3,$4)`,[s.tenantId,s.customerId,id,JSON.stringify({room:guest.room,bed:guest.bed})]);
    return NextResponse.json({guest});
  } catch(e) { return authErrorResponse(NextResponse,e); }
}

export async function PUT(req) {
  try {
    const s=await requireCustomer(); const b=await req.json();
    const result=await withTransaction(async client=>{
      const r=await client.query(`select * from guests where id=$1 and tenant_id=$2 for update`,[b.id,s.tenantId]);
      if(!r.rowCount) return {error:"Guest not found",status:404};
      const old=mapGuest(r.rows[0]);
      const allowed=['fullName','mobile','gender','dob','documentNumber','emergency','address','amount','stayDays','checkInDate','checkOutDate','floor','room','bed','frontProof','backProof'];
      const updated={...old}; for(const k of allowed) if(b[k]!==undefined) updated[k]=k==='amount'?money(b[k]):b[k];
      updated.updatedAt=new Date().toISOString();
      await client.query(`update guests set full_name=$1,payload=$2,updated_at=$3 where id=$4 and tenant_id=$5`,[updated.fullName,JSON.stringify(updated),updated.updatedAt,b.id,s.tenantId]);
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'UPDATE_GUEST','guest',$3,$4)`,[s.tenantId,s.customerId,b.id,JSON.stringify({fields:Object.keys(b).filter(k=>allowed.includes(k))})]);
      return {guest:updated};
    });
    if(result.error) return NextResponse.json({error:result.error},{status:result.status});
    return NextResponse.json(result);
  } catch(e) { return authErrorResponse(NextResponse,e); }
}

export async function DELETE(req) {
  try {
    const s=await requireCustomer(); const b=await req.json();
    const result=await withTransaction(async client=>{
      const r=await client.query(`select * from guests where id=$1 and tenant_id=$2 for update`,[b.id,s.tenantId]);
      if(!r.rowCount) return {error:"Guest not found",status:404};
      const guest=mapGuest(r.rows[0]); const checkedOutAt=new Date().toISOString(); const archived={...guest,status:"Checked Out",checkedOutAt};
      await client.query(`insert into guest_history(id,tenant_id,guest_id,snapshot,checked_out_at) values($1,$2,$3,$4,$5)`,[`GH-${Date.now()}`,s.tenantId,guest.id,JSON.stringify(archived),checkedOutAt]);
      await client.query(`delete from guests where id=$1 and tenant_id=$2`,[guest.id,s.tenantId]);
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'CHECKOUT_GUEST','guest',$3,$4)`,[s.tenantId,s.customerId,guest.id,JSON.stringify({room:guest.room,bed:guest.bed})]);
      return {ok:true,guest:archived};
    });
    if(result.error) return NextResponse.json({error:result.error},{status:result.status});
    return NextResponse.json(result);
  } catch(e) { return authErrorResponse(NextResponse,e); }
}
