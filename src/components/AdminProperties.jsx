import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const emptyProperty = {
  name: "",
  area: "",
  address: "",
  distance_from_kk_minutes: "",
  description: "",
  partner_whatsapp_number: "",
  cover_photo_url: "",
};

const emptyRoom = {
  name: "",
  room_type: "",
  price: "",
  max_guests: 2,
  amenities: "",
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newProperty, setNewProperty] = useState(emptyProperty);
  const [addingProperty, setAddingProperty] = useState(false);

  const [roomDrafts, setRoomDrafts] = useState({});
  const [addingRoomFor, setAddingRoomFor] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*, rooms(*)")
      .order("name");
    if (error) setError(error.message);
    else setProperties(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddProperty(e) {
    e.preventDefault();
    setAddingProperty(true);
    try {
      const slug = slugify(newProperty.name);
      const { error } = await supabase.from("properties").insert({
        ...newProperty,
        slug,
        distance_from_kk_minutes: newProperty.distance_from_kk_minutes
          ? Number(newProperty.distance_from_kk_minutes)
          : null,
      });
      if (error) throw error;
      setNewProperty(emptyProperty);
      await load();
    } catch (err) {
      alert(`Couldn't add property: ${err.message ?? err}`);
    } finally {
      setAddingProperty(false);
    }
  }

  async function toggleStatus(property) {
    const nextStatus = property.status === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("properties")
      .update({ status: nextStatus })
      .eq("id", property.id);
    if (error) alert(error.message);
    else load();
  }

  function updateRoomDraft(propertyId, field, value) {
    setRoomDrafts((prev) => ({
      ...prev,
      [propertyId]: { ...(prev[propertyId] ?? emptyRoom), [field]: value },
    }));
  }

  async function handleAddRoom(propertyId) {
    const draft = roomDrafts[propertyId] ?? emptyRoom;
    if (!draft.name || !draft.price) {
      alert("Room name and price are required.");
      return;
    }
    setAddingRoomFor(propertyId);
    try {
      const { error } = await supabase.from("rooms").insert({
        property_id: propertyId,
        name: draft.name,
        room_type: draft.room_type || null,
        price: Number(draft.price),
        max_guests: Number(draft.max_guests) || 1,
        amenities: draft.amenities
          ? draft.amenities.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
      });
      if (error) throw error;
      setRoomDrafts((prev) => ({ ...prev, [propertyId]: emptyRoom }));
      await load();
    } catch (err) {
      alert(`Couldn't add room: ${err.message ?? err}`);
    } finally {
      setAddingRoomFor(null);
    }
  }

  if (loading) return <p className="text-stone-400 text-sm">Loading properties...</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="min-h-[134px] rounded-lg border border-[#e3dfda] bg-[#fbfaf8] px-4 py-[19px]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-stone-900 leading-snug">{property.name}</p>
                <p className="text-xs text-stone-400 leading-relaxed">{property.partner_whatsapp_number}</p>
              </div>
              <button
                onClick={() => toggleStatus(property)}
                className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs leading-none transition-colors ${
                  property.status === "active"
                    ? "border-green-200 text-green-700 hover:bg-green-50"
                    : "border-stone-200 text-stone-400 hover:bg-stone-50"
                }`}
              >
                {property.status === "active" ? "Active - click to pause" : "Paused - click to activate"}
              </button>
            </div>

            <ul className="mt-[15px] space-y-1">
              {property.rooms.map((room) => (
                <li
                  key={room.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 text-sm text-stone-700"
                >
                  <span className="min-w-0 truncate">{room.name}</span>
                  <span className="text-right text-stone-800">
                    &#8377;{Number(room.price).toLocaleString("en-IN")}/night
                  </span>
                </li>
              ))}
              {property.rooms.length === 0 && (
                <li className="text-sm text-stone-300">No rooms added yet</li>
              )}
            </ul>

            <details className="mt-3">
              <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                + Add a room
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  placeholder="Room name"
                  value={roomDrafts[property.id]?.name ?? ""}
                  onChange={(e) => updateRoomDraft(property.id, "name", e.target.value)}
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Room type (e.g. Double)"
                  value={roomDrafts[property.id]?.room_type ?? ""}
                  onChange={(e) => updateRoomDraft(property.id, "room_type", e.target.value)}
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Price/night"
                  type="number"
                  value={roomDrafts[property.id]?.price ?? ""}
                  onChange={(e) => updateRoomDraft(property.id, "price", e.target.value)}
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Max guests"
                  type="number"
                  value={roomDrafts[property.id]?.max_guests ?? 2}
                  onChange={(e) => updateRoomDraft(property.id, "max_guests", e.target.value)}
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Amenities, comma separated"
                  value={roomDrafts[property.id]?.amenities ?? ""}
                  onChange={(e) => updateRoomDraft(property.id, "amenities", e.target.value)}
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm sm:col-span-2"
                />
                <button
                  onClick={() => handleAddRoom(property.id)}
                  disabled={addingRoomFor === property.id}
                  className="rounded-md bg-stone-800 py-1.5 text-sm text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2"
                >
                  {addingRoomFor === property.id ? "Adding..." : "Add room"}
                </button>
              </div>
            </details>
          </div>
        ))}
      </div>

      <details className="min-h-[62px] rounded-lg border border-[#e3dfda] bg-[#fbfaf8] px-4 py-[18px]">
        <summary className="font-serif text-lg text-stone-900 cursor-pointer">+ Add a partner property</summary>
        <form onSubmit={handleAddProperty} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            placeholder="Property name"
            required
            value={newProperty.name}
            onChange={(e) => setNewProperty((p) => ({ ...p, name: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />
          <input
            placeholder="Area (e.g. Varkala)"
            value={newProperty.area}
            onChange={(e) => setNewProperty((p) => ({ ...p, area: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />
          <input
            placeholder="Address"
            value={newProperty.address}
            onChange={(e) => setNewProperty((p) => ({ ...p, address: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
          />
          <input
            placeholder="Minutes from Kulture Konnect"
            type="number"
            value={newProperty.distance_from_kk_minutes}
            onChange={(e) => setNewProperty((p) => ({ ...p, distance_from_kk_minutes: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />
          <input
            placeholder="Partner WhatsApp number (+91...)"
            required
            value={newProperty.partner_whatsapp_number}
            onChange={(e) => setNewProperty((p) => ({ ...p, partner_whatsapp_number: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />
          <input
            placeholder="Cover photo URL"
            value={newProperty.cover_photo_url}
            onChange={(e) => setNewProperty((p) => ({ ...p, cover_photo_url: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
          />
          <textarea
            placeholder="Short description"
            value={newProperty.description}
            onChange={(e) => setNewProperty((p) => ({ ...p, description: e.target.value }))}
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
            rows={2}
          />
          <button
            type="submit"
            disabled={addingProperty}
            className="rounded-md bg-stone-800 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2"
          >
            {addingProperty ? "Adding..." : "Add property"}
          </button>
        </form>
      </details>
    </div>
  );
}
