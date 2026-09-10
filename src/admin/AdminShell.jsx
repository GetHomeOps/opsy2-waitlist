import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminFetch } from "./lib/api.js";
import { AdminBrand } from "./components/AdminBrand.jsx";
import { IconArrowLeft, IconClose, IconHome, IconMenu, IconTag, IconUsers } from "./components/Icons.jsx";

const nav = [
  { to: "/admin/waitlist", label: "Agents", icon: IconUsers },
  { to: "/admin/homeowners", label: "Homeowners", icon: IconHome },
  { to: "/admin/pricing", label: "Pricing Plans", icon: IconTag },
];

export function AdminShell() {
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Admin Portal";
    return () => {
      document.title = "Opsy | Founding Transactions";
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/admin/session")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        if (!cancelled && error.status === 401) {
          navigate("/admin/login", { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function logout() {
    try {
      await adminFetch("/api/admin/logout", { method: "POST", json: {} });
    } catch {
      // Still leave the portal so a failed request cannot keep a stale shell mounted.
    }
    window.location.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] text-sm text-forest-deep/60">
        Loading Admin Portal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-forest-deep">
      <div className="flex min-h-screen">
        {menuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-forest-deep/20 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-[#e6e0d4] bg-[#f7f4ee] px-4 py-5 transition-transform lg:static lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex items-start justify-between gap-2 px-1">
            <AdminBrand />
            <button
              type="button"
              className="rounded-md p-1 text-forest/70 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-colors",
                      isActive
                        ? "bg-[#e7f0ea] text-forest"
                        : "text-forest-deep/70 hover:bg-[#efeae0] hover:text-forest-deep",
                    ].join(" ")
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto px-2 pb-1">
            <Link
              to="/"
              className="mb-3 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-forest/70 hover:text-forest"
            >
              <IconArrowLeft className="h-3.5 w-3.5" />
              Back to landing
            </Link>
            <button
              type="button"
              onClick={logout}
              className="mb-4 block text-left text-[0.8rem] font-medium text-forest/70 hover:text-forest"
            >
              Sign out
            </button>
            <p className="max-w-[11.5rem] text-[0.72rem] leading-5 text-forest-deep/45">
              Building what&apos;s next. A more human real estate industry.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-[#e6e0d4] px-4 py-3 lg:hidden">
            <button
              type="button"
              className="rounded-lg border border-[#e6e0d4] bg-white p-2 text-forest"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <IconMenu className="h-4 w-4" />
            </button>
            <AdminBrand compact />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
