import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import BookingForm from "../components/BookingForm";

export default function PropertyDetail() {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomBlocks, setRoomBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", slug)
      .single();

    if (propertyError) {
      setError(propertyError.message);
      setLoading(false);
      return;
    }

    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .eq("property_id", propertyData.id)
      .order("price");

    if (roomsError) {
      setError(roomsError.message);
      setLoading(false);
      return;
    }

    const roomIds = roomsData.map((r) => r.id);
    const { data: blocksData, error: blocksError } = await supabase
      .from("room_blocks")
      .select("room_id, start_date, end_date")
      .in("room_id", roomIds.length > 0 ? roomIds : ["00000000-0000-0000-0000-000000000000"]);

    if (blocksError) {
      setError(blocksError.message);
      setLoading(false);
      return;
    }

    setProperty(propertyData);
    setRooms(roomsData);
    setRoomBlocks(blocksData);
    setError(null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-stone-400 text-sm">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm">Couldn't load this property: {error}</p>;
  if (!property) return null;

  return (
    <div>
      <Link to="/" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
        ← All properties
      </Link>

      <div className="mt-3 aspect-[16/7] bg-stone-100 rounded-lg overflow-hidden">
        {property.cover_photo_url ? (
          <img src={property.cover_photo_url} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
            No photo yet
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="font-serif text-2xl text-stone-800">{property.name}</h1>
          <p className="text-sm text-stone-500 mt-1">
            {property.area}
            {property.distance_from_kk_minutes != null &&
              ` · ${property.distance_from_kk_minutes} min from Kulture Konnect`}
          </p>
          {property.description && (
            <p className="text-stone-600 mt-4 leading-relaxed">{property.description}</p>
          )}

          <h2 className="font-serif text-lg text-stone-800 mt-8 mb-3">Rooms</h2>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id} className="border border-stone-200 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-stone-800">{room.name}</p>
                  <p className="text-stone-700">₹{Number(room.price).toLocaleString("en-IN")}/night</p>
                </div>
                <p className="text-sm text-stone-500 mt-0.5">
                  {room.room_type} · up to {room.max_guests} guests
                </p>
                {room.amenities?.length > 0 && (
                  <p className="text-sm text-stone-400 mt-1">{room.amenities.join(" · ")}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          {rooms.length > 0 ? (
            <BookingForm property={property} rooms={rooms} roomBlocks={roomBlocks} onBooked={load} />
          ) : (
            <p className="text-stone-400 text-sm">No rooms added for this property yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
