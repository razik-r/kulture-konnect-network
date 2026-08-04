import { Link, useLocation } from "react-router-dom";

export default function Header({ isAdminArea = false, onSignOut }) {
  const location = useLocation();

  const linkClass = (path) =>
    `text-sm transition-colors ${
      location.pathname === path ? "text-stone-900 font-medium" : "text-stone-500 hover:text-stone-800"
    }`;
  const adminLinkClass = `text-sm transition-colors ${
    location.pathname === "/" || location.pathname === "/admin"
      ? "text-stone-900 font-medium"
      : "text-stone-500 hover:text-stone-800"
  }`;

  return (
    <header className="border-b border-[#e8e4df] bg-[#fbfaf8]">
      <div className="mx-auto flex h-[72px] max-w-[992px] items-center justify-between px-4 sm:px-0">
        <div>
         
         
          <Link to="/" className="font-serif text-[18px] text-stone-800 leading-tight">
           <div className="flex flex-row justify-center items-center gap-2">
 <img src="/logo.png" alt="Kulture Konnect" className="h-6 w-auto mb-1" />
          <p className="text-[10px] tracking-[0.32em] uppercase text-stone-400">Kulture Konnect</p>
          
          </div>
           
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link to={isAdminArea ? "/properties" : "/"} className={linkClass(isAdminArea ? "/properties" : "/")}>Properties</Link>
          {isAdminArea && (
            <>
              <Link to="/" className={adminLinkClass}>Admin</Link>
              <button
                onClick={onSignOut}
                className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
