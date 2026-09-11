import { useEffect, useMemo, useState } from "react";
import { buyingTimelines } from "../../config/homeowner.js";
import { adminFetch } from "../lib/api.js";
import { formatDate, formatPhone, formatUsd, initialsFromEmail } from "../lib/format.js";
import {
  IconChart,
  IconCheck,
  IconHome,
  IconSearch,
  IconSort,
  IconUsers,
} from "../components/Icons.jsx";
import { StatusPill, YesNoPill } from "../components/StatusPills.jsx";
import { HomeownerDrawer } from "../components/HomeownerDrawer.jsx";

const PAGE_SIZE = 10;
const TABLE_COLUMNS = 7;

export function HomeownersPage() {
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [query, setQuery] = useState("");
  const [timeline, setTimeline] = useState("all");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState("asc");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (timeline !== "all") params.set("timeline", timeline);
      const data = await adminFetch(`/api/admin/homeowners?${params.toString()}`);
      setUsers(data.users || []);
      setKpis(data.kpis || null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => load(), query ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [query, timeline]);

  const sorted = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const left = String(a.email || "").toLowerCase();
      const right = String(b.email || "").toLowerCase();
      return sortDir === "asc" ? left.localeCompare(right) : right.localeCompare(left);
    });
    return copy;
  }, [users, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = users.find((user) => user.id === selectedId) || null;

  function clearFilters() {
    setQuery("");
    setTimeline("all");
    setPage(1);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <main className="min-w-0 flex-1 px-5 py-7 md:px-8 lg:px-10">
        <header>
          <h1 className="font-serif text-[2.35rem] font-semibold leading-none text-forest-deep">
            Homeowners
          </h1>
          <p className="mt-2 max-w-[42rem] text-[0.95rem] text-forest-deep/65">
            Households who paid $1 to lock the founding rate.
          </p>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<IconUsers className="h-4 w-4" />}
            label="Founding Households"
            value={kpis ? String(kpis.waitlistSignups) : "—"}
            hint="Paid founding households."
          />
          <KpiCard
            icon={<IconChart className="h-4 w-4" />}
            label="Spots Remaining"
            value={kpis ? `${kpis.remaining} of ${kpis.capacity}` : "—"}
            hint={kpis ? `${kpis.reservedPercent}% reserved.` : "Founding household cap."}
          />
          <KpiCard
            icon={<IconHome className="h-4 w-4" />}
            label="With Phone"
            value={kpis ? String(kpis.withPhone) : "—"}
            hint="Shared a mobile number."
          />
          <KpiCard
            icon={<IconCheck className="h-4 w-4" />}
            label="SMS Opt-in"
            value={kpis ? String(kpis.smsOptIn) : "—"}
            hint="Consented to text messages."
          />
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest-deep/40">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by email, phone, or market..."
              className="w-full rounded-xl border border-[#e6e0d4] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-forest"
            />
          </label>
          <select
            value={timeline}
            onChange={(event) => {
              setTimeline(event.target.value);
              setPage(1);
            }}
            className="admin-select rounded-xl border border-[#e6e0d4] bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-forest"
          >
            <option value="all">All timelines</option>
            {buyingTimelines.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-forest-deep/60 hover:text-forest-deep"
          >
            Clear
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-[#eadfc6] bg-[#f8f1de] px-4 py-3 text-sm text-[#7a6128]">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e6e0d4] bg-white">
          <div className="overflow-x-auto">
            <table
              className="min-w-[980px] w-full text-left text-sm"
              aria-busy={loading}
              aria-label="Homeowner waitlist"
            >
              <thead className="bg-[#f3f0e9] text-[0.72rem] font-semibold text-forest-deep/55">
                <tr>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => setSortDir((value) => (value === "asc" ? "desc" : "asc"))}
                    >
                      Email
                      <IconSort />
                    </button>
                  </th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Buying timeline</th>
                  <th className="px-4 py-3">SMS consent</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <tr className="sr-only">
                      <td colSpan={TABLE_COLUMNS}>Loading homeowners</td>
                    </tr>
                    <HomeownersSkeleton />
                  </>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS} className="px-4 py-10 text-center text-forest-deep/50">
                      No founding households yet. Homeowners appear after they lock the founding rate.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedId(user.id)}
                      className={`cursor-pointer border-t border-[#eee9de] ${
                        selectedId === user.id ? "bg-[#eef4f0]" : "hover:bg-[#f8f5ef]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f0ea] text-[0.7rem] font-semibold text-forest">
                            {initialsFromEmail(user.email)}
                          </span>
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-forest-deep/75">{formatPhone(user.phone)}</td>
                      <td className="px-4 py-3 text-forest-deep/75">{user.market || "—"}</td>
                      <td className="px-4 py-3">{user.buyingTimelineLabel}</td>
                      <td className="px-4 py-3">
                        <YesNoPill value={user.smsConsent} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusPill status={user.paymentStatus || "paid"} />
                          <span className="text-forest-deep/60">
                            {user.amountPaid == null ? "—" : formatUsd(user.amountPaid, { centsIfNeeded: true })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-forest-deep/75">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#eee9de] px-4 py-3 text-sm text-forest-deep/60">
            <p>
              Showing {sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} homeowners
            </p>
            <div className="flex items-center gap-1">
              <PageButton disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                ‹
              </PageButton>
              {Array.from({ length: pageCount }, (_, index) => (
                <PageButton
                  key={index}
                  active={currentPage === index + 1}
                  onClick={() => setPage(index + 1)}
                >
                  {index + 1}
                </PageButton>
              ))}
              <PageButton disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                ›
              </PageButton>
            </div>
          </div>
        </div>
      </main>

      {selected ? (
        <HomeownerDrawer user={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function Bone({ className = "", delay = 0 }) {
  return (
    <span
      className={`skeleton-bone inline-block rounded-md ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function HomeownersSkeleton({ rows = 6 }) {
  return Array.from({ length: rows }, (_, index) => {
    const delay = index * 90;
    return (
      <tr key={index} className="border-t border-[#eee9de]">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-full" delay={delay} />
            <Bone className="h-3.5 w-40" delay={delay + 40} />
          </div>
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-28" delay={delay + 60} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-24" delay={delay + 80} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-28" delay={delay + 100} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-5 w-12 rounded-full" delay={delay + 120} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-5 w-16 rounded-full" delay={delay + 130} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-24" delay={delay + 140} />
        </td>
      </tr>
    );
  });
}

function KpiCard({ icon, label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[#e6e0d4] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(24,55,47,0.04)]">
      <div className="flex items-center gap-2 text-[0.78rem] font-medium text-forest-deep/70">
        <span className="text-forest">{icon}</span>
        {label}
      </div>
      <p className="mt-3 font-serif text-[2rem] font-semibold leading-none">{value}</p>
      <p className="mt-2 text-[0.78rem] text-forest-deep/50">{hint}</p>
    </article>
  );
}

function PageButton({ children, onClick, disabled, active }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-8 min-w-8 rounded-lg px-2 text-sm ${
        active
          ? "bg-forest text-cream"
          : "text-forest-deep/70 hover:bg-[#efeae0] disabled:opacity-30"
      }`}
    >
      {children}
    </button>
  );
}
