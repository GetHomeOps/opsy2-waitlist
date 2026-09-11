import { useEffect, useState } from "react";
import { adminFetch } from "../lib/api.js";
import { formatDateTime, formatPhone, formatUsd, initialsFromEmail } from "../lib/format.js";
import { IconClose, IconCopy } from "./Icons.jsx";
import { YesNoPill } from "./StatusPills.jsx";

export function HomeownerDrawer({ user, onClose }) {
  const [copied, setCopied] = useState("");

  async function copy(label, value) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1200);
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
            {initialsFromEmail(user.email)}
          </span>
          <h2 className="mt-4 break-all font-serif text-[1.45rem] font-semibold leading-tight">
            {user.email}
          </h2>
          <p className="mt-2 text-sm text-forest-deep/55">
            Founding household. {user.amountPaid == null ? "No charge recorded." : `Paid ${formatUsd(user.amountPaid, { centsIfNeeded: true })}.`}
          </p>
        </div>

        <CopyRow
          value={user.email}
          copied={copied === "email"}
          onCopy={() => copy("email", user.email)}
          copyLabel="Copy email"
        />
        <CopyRow
          value={formatPhone(user.phone)}
          copied={copied === "phone"}
          onCopy={() => copy("phone", user.phone)}
          copyLabel="Copy phone"
        />

        <dl className="mt-6 space-y-4 text-sm">
          <Row label="Market / city" value={user.market || "—"} />
          <Row label="Buying timeline" value={user.buyingTimelineLabel} />
          <div>
            <dt className="text-[0.78rem] text-forest-deep/50">SMS consent</dt>
            <dd className="mt-1">
              <YesNoPill value={user.smsConsent} />
            </dd>
          </div>
          <Row label="Paid" value={user.amountPaid == null ? "—" : formatUsd(user.amountPaid, { centsIfNeeded: true })} />
          <Row label="Joined" value={formatDateTime(user.purchasedAt || user.createdAt)} />
        </dl>
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

function CopyRow({ value, onCopy, copied, copyLabel }) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2 text-sm text-forest-deep/70">
      <span>{value || "—"}</span>
      <button type="button" onClick={onCopy} className="text-forest" aria-label={copyLabel}>
        <IconCopy className="h-4 w-4" />
      </button>
      {copied ? <span className="text-[0.7rem] text-forest">Copied</span> : null}
    </div>
  );
}
