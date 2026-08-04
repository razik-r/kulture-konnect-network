// Supabase Edge Function: send-whatsapp
//
// Called from the frontend right after a booking is created. Sends the
// partner property a WhatsApp Business API template message with the
// booking details, then updates the booking row with the result.
//
// Requires these secrets to be set (`supabase secrets set ...`):
//   WHATSAPP_API_URL       e.g. https://graph.facebook.com/v20.0/<phone-number-id>/messages
//   WHATSAPP_ACCESS_TOKEN  permanent or long-lived access token
//   WHATSAPP_TEMPLATE_NAME the name of your Meta-approved template
//
// The template is expected to take 4 body variables, in this order:
//   1. guest_name  2. check_in (e.g. "12 Aug")  3. check_out (e.g. "14 Aug")  4. guests + room name
//
// Adjust the `templateParams` below to match whatever template you actually
// get approved — Meta requires the variable count/order to match exactly.

import { createClient } from "jsr:@supabase/supabase-js@2";

const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_TEMPLATE_NAME = Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "new_booking_notification";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

Deno.serve(async (req) => {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId is required" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, property:properties(name, partner_whatsapp_number), room:rooms(name)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });
    }

    const templateParams = [
      booking.guest_name,
      formatDate(booking.check_in),
      formatDate(booking.check_out),
      `${booking.guests} guest(s), ${booking.room.name}`,
    ];

    const waResponse = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: booking.property.partner_whatsapp_number,
        type: "template",
        template: {
          name: WHATSAPP_TEMPLATE_NAME,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: templateParams.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });

    const waResult = await waResponse.json();
    const sent = waResponse.ok;

    await supabase
      .from("bookings")
      .update({
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_message_status: sent ? "sent" : "failed",
      })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ sent, waResult }), {
      status: sent ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
