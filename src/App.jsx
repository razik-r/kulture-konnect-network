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

  // Admin loading screen
  if (adminArea && loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-stone-50 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg.png')",
        }}
      >
        <p className="text-stone-500 text-sm">Loading...</p>
      </div>
    );
  }

  // Admin login
  if (adminArea && !session) {
    return <Login />;
  }

  return (
    <div
      className="relative min-h-screen bg-stone-50"
     
    >
      


        <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/bg.png')",
      }}
    />

    {/* Background-only overlay */}
    <div className="fixed inset-0 bg-white/50" />

     <div className="
     relative z-10">
      <Header
        isAdminArea={adminArea}
        onSignOut={signOut}
      />

      <main className="mx-auto max-w-[992px] px-4 py-9 sm:px-6 lg:px-0">
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              adminArea ? <Admin /> : <PropertyList />
            }
          />

          {/* Property list */}
          <Route
            path="/properties"
            element={
              adminArea ? (
                <PropertyList />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Stay detail - booking available on both */}
          <Route
            path="/stays/:slug"
            element={<PropertyDetail />}
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              adminArea ? (
                <Admin />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Unknown route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
      </div>
    </div>
  );
}