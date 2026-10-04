import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import {
  hash,
  newToken,
  tokenHash,
  setSessionCookie,
  cleanupExpiredSessions,
} from "../../../../lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Invalid login details" },
        { status: 401 }
      );
    }

    /*
     * Remove expired sessions periodically.
     * This keeps the sessions table clean.
     */
    try {
      await cleanupExpiredSessions();
    } catch (cleanupError) {
      console.error(
        "Session cleanup failed:",
        cleanupError
      );
    }

    const passwordHash = hash(password);

    const r = await query(
      `select
          id,
          tenant_id,
          hostel_name,
          email,
          role,
          status
       from customers
       where lower(email) = $1
         and password_hash = $2
       limit 1`,
      [email, passwordHash]
    );

    const customer = r.rows[0];

    /*
     * Do not reveal whether the email exists,
     * whether the password was wrong, or whether
     * the account is inactive.
     */
    if (!customer || customer.status !== "Active") {
      return NextResponse.json(
        { error: "Invalid login details" },
        { status: 401 }
      );
    }

    const token = newToken();

    const expiresAt = new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000
    );

    /*
     * One active session per customer.
     */
    await query(
      `delete from sessions
       where customer_id = $1`,
      [customer.id]
    );

    await query(
      `insert into sessions(
          token_hash,
          customer_id,
          tenant_id,
          role,
          expires_at
       )
       values($1,$2,$3,$4,$5)`,
      [
        tokenHash(token),
        customer.id,
        customer.tenant_id,
        customer.role || "CUSTOMER",
        expiresAt.toISOString(),
      ]
    );

    const response = NextResponse.json({
      ok: true,
      user: {
        email: customer.email,
        role: customer.role || "CUSTOMER",
        hostelName: customer.hostel_name || "",
        customerId: customer.id,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Login service unavailable" },
      { status: 500 }
    );
  }
}