import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";

export async function GET() {
  try {
    const s = await getSession();
    if (!s) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        email: s.email,
        role: s.role,
        hostelName: s.customer.hostelName || "",
        customerId: s.customerId,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ user: null });
  }
}
