import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import PropertyCard from "../components/PropertyCard";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*, rooms(price)")
        .eq("status", "active")
        .order("name");

      if (error) {
        setError(error.message);
      } else {
        setProperties(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-stone-400 text-sm">Loading properties…</p>;
  if (error) return <p className="text-red-600 text-sm">Couldn't load properties: {error}</p>;
  if (properties.length === 0)
    return <p className="text-stone-500 text-sm">No partner properties added yet — add one in Admin.</p>;

  return (
    <div className="space-y-8">
      <section className="rounded-[20px] border border-stone-200 bg-white px-6 py-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.32em] text-stone-400 mb-3">Partner stays</p>
          <h1 className="font-serif text-4xl text-stone-900 mb-4">Partner properties</h1>
          <p className="text-stone-600 text-base leading-7">
            Kulture Konnect is full — here’s what’s available nearby. Browse trusted partner stays that are ready for your guests.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            fromPrice={
              property.rooms.length > 0 ? Math.min(...property.rooms.map((r) => r.price)) : null
            }
          />
        ))}
      </div>
    </div>
  );
}
