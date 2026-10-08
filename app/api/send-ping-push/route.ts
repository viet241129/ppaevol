import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

webpush.setVapidDetails(
  'mailto:hello@ppaevol.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { partner_id, sender_name } = await req.json();

    // Lấy subscriptions của partner
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', partner_id);

    if (error) {
      console.error('Supabase error fetching subscriptions:', error);
      return NextResponse.json({ success: false, error: 'DB Error' }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: false, error: 'No subscription found' });
    }

    const payload = JSON.stringify({
      title: 'Ting ting! 💖',
      body: `${sender_name || 'Nửa kia'} vừa Ping bạn kìa!`,
    });

    // Gửi push tới tất cả thiết bị của partner
    const sendPromises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (e: any) {
        console.error('Push error:', e);
        // Nếu lỗi gone (410) -> subscription đã bị hủy -> nên xóa khỏi DB
        if (e.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('subscription', sub.subscription);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi API send-ping-push:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
