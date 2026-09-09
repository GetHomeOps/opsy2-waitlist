import { useEffect, useState } from "react";
import { adminFetch } from "../lib/api.js";
import { formatDateTime, formatUsd, initials } from "../lib/format.js";
import { IconClose, IconCopy, IconDoc, IconExternal } from "./Icons.jsx";
import { StatusPill, YesNoPill } from "./StatusPills.jsx";

export function UserDrawer({ user, onClose, onUpdated }) {
  const [notes, setNotes] = useState(user.internalNotes || "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setNotes(user.internalNotes || "");
  }, [user.id, user.internalNotes]);

  async function copy(label, value) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1200);
  }

  async function saveNotes() {
    if (notes === (user.internalNotes || "")) return;
    const data = await adminFetch(`/api/admin/waitlist/${user.id}`, {
      method: "PATCH",
      json: { internalNotes: notes },
    });
    onUpdated(data.user);
  }

  async function markDocs() {
    setBusy(true);
    try {
      const data = await adminFetch(`/api/admin/waitlist/${user.id}/docs-received`, {
        method: "POST",
        json: {},
      });
      onUpdated(data.user);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-20 bg-forest-deep/15 md:hidden"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside className="fixed inset-0 z-30 flex w-full flex-col overflow-y-auto border-l border-[#e6e0d4] bg-[#fbfaf6] px-6 py-5 md:static md:z-0 md:max-w-[380px] md:shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-md p-1 text-forest-deep/50 hover:text-forest-deep"
          aria-label="Close"
        >
          <IconClose className="h-4 w-4" />
        </button>

        <div className="mt-2 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f0ea] font-serif text-xl font-semibold text-forest">
            {initials(user.agentName)}
          </span>
          <h2 className="mt-4 font-serif text-[1.85rem] font-semibold leading-none">{user.agentName}</h2>
          <p className="mt-2 text-sm text-forest-deep/55">Joined the waitlist.</p>
        </div>

        <CopyRow
          value={user.email}
          copied={copied === "email"}
          onCopy={() => copy("email", user.email)}
        />

        <section className="mt-6">
          <h3 className="text-[0.72rem] font-semibold text-forest-deep/45">
            Selected Plan
          </h3>
          <p className="mt-2 font-serif text-2xl font-semibold">{user.planName}</p>
          <p className="mt-1 text-sm leading-6 text-forest-deep/60">
            {user.tagline} • {user.quantityReserved} founding transaction
            {user.quantityReserved === 1 ? "" : "s"} • Priority onboarding.
          </p>
        </section>

        <dl className="mt-6 space-y-4 text-sm">
          <Row label="Amount Paid" value={`${formatUsd(user.amountPaid)} USD`} />
          <Row label="Purchase Date" value={formatDateTime(user.purchasedAt)} />
          <div>
            <dt className="text-[0.78rem] text-forest-deep/50">Payment Status</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  user.paymentStatus === "paid"
                    ? "bg-[#2f7a5d]"
                    : user.paymentStatus === "pending"
                      ? "bg-[#c4a15f]"
                      : "bg-[#8b4a42]"
                }`}
              />
              <StatusPill status={user.paymentStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-[0.78rem] text-forest-deep/50">Refund Eligible</dt>
            <dd className="mt-1 flex items-center gap-2">
              <YesNoPill value={user.refundEligible} />
              <span className="text-[0.78rem] leading-5 text-forest-deep/55">
                {user.refundEligible
                  ? "Eligible for refund until first documents are received."
                  : user.firstDocumentsReceivedAt
                    ? "Not eligible — documents received."
                    : "Not eligible."}
              </span>
            </dd>
          </div>
        </dl>

        <section className="mt-7">
          <h3 className="text-[0.72rem] font-semibold text-forest-deep/45">
            Stripe Details
          </h3>
          <div className="mt-3 space-y-3">
            <IdRow
              label="Session ID"
              value={user.stripeCheckoutSessionId}
              copied={copied === "session"}
              onCopy={() => copy("session", user.stripeCheckoutSessionId)}
            />
            <IdRow
              label="Customer ID"
              value={user.stripeCustomerId}
              copied={copied === "customer"}
              onCopy={() => copy("customer", user.stripeCustomerId)}
            />
            <IdRow
              label="Payment Intent"
              value={user.stripePaymentIntentId}
              copied={copied === "intent"}
              onCopy={() => copy("intent", user.stripePaymentIntentId)}
            />
          </div>

          <a
            href={user.stripeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-forest px-4 py-2.5 text-sm font-semibold text-forest hover:bg-[#e7f0ea]"
          >
            <IconExternal className="h-4 w-4" />
            Open in Stripe
          </a>
          <button
            type="button"
            disabled={busy || Boolean(user.firstDocumentsReceivedAt)}
            onClick={markDocs}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-mid disabled:opacity-50"
          >
            <IconDoc className="h-4 w-4" />
            {user.firstDocumentsReceivedAt ? "Docs Received" : "Mark Docs Received"}
          </button>
        </section>

        <label className="mt-7 block">
          <span className="text-[0.72rem] font-semibold text-forest-deep/45">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={saveNotes}
            placeholder="Add an internal note..."
            className="mt-2 min-h-[96px] w-full resize-y rounded-xl border border-[#e6e0d4] bg-white px-3 py-2 text-sm outline-none focus:border-forest"
          />
        </label>
      </aside>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-[0.78rem] text-forest-deep/50">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function CopyRow({ value, onCopy, copied }) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2 text-sm text-forest-deep/70">
      <span>{value}</span>
      <button type="button" onClick={onCopy} className="text-forest" aria-label="Copy email">
        <IconCopy className="h-4 w-4" />
      </button>
      {copied ? <span className="text-[0.7rem] text-forest">Copied</span> : null}
    </div>
  );
}

function IdRow({ label, value, onCopy, copied }) {
  return (
    <div className="rounded-xl border border-[#e6e0d4] bg-white px-3 py-2">
      <p className="text-[0.68rem] font-semibold text-forest-deep/40">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-mono text-[0.78rem]">{value || "—"}</p>
        {value ? (
          <button type="button" onClick={onCopy} className="text-forest" aria-label={`Copy ${label}`}>
            <IconCopy className="h-4 w-4" />
          </button>
        ) : null}
        {copied ? <span className="text-[0.68rem] text-forest">Copied</span> : null}
      </div>
    </div>
  );
}
