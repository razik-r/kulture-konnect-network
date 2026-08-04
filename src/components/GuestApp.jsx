import { Routes, Route, Navigate } from "react-router-dom";
import GuestHeader from "./components/GuestHeader";
import Footer from "./components/Footer";
import PropertyList from "./pages/PropertyList";
import PropertyDetail from "./pages/PropertyDetail";

export default function GuestApp() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <GuestHeader />
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <Routes>
          <Route path="/" element={<PropertyList />} />
          <Route path="/stays/:slug" element={<PropertyDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}