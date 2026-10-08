import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, pin, newPassword } = await req.json();

    if (!email || !pin || !newPassword) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (pin !== "241105") {
      return NextResponse.json({ error: "Mã xác nhận không đúng" }, { status: 403 });
    }

    // List all users to find the matching email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Lỗi lấy danh sách user:", listError);
      return NextResponse.json({ error: "Lỗi hệ thống khi tìm kiếm người dùng" }, { status: 500 });
    }

    const targetUser = users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
    
    if (!targetUser) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản với email này" }, { status: 404 });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, { 
      password: newPassword 
    });

    if (updateError) {
      console.error("Lỗi cập nhật mật khẩu:", updateError);
      return NextResponse.json({ error: "Lỗi khi cập nhật mật khẩu" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error: any) {
    console.error('Lỗi API reset-password:', error);
    return NextResponse.json({ error: "Đã xảy ra lỗi không xác định" }, { status: 500 });
  }
}
