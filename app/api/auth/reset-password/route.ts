import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: "Chưa cấu hình Supabase Service Role Key trên máy chủ" }, 
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { email, pin, newPassword } = await req.json();

    if (!email || !pin || !newPassword) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (pin !== "241105") {
      return NextResponse.json({ error: "Mã xác nhận không đúng" }, { status: 403 });
    }

    const { data, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listErr) {
      return NextResponse.json(
        { error: "Lỗi đọc danh sách user: " + listErr.message }, 
        { status: 500 }
      );
    }

    const user = data.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
    
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản với email này" }, { status: 404 });
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
      password: newPassword 
    });

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error: any) {
    console.error('Lỗi API reset-password:', error);
    return NextResponse.json(
      { error: "Lỗi hệ thống không xác định: " + (error.message || "") }, 
      { status: 500 }
    );
  }
}
