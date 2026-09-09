import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/api.js";
import { formatDate, formatPhone, formatUsd, initials } from "../lib/format.js";
import {
  IconCard,
  IconChart,
  IconCoins,
  IconRefund,
  IconRefresh,
  IconSearch,
  IconSort,
  IconUsers,
} from "../components/Icons.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { StatusPill, YesNoPill } from "../components/StatusPills.jsx";
import { UserDrawer } from "../components/UserDrawer.jsx";

const PAGE_SIZE = 10;
const TABLE_COLUMNS = 9;

export function WaitlistPage() {
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState("asc");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  async function load({ sync = false, quiet = false } = {}) {
    if (!quiet) setLoading(true);
    setError("");
    if (sync) setSyncing(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (plan !== "all") params.set("plan", plan);
      if (status !== "all") params.set("status", status);

      let data;
      if (sync) {
        try {
          data = await adminFetch(`/api/admin/waitlist/sync?${params.toString()}`, {
            method: "POST",
            json: {},
          });
        } catch (err) {
          data = await adminFetch(`/api/admin/waitlist?${params.toString()}`);
          setError(err.message);
        }
      } else {
        data = await adminFetch(`/api/admin/waitlist?${params.toString()}`);
      }

      setUsers(data.users || []);
      setKpis(data.kpis || null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!quiet) setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => load(), query ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [query, plan, status]);

  const sorted = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const left = String(a.agentName || "").toLowerCase();
      const right = String(b.agentName || "").toLowerCase();
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
    setPlan("all");
    setStatus("all");
    setPage(1);
  }

  function onUpdated(next) {
    setUsers((current) => current.map((user) => (user.id === next.id ? next : user)));
  }

  async function runConfirm() {
    if (!confirm) return;
    setConfirmBusy(true);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/waitlist/${confirm.id}/refund`, {
        method: "POST",
        json: {},
      });
      onUpdated(data.user);
      setConfirm(null);
      await load({ quiet: true });
    } catch (err) {
      setError(err.message);
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <main className="min-w-0 flex-1 px-5 py-7 md:px-8 lg:px-10">
        <header>
          <h1 className="font-serif text-[2.35rem] font-semibold leading-none text-forest-deep">
            Waitlist Users
          </h1>
          <p className="mt-2 max-w-[42rem] text-[0.95rem] text-forest-deep/65">
            Agents who joined the founding transactions waitlist and paid through Stripe.
          </p>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<IconUsers className="h-4 w-4" />}
            label="Waitlist Signups"
            value={kpis ? String(kpis.waitlistSignups) : "—"}
            hint="Total agents joined."
          />
          <KpiCard
            icon={<IconCard className="h-4 w-4" />}
            label="Paid Agents"
            value={kpis ? String(kpis.paidAgents) : "—"}
            hint="Completed payments."
          />
          <KpiCard
            icon={<IconCoins className="h-4 w-4 text-[#c4a15f]" />}
            label="Revenue Collected"
            labelClassName="text-[#b0893e]"
            value={kpis ? formatUsd(kpis.revenueCents, { centsIfNeeded: true }) : "—"}
            hint="Through Stripe."
          />
          <KpiCard
            icon={<IconChart className="h-4 w-4" />}
            label="Reservations Remaining"
            value={kpis ? `${kpis.remainingTransactions} of ${kpis.capacity}` : "—"}
            hint={kpis ? `${kpis.reservedPercent}% reserved.` : "Paid waitlist spots."}
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
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-xl border border-[#e6e0d4] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-forest"
            />
          </label>
          <select
            value={plan}
            onChange={(event) => {
              setPlan(event.target.value);
              setPage(1);
            }}
            className="admin-select rounded-xl border border-[#e6e0d4] bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-forest"
          >
            <option value="all">All Plans</option>
            <option value="one">One Transaction</option>
            <option value="three">Three Transactions</option>
            <option value="five">Five Transactions</option>
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="admin-select rounded-xl border border-[#e6e0d4] bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-forest"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-forest-deep/60 hover:text-forest-deep"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={syncing}
            onClick={() => load({ sync: true })}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-forest hover:bg-[#e7f0ea] disabled:opacity-50"
          >
            <IconRefresh className="h-4 w-4" />
            {syncing ? "Syncing…" : "Sync Stripe"}
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
              className="min-w-[1080px] w-full text-left text-sm"
              aria-busy={loading}
              aria-label="Waitlist users"
            >
              <thead className="bg-[#f3f0e9] text-[0.72rem] font-semibold text-forest-deep/55">
                <tr>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => setSortDir((value) => (value === "asc" ? "desc" : "asc"))}
                    >
                      Name
                      <IconSort />
                    </button>
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Refund Eligible</th>
                  <th className="px-4 py-3">Purchase Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <tr className="sr-only">
                      <td colSpan={TABLE_COLUMNS}>
                        {syncing ? "Syncing paid reservations from Stripe" : "Loading waitlist users"}
                      </td>
                    </tr>
                    <WaitlistSkeleton />
                  </>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS} className="px-4 py-10 text-center text-forest-deep/50">
                      No waitlist users yet. Paid reservations, including coupon checkouts, appear after Stripe checkout completes.
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
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f0ea] text-[0.7rem] font-semibold text-forest">
                            {initials(user.agentName)}
                          </span>
                          <span className="font-medium">{user.agentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-forest-deep/75">{user.email}</td>
                      <td className="px-4 py-3 text-forest-deep/75">{formatPhone(user.phone)}</td>
                      <td className="px-4 py-3">{user.planName}</td>
                      <td className="px-4 py-3">{formatUsd(user.amountPaid, { centsIfNeeded: true })}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={user.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <YesNoPill value={user.refundEligible} />
                      </td>
                      <td className="px-4 py-3 text-forest-deep/75">{formatDate(user.purchasedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Refund"
                            disabled={!user.canRefund}
                            onClick={(event) => {
                              event.stopPropagation();
                              setConfirm(user);
                            }}
                            className="rounded-lg p-1.5 text-forest hover:bg-[#e7f0ea] disabled:opacity-30"
                          >
                            <IconRefund className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#eee9de] px-4 py-3 text-sm text-forest-deep/60">
            <p>
              Showing {sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} users
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
        <UserDrawer
          user={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={onUpdated}
          onRefund={() => setConfirm(selected)}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title="Refund this reservation?"
          body={
            Number(confirm.amountPaid || 0) > 0
              ? `Refund ${formatUsd(confirm.amountPaid, { centsIfNeeded: true })} to ${confirm.agentName}. They will stay on the waitlist and be flagged as canceled.`
              : `There is no Stripe charge to refund. ${confirm.agentName} will stay on the waitlist and be flagged as canceled.`
          }
          confirmLabel="Refund"
          busy={confirmBusy}
          onCancel={() => {
            if (!confirmBusy) setConfirm(null);
          }}
          onConfirm={runConfirm}
        />
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

function WaitlistSkeleton({ rows = 6 }) {
  return Array.from({ length: rows }, (_, index) => {
    const delay = index * 90;
    return (
      <tr key={index} className="border-t border-[#eee9de]">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-full" delay={delay} />
            <Bone className="h-3.5 w-28" delay={delay + 40} />
          </div>
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-40" delay={delay + 60} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-28" delay={delay + 80} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-32" delay={delay + 100} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-12" delay={delay + 120} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-5 w-14 rounded-full" delay={delay + 140} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-5 w-12 rounded-full" delay={delay + 160} />
        </td>
        <td className="px-4 py-3">
          <Bone className="h-3.5 w-24" delay={delay + 180} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Bone className="h-7 w-7 rounded-lg" delay={delay + 200} />
          </div>
        </td>
      </tr>
    );
  });
}

function KpiCard({ icon, label, value, hint, labelClassName = "" }) {
  return (
    <article className="rounded-2xl border border-[#e6e0d4] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(24,55,47,0.04)]">
      <div className={`flex items-center gap-2 text-[0.78rem] font-medium ${labelClassName || "text-forest-deep/70"}`}>
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
