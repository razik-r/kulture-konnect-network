import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import Login from "./pages/Login";
import PropertyList from "./pages/PropertyList";
import PropertyDetail from "./pages/PropertyDetail";
import Admin from "./pages/Admin";
import { isAdminHost } from "./lib/hostAccess";

export default function App() {
  const { session, loading, signOut } = useAuth();
  const adminArea = isAdminHost();

  if (adminArea && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (adminArea && !session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      
      <Header isAdminArea={adminArea} onSignOut={signOut} />
      <main className="mx-auto max-w-[992px] px-4 py-9 sm:px-0">
        <Routes>
          <Route path="/" element={adminArea ? <Admin /> : <PropertyList />} />
          <Route path="/properties" element={adminArea ? <PropertyList /> : <Navigate to="/" replace />} />
       <Route
  path="/stays/:slug"
  element={<PropertyDetail />}
/>
          <Route path="/admin" element={adminArea ? <Admin /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
