import { NextResponse } from "next/server";
import { query, withTransaction } from "../../../lib/db";
import { requireSuperAdmin, hash, authErrorResponse } from "../../../lib/auth";

function safe(r){return {id:r.id,tenantId:r.tenant_id,hostelName:r.hostel_name,ownerName:r.owner_name,mobile:r.mobile,email:r.email,status:r.status,createdAt:r.created_at};}

export async function GET(){try{await requireSuperAdmin();const r=await query(`select * from customers where role <> 'SUPER_ADMIN' order by created_at desc`);return NextResponse.json({customers:r.rows.map(safe)});}catch(e){return authErrorResponse(NextResponse,e);}}

export async function POST(req){
  try{
    const s=await requireSuperAdmin(); const b=await req.json(); const email=String(b.email||"").trim().toLowerCase();
    if(!b.hostelName||!email||!b.password)return NextResponse.json({error:"Hostel name, email and password are required"},{status:400});
    const result=await withTransaction(async client=>{
      const exists=await client.query(`select 1 from customers where lower(email)=$1`,[email]); if(exists.rowCount)return {error:"Customer email already exists",status:409};
      const id=`CUST-${Date.now()}`,tenantId=`TENANT-${Date.now()}`; const createdAt=new Date().toISOString();
      const r=await client.query(`insert into customers(id,tenant_id,hostel_name,owner_name,mobile,email,password_hash,role,status,created_at) values($1,$2,$3,$4,$5,$6,$7,'CUSTOMER','Active',$8) returning *`,[id,tenantId,String(b.hostelName).trim(),String(b.ownerName||"").trim(),String(b.mobile||"").trim(),email,hash(b.password),createdAt]);
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values(null,$1,'CREATE_CUSTOMER','customer',$2,$3)`,[s.customerId,id,JSON.stringify({tenantId,hostelName:b.hostelName,email})]);
      return {customer:safe(r.rows[0])};
    });
    if(result.error)return NextResponse.json({error:result.error},{status:result.status});return NextResponse.json(result);
  }catch(e){return authErrorResponse(NextResponse,e);}
}
