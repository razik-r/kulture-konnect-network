import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, property:properties(name), room:rooms(name)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setBookings(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelBooking(booking) {
    if (!confirm(`Cancel the booking for ${booking.guest_name}? This frees up the room.`)) return;
    setBusyId(booking.id);
    try {
      // Free the room by deleting the block tied to this booking, then mark cancelled.
      const { error: blockError } = await supabase
        .from("room_blocks")
        .delete()
        .eq("booking_id", booking.id);
      if (blockError) throw blockError;

      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);
      if (bookingError) throw bookingError;

      await load();
    } catch (err) {
      alert(`Couldn't cancel: ${err.message ?? err}`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-stone-400 text-sm">Loading bookings…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (bookings.length === 0) return <p className="text-stone-500 text-sm">No bookings yet.</p>;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-stone-500 text-left">
          <tr>
            <th className="px-4 py-2.5 font-medium">Guest</th>
            <th className="px-4 py-2.5 font-medium">Property / room</th>
            <th className="px-4 py-2.5 font-medium">Dates</th>
            <th className="px-4 py-2.5 font-medium">WhatsApp</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-stone-100">
              <td className="px-4 py-2.5">
                <p className="text-stone-800">{b.guest_name}</p>
                {b.guest_contact && <p className="text-stone-400 text-xs">{b.guest_contact}</p>}
              </td>
              <td className="px-4 py-2.5 text-stone-600">
                {b.property?.name} · {b.room?.name}
              </td>
              <td className="px-4 py-2.5 text-stone-600">
                {b.check_in} → {b.check_out}
              </td>
              <td className="px-4 py-2.5">
                {b.whatsapp_message_status === "sent" ? (
                  <span className="text-green-700">Sent</span>
                ) : b.whatsapp_message_status === "failed" ? (
                  <span className="text-red-600">Failed — message manually</span>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 capitalize text-stone-600">{b.status}</td>
              <td className="px-4 py-2.5 text-right">
                {b.status === "confirmed" && (
                  <button
                    onClick={() => cancelBooking(b)}
                    disabled={busyId === b.id}
                    className="text-xs text-stone-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
