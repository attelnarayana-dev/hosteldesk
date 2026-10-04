import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../lib/db";
import {
  tokenHash,
  clearSessionCookie,
} from "../../../../lib/auth";

export async function POST() {
  try {
    const token = cookies().get("hosteldesk_session")?.value;

    if (token) {
      await query(
        `delete from sessions
         where token_hash = $1`,
        [tokenHash(token)]
      );
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  const response = NextResponse.json({
    ok: true,
  });

  clearSessionCookie(response);

  return response;
}