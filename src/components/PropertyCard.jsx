import { Link } from "react-router-dom";

export default function PropertyCard({ property, fromPrice }) {
  return (
    <Link
      to={`/stays/${property.slug}`}
      className="group block border border-stone-200 rounded-lg overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
        {property.cover_photo_url ? (
          <img
            src={property.cover_photo_url}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
            No photo yet
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-stone-800">{property.name}</h3>
        <p className="text-sm text-stone-500 mt-0.5">
          {property.area}
          {property.distance_from_kk_minutes != null &&
            ` · ${property.distance_from_kk_minutes} min from Kulture Konnect`}
        </p>
        {fromPrice != null && (
          <p className="text-sm text-stone-700 mt-2">From ₹{fromPrice.toLocaleString("en-IN")}/night</p>
        )}
      </div>
    </Link>
  );
}
