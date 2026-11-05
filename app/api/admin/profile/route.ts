import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

async function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Tidak terautentikasi." },
    { status: 401 }
  );
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();
    const id = parseInt((session.user as { id?: string }).id || "", 10);
    if (isNaN(id)) return unauthorized();
    const user = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    if (!user) return unauthorized();
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("GET /api/admin/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();
    const id = parseInt((session.user as { id?: string }).id || "", 10);
    if (isNaN(id)) return unauthorized();

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (!user) return unauthorized();

    const data: { name?: string; email?: string; password?: string } = {};
    if (name) data.name = name;
    if (email) {
      const existing = await prisma.adminUser.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, error: "Email sudah digunakan." },
          { status: 400 }
        );
      }
      data.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Password lama wajib diisi." },
          { status: 400 }
        );
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Password lama salah." },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password baru minimal 6 karakter." },
          { status: 400 }
        );
      }
      data.password = await bcrypt.hash(newPassword, 10);
    }

    await prisma.adminUser.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
