import { NextResponse } from "next/server";
import { query, withTransaction } from "../../../lib/db";
import { requireCustomer, authErrorResponse, money } from "../../../lib/auth";

function mapPayment(r){return {id:r.id,tenantId:r.tenant_id,studentId:r.student_id,studentName:r.student_name,month:r.month,amount:Number(r.amount),paidAt:r.paid_at,note:r.note};}

export async function GET(req){
  try{
    const s=await requireCustomer(); const id=new URL(req.url).searchParams.get("studentId");
    const r=await query(`select * from payments where tenant_id=$1 and ($2::text is null or student_id=$2) order by paid_at desc`,[s.tenantId,id||null]);
    return NextResponse.json({payments:r.rows.map(mapPayment)});
  }catch(e){return authErrorResponse(NextResponse,e);}
}

export async function POST(req){
  try{
    const s=await requireCustomer(); const b=await req.json(); const amount=money(b.amount);
    if(amount<=0) return NextResponse.json({error:"Enter a valid payment amount"},{status:400});
    const result=await withTransaction(async client=>{
      const r=await client.query(`select * from students where id=$1 and tenant_id=$2 union all select null as id,null as tenant_id,null as full_name,null as mobile,null as gender,null as dob,null as document_number,null as emergency,null as address,null as room_number,null as floor,null as bed,0 as advance,0 as monthly_rent,null as status,null as front_proof_key,null as back_proof_key,null as created_at,null as updated_at,'{}'::jsonb as raw_data where false`,[b.studentId,s.tenantId]);
      let student=r.rows[0];
      if(!student){const h=await client.query(`select student_id,snapshot->>'fullName' as full_name from student_history where student_id=$1 and tenant_id=$2 order by checked_out_at desc limit 1`,[b.studentId,s.tenantId]); if(h.rowCount) student={id:b.studentId,full_name:h.rows[0].full_name};}
      if(!student) return {error:"Student not found",status:404};
      const paidAt=b.paidAt||new Date().toISOString(); const id=`PAY-${Date.now()}`;
      await client.query(`insert into payments(id,tenant_id,student_id,student_name,month,amount,paid_at,note) values($1,$2,$3,$4,$5,$6,$7,$8)`,[id,s.tenantId,student.id,student.full_name||null,String(b.month||""),amount,paidAt,String(b.note||"")]);
      if(student.status==='Active'){
        const raw={...(student.raw_data||{}),lastPaymentAt:paidAt};
        await client.query(`update students set raw_data=$1 where id=$2 and tenant_id=$3`,[JSON.stringify(raw),student.id,s.tenantId]);
      }
      await client.query(`insert into audit_logs(tenant_id,actor_customer_id,action,target_type,target_id,metadata) values($1,$2,'ADD_PAYMENT','payment',$3,$4)`,[s.tenantId,s.customerId,id,JSON.stringify({studentId:student.id,amount})]);
      const p=await client.query(`select * from payments where id=$1`,[id]); return {payment:mapPayment(p.rows[0])};
    });
    if(result.error) return NextResponse.json({error:result.error},{status:result.status}); return NextResponse.json(result);
  }catch(e){return authErrorResponse(NextResponse,e);}
}
