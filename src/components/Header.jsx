import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { signOut } = useAuth();
  const location = useLocation();

  const linkClass = (path) =>
    `text-sm transition-colors ${
      location.pathname === path ? "text-stone-900 font-medium" : "text-stone-500 hover:text-stone-800"
    }`;

  return (
    <header className="border-b border-[#e8e4df] bg-[#fbfaf8]">
      <div className="mx-auto flex h-[72px] max-w-[992px] items-center justify-between px-4 sm:px-0">
        <div>
          <p className="text-[10px] tracking-[0.32em] uppercase text-stone-400">Kulture Konnect</p>
          <Link to="/" className="font-serif text-[18px] text-stone-800 leading-tight">
            Partner Stays
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/" className={linkClass("/")}>Properties</Link>
          <Link to="/admin" className={linkClass("/admin")}>Admin</Link>
          <button
            onClick={signOut}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
