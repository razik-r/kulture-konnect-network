import { Link } from "react-router-dom";

export default function PropertyCard({ property, fromPrice }) {
  return (
    <Link
      to={`/stays/${property.slug}`}
      className="group block overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        {property.cover_photo_url ? (
          <img
            src={property.cover_photo_url}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
            No photo yet
          </div>
        )}

        {property.distance_from_kk_minutes != null && (
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-stone-700 shadow-sm">
            {property.distance_from_kk_minutes} min
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl text-stone-900 truncate">{property.name}</h3>
        <p className="text-sm text-stone-500 mt-2 line-clamp-2">
          {property.area}
        </p>
        {fromPrice != null && (
          <div className="mt-4 flex items-center justify-between text-sm text-stone-700">
            <span className="font-medium">From</span>
            <span className="font-semibold">₹{fromPrice.toLocaleString("en-IN")}/night</span>
          </div>
        )}
      </div>
    </Link>
  );
}
