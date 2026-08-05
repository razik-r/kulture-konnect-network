import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { isRoomBlockedForRange } from "../lib/availability";

const initialForm = {
  checkIn: "",
  checkOut: "",
  guests: 1,
  roomId: "",
  guestName: "",
  guestContact: "",
};

export default function BookingForm({ property, rooms, roomBlocks, onBooked }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { booking, whatsappSent }

  const datesChosen = form.checkIn && form.checkOut && form.checkOut > form.checkIn;

  const roomsWithAvailability = useMemo(() => {
    return rooms.map((room) => ({
      ...room,
      available: datesChosen
        ? !isRoomBlockedForRange(roomBlocks, room.id, form.checkIn, form.checkOut)
        : true,
    }));
  }, [rooms, roomBlocks, form.checkIn, form.checkOut, datesChosen]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!datesChosen) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (!form.roomId) {
      setError("Pick a room.");
      return;
    }
    if (!form.guestName.trim()) {
      setError("Guest name is required.");
      return;
    }

    setSubmitting(true);
    try {
      // Re-check availability against the latest blocks right before booking,
      // in case another staff device confirmed something in the meantime.
      const { data: freshBlocks, error: blocksError } = await supabase
        .from("room_blocks")
        .select("room_id, start_date, end_date")
        .eq("room_id", form.roomId);
      if (blocksError) throw blocksError;

      if (isRoomBlockedForRange(freshBlocks, form.roomId, form.checkIn, form.checkOut)) {
        setError("That room was just booked for these dates. Pick another room or dates.");
        setSubmitting(false);
        return;
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          property_id: property.id,
          room_id: form.roomId,
          guest_name: form.guestName.trim(),
          guest_contact: form.guestContact.trim() || null,
          check_in: form.checkIn,
          check_out: form.checkOut,
          guests: Number(form.guests),
        })
        .select()
        .single();
      if (bookingError) throw bookingError;

      const { error: blockError } = await supabase.from("room_blocks").insert({
        room_id: form.roomId,
        start_date: form.checkIn,
        end_date: form.checkOut,
        booking_id: booking.id,
        reason: "booking",
      });
      if (blockError) throw blockError;

      // Fire the WhatsApp notification. If this fails, the booking and room
      // block are still in place — staff can see the failure and fall back
      // to messaging the partner manually (see Admin > Bookings).
      const { data: waData, error: waError } = await supabase.functions.invoke("send-whatsapp", {
        body: { bookingId: booking.id },
      });

      setResult({
        booking,
        whatsappSent: !waError && waData?.sent,
      });
      setForm(initialForm);
      onBooked?.();
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="border border-stone-200 rounded-lg p-5 bg-stone-50">
        <p className="font-serif text-lg text-stone-800 mb-1">
          {result.whatsappSent ? "Booking confirmed" : "Booking saved — WhatsApp didn't go through"}
        </p>
        <p className="text-sm text-stone-600 mb-4">
          {result.whatsappSent
            ? `${property.name} has been notified via WhatsApp. Room is blocked for these dates.`
            : "The room is blocked and the booking is saved, but the automatic WhatsApp message failed — message the partner manually to be safe."}
        </p>
        <button
          onClick={() => setResult(null)}
          className="text-sm text-stone-700 underline underline-offset-2 hover:text-stone-900"
        >
          Book another room
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-stone-200 bg-[#ffff] rounded-lg p-5 space-y-4">
      <h2 className="font-serif text-lg text-stone-800">Book a room</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1" htmlFor="checkIn">Check-in</label>
          <input
            id="checkIn"
            type="date"
            required
            value={form.checkIn}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => update("checkIn", e.target.value)}
            className="w-full border border-stone-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1" htmlFor="checkOut">Check-out</label>
          <input
            id="checkOut"
            type="date"
            required
            value={form.checkOut}
            min={form.checkIn || new Date().toISOString().slice(0, 10)}
            onChange={(e) => update("checkOut", e.target.value)}
            className="w-full border border-stone-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-stone-500 mb-1" htmlFor="guests">Guests</label>
        <input
          id="guests"
          type="number"
          min={1}
          required
          value={form.guests}
          onChange={(e) => update("guests", e.target.value)}
          className="w-24 border border-stone-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      </div>

      <div>
        <label className="block text-xs text-stone-500 mb-1">Room</label>
        <div className="space-y-2">
          {roomsWithAvailability.map((room) => (
            <label
              key={room.id}
              className={`flex items-center justify-between border rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                !room.available
                  ? "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed"
                  : form.roomId === room.id
                  ? "border-stone-800"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="room"
                  value={room.id}
                  disabled={!room.available}
                  checked={form.roomId === room.id}
                  onChange={(e) => update("roomId", e.target.value)}
                />
                {room.name} · up to {room.max_guests} guests
              </span>
              <span>
                {room.available ? `₹${Number(room.price).toLocaleString("en-IN")}/night` : "Not available"}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1" htmlFor="guestName">Guest name</label>
          <input
            id="guestName"
            type="text"
            required
            value={form.guestName}
            onChange={(e) => update("guestName", e.target.value)}
            className="w-full border border-stone-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1" htmlFor="guestContact">Contact (optional)</label>
          <input
            id="guestContact"
            type="text"
            value={form.guestContact}
            onChange={(e) => update("guestContact", e.target.value)}
            className="w-full border border-stone-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-stone-800 cursor-pointer text-white rounded-md py-2.5 font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Confirming…" : "Confirm booking"}
      </button>
      <p className="text-xs text-stone-400">
        This notifies the partner on WhatsApp and blocks the room immediately. Payment is still
        collected at Kulture Konnect as usual.
      </p>
    </form>
  );
}
