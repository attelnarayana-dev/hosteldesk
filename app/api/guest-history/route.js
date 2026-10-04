import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { requireCustomer, authErrorResponse } from "../../../lib/auth";
export async function GET(){try{const s=await requireCustomer();const r=await query(`select snapshot from guest_history where tenant_id=$1 order by checked_out_at desc`,[s.tenantId]);return NextResponse.json({guests:r.rows.map(x=>x.snapshot)});}catch(e){return authErrorResponse(NextResponse,e);}}
