import crypto from "crypto";
import { cookies } from "next/headers";
import { query } from "./db";

const SESSION_COOKIE = "hosteldesk_session";
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function tokenHash(token) {
  return hash(token);
}

function customerFromRow(r) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    hostelName: r.hostel_name,
    ownerName: r.owner_name,
    mobile: r.mobile,
    email: r.email,
    role: r.role,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const hashedToken = tokenHash(token);

  const r = await query(
    `select
        s.token_hash,
        s.customer_id,
        s.tenant_id,
        s.role,
        s.expires_at,
        c.id,
        c.tenant_id as c_tenant_id,
        c.hostel_name,
        c.owner_name,
        c.mobile,
        c.email,
        c.role as c_role,
        c.status,
        c.created_at
     from sessions s
     join customers c on c.id = s.customer_id
     where s.token_hash = $1
       and s.expires_at > now()
       and c.status = 'Active'
     limit 1`,
    [hashedToken]
  );

  if (!r.rowCount) {
    return null;
  }

  const x = r.rows[0];

  return {
    tokenHash: x.token_hash,
    customerId: x.customer_id,
    tenantId: x.tenant_id,
    role: x.role,
    expiresAt: x.expires_at,
    email: x.email,

    customer: customerFromRow({
      id: x.id,
      tenant_id: x.c_tenant_id,
      hostel_name: x.hostel_name,
      owner_name: x.owner_name,
      mobile: x.mobile,
      email: x.email,
      role: x.c_role,
      status: x.status,
      created_at: x.created_at,
    }),
  };
}

export async function requireCustomer() {
  const s = await getSession();

  if (!s) {
    const e = new Error("UNAUTHORIZED");
    e.code = "UNAUTHORIZED";
    throw e;
  }

  if (s.role === "SUPER_ADMIN") {
    const e = new Error("CUSTOMER_ONLY");
    e.code = "CUSTOMER_ONLY";
    throw e;
  }

  return s;
}

export async function requireSuperAdmin() {
  const s = await getSession();

  if (!s || s.role !== "SUPER_ADMIN") {
    const e = new Error("FORBIDDEN");
    e.code = "FORBIDDEN";
    throw e;
  }

  return s;
}

export function authErrorResponse(NextResponse, error) {
  if (
    error?.code === "UNAUTHORIZED" ||
    error?.code === "CUSTOMER_ONLY"
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (error?.code === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  console.error("HostelDesk API error:", error);

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

export function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function cleanupExpiredSessions() {
  await query(
    `delete from sessions
      where expires_at <= now()`
  );
}