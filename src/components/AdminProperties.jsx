import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const emptyProperty = {
  name: "",
  area: "",
  address: "",
  distance_from_kk_minutes: "",
  description: "",
  partner_whatsapp_number: "",
};

const emptyRoom = {
  name: "",
  room_type: "",
  price: "",
  max_guests: 2,
  amenities: "",
};

const propertyPhotoBucket = "property-photos";

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

  // Add property
  const [newProperty, setNewProperty] = useState(emptyProperty);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState("");
  const [coverPhotoInputKey, setCoverPhotoInputKey] = useState(0);
  const [addingProperty, setAddingProperty] = useState(false);

  // Edit property
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [editProperty, setEditProperty] = useState(emptyProperty);
  const [editCoverPhotoFile, setEditCoverPhotoFile] = useState(null);
  const [editCoverPhotoPreview, setEditCoverPhotoPreview] = useState("");
  const [editCoverPhotoInputKey, setEditCoverPhotoInputKey] = useState(0);
  const [savingProperty, setSavingProperty] = useState(false);

  // Rooms
  const [roomDrafts, setRoomDrafts] = useState({});
  const [addingRoomFor, setAddingRoomFor] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("properties")
      .select("*, rooms(*)")
      .order("name");

    if (error) {
      setError(error.message);
    } else {
      setProperties(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Preview for adding a new property's cover image
  useEffect(() => {
    if (!coverPhotoFile) {
      setCoverPhotoPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(coverPhotoFile);
    setCoverPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [coverPhotoFile]);

  // Preview for replacing an existing property's cover image
  useEffect(() => {
    if (!editCoverPhotoFile) {
      setEditCoverPhotoPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(editCoverPhotoFile);
    setEditCoverPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [editCoverPhotoFile]);

  async function uploadCoverPhoto(file, slug) {
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      throw new Error("Cover photo must be an image file.");
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const path = `${slug}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(propertyPhotoBucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(propertyPhotoBucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // ----------------------------------------
  // ADD PROPERTY
  // ----------------------------------------

  async function handleAddProperty(e) {
    e.preventDefault();
    setAddingProperty(true);

    try {
      const slug = slugify(newProperty.name);

      const coverPhotoUrl = await uploadCoverPhoto(
        coverPhotoFile,
        slug
      );

      const { error } = await supabase
        .from("properties")
        .insert({
          ...newProperty,
          slug,
          cover_photo_url: coverPhotoUrl,
          distance_from_kk_minutes:
            newProperty.distance_from_kk_minutes
              ? Number(newProperty.distance_from_kk_minutes)
              : null,
        });

      if (error) throw error;

      setNewProperty(emptyProperty);
      setCoverPhotoFile(null);
      setCoverPhotoInputKey((key) => key + 1);

      await load();
    } catch (err) {
      alert(`Couldn't add property: ${err.message ?? err}`);
    } finally {
      setAddingProperty(false);
    }
  }

  // ----------------------------------------
  // EDIT PROPERTY
  // ----------------------------------------

  function startEditingProperty(property) {
    setEditingPropertyId(property.id);

    setEditProperty({
      name: property.name ?? "",
      area: property.area ?? "",
      address: property.address ?? "",
      distance_from_kk_minutes:
        property.distance_from_kk_minutes ?? "",
      description: property.description ?? "",
      partner_whatsapp_number:
        property.partner_whatsapp_number ?? "",
    });

    setEditCoverPhotoFile(null);
    setEditCoverPhotoPreview("");
    setEditCoverPhotoInputKey((key) => key + 1);
  }

  function cancelEditingProperty() {
    setEditingPropertyId(null);
    setEditProperty(emptyProperty);
    setEditCoverPhotoFile(null);
    setEditCoverPhotoPreview("");
    setEditCoverPhotoInputKey((key) => key + 1);
  }

  async function handleEditProperty(e, property) {
    e.preventDefault();

    setSavingProperty(true);

    try {
      let coverPhotoUrl = property.cover_photo_url;

      // Only upload a new image if the user selected one.
      if (editCoverPhotoFile) {
        const slug = slugify(editProperty.name);

        coverPhotoUrl = await uploadCoverPhoto(
          editCoverPhotoFile,
          slug
        );
      }

      const updatedSlug = slugify(editProperty.name);

      const { error } = await supabase
        .from("properties")
        .update({
          name: editProperty.name,
          slug: updatedSlug,
          area: editProperty.area,
          address: editProperty.address,
          distance_from_kk_minutes:
            editProperty.distance_from_kk_minutes
              ? Number(editProperty.distance_from_kk_minutes)
              : null,
          description: editProperty.description,
          partner_whatsapp_number:
            editProperty.partner_whatsapp_number,
          cover_photo_url: coverPhotoUrl,
        })
        .eq("id", property.id);

      if (error) throw error;

      setEditingPropertyId(null);
      setEditProperty(emptyProperty);
      setEditCoverPhotoFile(null);
      setEditCoverPhotoPreview("");
      setEditCoverPhotoInputKey((key) => key + 1);

      await load();
    } catch (err) {
      alert(
        `Couldn't update property: ${err.message ?? err}`
      );
    } finally {
      setSavingProperty(false);
    }
  }

  // ----------------------------------------
  // STATUS
  // ----------------------------------------

  async function toggleStatus(property) {
    const nextStatus =
      property.status === "active" ? "paused" : "active";

    const { error } = await supabase
      .from("properties")
      .update({ status: nextStatus })
      .eq("id", property.id);

    if (error) {
      alert(error.message);
    } else {
      load();
    }
  }

  // ----------------------------------------
  // ADD ROOM
  // ----------------------------------------

  function updateRoomDraft(propertyId, field, value) {
    setRoomDrafts((prev) => ({
      ...prev,
      [propertyId]: {
        ...(prev[propertyId] ?? emptyRoom),
        [field]: value,
      },
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
      const { error } = await supabase
        .from("rooms")
        .insert({
          property_id: propertyId,
          name: draft.name,
          room_type: draft.room_type || null,
          price: Number(draft.price),
          max_guests: Number(draft.max_guests) || 1,
          amenities: draft.amenities
            ? draft.amenities
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean)
            : [],
        });

      if (error) throw error;

      setRoomDrafts((prev) => ({
        ...prev,
        [propertyId]: emptyRoom,
      }));

      await load();
    } catch (err) {
      alert(`Couldn't add room: ${err.message ?? err}`);
    } finally {
      setAddingRoomFor(null);
    }
  }

  // ----------------------------------------
  // LOADING / ERROR
  // ----------------------------------------

  if (loading) {
    return (
      <p className="text-stone-400 text-sm">
        Loading properties...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600 text-sm">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* ======================================== */}
      {/* PROPERTIES */}
      {/* ======================================== */}

      <div className="space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="min-h-[134px] rounded-lg border border-[#e3dfda] bg-[#fbfaf8] px-4 py-[19px]"
          >
            {/* PROPERTY HEADER */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-stone-900 leading-snug">
                  {property.name}
                </p>

                <p className="text-xs text-stone-400 leading-relaxed">
                  {property.partner_whatsapp_number}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingPropertyId === property.id) {
                      cancelEditingProperty();
                    } else {
                      startEditingProperty(property);
                    }
                  }}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
                >
                  {editingPropertyId === property.id
                    ? "Close edit"
                    : "Edit"}
                </button>

                <button
                  type="button"
                  onClick={() => toggleStatus(property)}
                  className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs leading-none transition-colors ${
                    property.status === "active"
                      ? "border-green-200 text-green-700 hover:bg-green-50"
                      : "border-stone-200 text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  {property.status === "active"
                    ? "Active - click to pause"
                    : "Paused - click to activate"}
                </button>
              </div>
            </div>

            {/* ======================================== */}
            {/* EDIT PROPERTY FORM */}
            {/* ======================================== */}

            {editingPropertyId === property.id && (
              <form
                onSubmit={(e) =>
                  handleEditProperty(e, property)
                }
                className="mt-4 grid grid-cols-1 gap-3 border-t border-stone-200 pt-4 sm:grid-cols-2"
              >
                <input
                  placeholder="Property name"
                  required
                  value={editProperty.name}
                  onChange={(e) =>
                    setEditProperty((p) => ({
                      ...p,
                      name: e.target.value,
                    }))
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
                />

                <input
                  placeholder="Area (e.g. Varkala)"
                  value={editProperty.area}
                  onChange={(e) =>
                    setEditProperty((p) => ({
                      ...p,
                      area: e.target.value,
                    }))
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
                />

                <input
                  placeholder="Address"
                  value={editProperty.address}
                  onChange={(e) =>
                    setEditProperty((p) => ({
                      ...p,
                      address: e.target.value,
                    }))
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
                />

                <input
                  placeholder="Minutes from Kulture Konnect"
                  type="number"
                  value={
                    editProperty.distance_from_kk_minutes
                  }
                  onChange={(e) =>
                    setEditProperty((p) => ({
                      ...p,
                      distance_from_kk_minutes:
                        e.target.value,
                    }))
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
                />

                <input
                  placeholder="Partner WhatsApp number (+91...)"
                  required
                  value={
                    editProperty.partner_whatsapp_number
                  }
                  onChange={(e) =>
                    setEditProperty((p) => ({
                      ...p,
                      partner_whatsapp_number:
                        e.target.value,
                    }))
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
                />

                {/* COVER PHOTO */}

                <div className="sm:col-span-2">
                  <label
                    className="block text-xs text-stone-500 mb-1"
                    htmlFor={`editCoverPhoto-${property.id}`}
                  >
                    Cover photo
                  </label>

                  {/* Existing image */}
                  {!editCoverPhotoPreview &&
                    property.cover_photo_url && (
                      <div className="mb-3 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                        <img
                          src={property.cover_photo_url}
                          alt={`${property.name} cover`}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    )}

                  {/* Newly selected image */}
                  {editCoverPhotoPreview && (
                    <div className="mb-3 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                      <img
                        src={editCoverPhotoPreview}
                        alt="New cover preview"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  <input
                    key={editCoverPhotoInputKey}
                    id={`editCoverPhoto-${property.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setEditCoverPhotoFile(
                        e.target.files?.[0] ?? null
                      )
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-800 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-stone-700"
                  />

                  {editCoverPhotoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditCoverPhotoFile(null);
                        setEditCoverPhotoPreview("");
                        setEditCoverPhotoInputKey(
                          (key) => key + 1
                        );
                      }}
                      className="mt-2 text-xs text-stone-400 hover:text-stone-600"
                    >
                      Use existing photo instead
                    </button>
                  )}
                </div>

                <textarea
                  placeholder="Short description"
                  value={editProperty.description}
                  onChange={(e) =>
                    setEditProperty((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
                  rows={2}
                />

                {/* EDIT ACTIONS */}

                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="button"
                    onClick={cancelEditingProperty}
                    disabled={savingProperty}
                    className="flex-1 rounded-md border border-stone-300 bg-white py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingProperty}
                    className="flex-1 rounded-md bg-stone-800 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
                  >
                    {savingProperty
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </form>
            )}

            {/* ======================================== */}
            {/* ROOMS */}
            {/* ======================================== */}

            <ul className="mt-[15px] space-y-1">
              {property.rooms.map((room) => (
                <li
                  key={room.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 text-sm text-stone-700"
                >
                  <span className="min-w-0 truncate">
                    {room.name}
                  </span>

                  <span className="text-right text-stone-800">
                    &#8377;
                    {Number(room.price).toLocaleString(
                      "en-IN"
                    )}
                    /night
                  </span>
                </li>
              ))}

              {property.rooms.length === 0 && (
                <li className="text-sm text-stone-300">
                  No rooms added yet
                </li>
              )}
            </ul>

            {/* ======================================== */}
            {/* ADD ROOM */}
            {/* ======================================== */}

            <details className="mt-3">
              <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                + Add a room
              </summary>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  placeholder="Room name"
                  value={
                    roomDrafts[property.id]?.name ?? ""
                  }
                  onChange={(e) =>
                    updateRoomDraft(
                      property.id,
                      "name",
                      e.target.value
                    )
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />

                <input
                  placeholder="Room type (e.g. Double)"
                  value={
                    roomDrafts[property.id]?.room_type ??
                    ""
                  }
                  onChange={(e) =>
                    updateRoomDraft(
                      property.id,
                      "room_type",
                      e.target.value
                    )
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />

                <input
                  placeholder="Price/night"
                  type="number"
                  value={
                    roomDrafts[property.id]?.price ?? ""
                  }
                  onChange={(e) =>
                    updateRoomDraft(
                      property.id,
                      "price",
                      e.target.value
                    )
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />

                <input
                  placeholder="Max guests"
                  type="number"
                  value={
                    roomDrafts[property.id]
                      ?.max_guests ?? 2
                  }
                  onChange={(e) =>
                    updateRoomDraft(
                      property.id,
                      "max_guests",
                      e.target.value
                    )
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm"
                />

                <input
                  placeholder="Amenities, comma separated"
                  value={
                    roomDrafts[property.id]?.amenities ??
                    ""
                  }
                  onChange={(e) =>
                    updateRoomDraft(
                      property.id,
                      "amenities",
                      e.target.value
                    )
                  }
                  className="border border-stone-300 rounded-md bg-white px-2.5 py-1.5 text-sm sm:col-span-2"
                />

                <button
                  type="button"
                  onClick={() =>
                    handleAddRoom(property.id)
                  }
                  disabled={
                    addingRoomFor === property.id
                  }
                  className="rounded-md bg-stone-800 py-1.5 text-sm text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2"
                >
                  {addingRoomFor === property.id
                    ? "Adding..."
                    : "Add room"}
                </button>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* ======================================== */}
      {/* ADD PROPERTY */}
      {/* ======================================== */}

      <details className="min-h-[62px] rounded-lg border border-[#e3dfda] bg-[#fbfaf8] px-4 py-[18px]">
        <summary className="font-serif text-lg text-stone-900 cursor-pointer">
          + Add a partner property
        </summary>

        <form
          onSubmit={handleAddProperty}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <input
            placeholder="Property name"
            required
            value={newProperty.name}
            onChange={(e) =>
              setNewProperty((p) => ({
                ...p,
                name: e.target.value,
              }))
            }
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />

          <input
            placeholder="Area (e.g. Varkala)"
            value={newProperty.area}
            onChange={(e) =>
              setNewProperty((p) => ({
                ...p,
                area: e.target.value,
              }))
            }
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />

          <input
            placeholder="Address"
            value={newProperty.address}
            onChange={(e) =>
              setNewProperty((p) => ({
                ...p,
                address: e.target.value,
              }))
            }
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
          />

          <input
            placeholder="Minutes from Kulture Konnect"
            type="number"
            value={
              newProperty.distance_from_kk_minutes
            }
            onChange={(e) =>
              setNewProperty((p) => ({
                ...p,
                distance_from_kk_minutes:
                  e.target.value,
              }))
            }
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />

          <input
            placeholder="Partner WhatsApp number (+91...)"
            required
            value={
              newProperty.partner_whatsapp_number
            }
            onChange={(e) =>
              setNewProperty((p) => ({
                ...p,
                partner_whatsapp_number:
                  e.target.value,
              }))
            }
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm"
          />

          {/* COVER PHOTO */}

          <div className="sm:col-span-2">
            <label
              className="block text-xs text-stone-500 mb-1"
              htmlFor="coverPhoto"
            >
              Cover photo
            </label>

            <input
              key={coverPhotoInputKey}
              id="coverPhoto"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setCoverPhotoFile(
                  e.target.files?.[0] ?? null
                )
              }
              className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-800 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-stone-700"
            />

            {coverPhotoPreview && (
              <div className="mt-3 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                <img
                  src={coverPhotoPreview}
                  alt="Selected cover preview"
                  className="h-40 w-full object-cover"
                />
              </div>
            )}
          </div>

          <textarea
            placeholder="Short description"
            value={newProperty.description}
            onChange={(e) =>
              setNewProperty((p) => ({
                ...p,
                description: e.target.value,
              }))
            }
            className="border border-stone-300 rounded-md bg-white px-2.5 py-2 text-sm sm:col-span-2"
            rows={2}
          />

          <button
            type="submit"
            disabled={addingProperty}
            className="rounded-md bg-stone-800 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2"
          >
            {addingProperty
              ? "Adding..."
              : "Add property"}
          </button>
        </form>
      </details>
    </div>
  );
}