import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-1">Kulture Konnect</p>
          <h1 className="font-serif text-3xl text-stone-800">Staff sign in</h1>
        </div>

        <div>
          <label className="block text-sm text-stone-500 mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-500 mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-stone-800 text-white rounded-md py-2.5 font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-stone-400 text-center">
          Staff accounts are created in the Supabase dashboard — there's no self-signup.
        </p>
      </form>
    </div>
  );
}
