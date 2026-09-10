import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminBrand } from "../components/AdminBrand.jsx";
import { IconArrowLeft } from "../components/Icons.jsx";
import { adminFetch } from "../lib/api.js";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Portal";
    return () => {
      document.title = "Opsy | Founding Transactions";
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("/api/admin/login", { method: "POST", json: { password } });
      navigate("/admin/waitlist", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[380px] rounded-2xl border border-[#e6e0d4] bg-white p-8 shadow-[0_8px_24px_rgba(24,55,47,0.06)]"
      >
        <AdminBrand titleClassName="text-2xl" />
        <p className="mt-3 text-sm leading-6 text-forest-deep/65">
          Internal access for founding agent and homeowner waitlists.
        </p>
        <label className="mt-6 block text-[0.78rem] font-medium text-forest-deep/70">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2.5 text-sm text-forest-deep outline-none focus:border-forest"
            required
          />
        </label>
        {error ? <p className="mt-3 text-sm text-[#8b4a42]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-mid disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link
          to="/"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-forest/70 hover:text-forest"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to landing page
        </Link>
      </form>
    </div>
  );
}
