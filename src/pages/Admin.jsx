import { useState } from "react";
import AdminBookings from "../components/AdminBookings";
import AdminProperties from "../components/AdminProperties";

export default function Admin() {
  const [tab, setTab] = useState("properties");

  return (
    <div>
      <h1 className="font-serif text-2xl text-stone-900 mb-5 leading-none">Admin</h1>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[#e8e4df]">
        {[
          { id: "bookings", label: "Bookings" },
          { id: "properties", label: "Properties & rooms" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-stone-800 text-stone-900 font-medium"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "bookings" ? <AdminBookings /> : <AdminProperties />}
    </div>
  );
}
