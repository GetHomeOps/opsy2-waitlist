import { useEffect, useMemo, useState } from "react";
import { buildEmailContent } from "../../lib/emailRender.js";
import { adminFetch } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { IconCheck, IconInfo, IconMail, IconWarn } from "../components/Icons.jsx";

const SAMPLE_VARS = {
  homeowner: {
    firstName: "Jordan",
    email: "jordan@email.com",
    market: "Austin",
    buyingTimeline: "Within a year",
  },
  agent: {
    firstName: "Alex",
    email: "alex@brokerage.com",
    planName: "One Transaction",
    amountPaid: "$99",
  },
  all: {
    firstName: "Jordan",
    email: "jordan@email.com",
    market: "Austin",
    buyingTimeline: "Within a year",
    planName: "One Transaction",
    amountPaid: "$99",
  },
};

const VARIABLES = {
  homeowner: ["firstName", "email", "market", "buyingTimeline"],
  agent: ["firstName", "email", "planName", "amountPaid"],
  all: ["firstName", "email", "market", "buyingTimeline", "planName", "amountPaid"],
};

const emptyDraft = {
  name: "Launch update",
  audience: "all",
  subject: "",
  body: "",
};

function audienceLabel(audience) {
  if (audience === "homeowner") return "Homeowners";
  if (audience === "agent") return "Agents";
  return "Everyone";
}

function triggerLabel(trigger) {
  return trigger === "registration" ? "Sent on signup" : "Manual update";
}

export function EmailsPage() {
  const [templates, setTemplates] = useState([]);
  const [status, setStatus] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [testEmail, setTestEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const selected = templates.find((item) => item.id === selectedId) || null;
  const editor = creating ? draft : selected;
  const vars = SAMPLE_VARS[editor?.audience] || SAMPLE_VARS.all;

  const preview = useMemo(() => {
    if (!editor) return { subject: "", text: "", html: "" };
    return buildEmailContent(editor, vars);
  }, [editor, vars]);

  async function load({ selectId } = {}) {
    setError("");
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/emails");
      const next = data.templates || [];
      setTemplates(next);
      setStatus(data.status || null);
      setSelectedId((current) => selectId || current || next[0]?.id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateEditor(patch) {
    if (creating) {
      setDraft((current) => ({ ...current, ...patch }));
      return;
    }
    setTemplates((current) =>
      current.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)),
    );
  }

  async function save() {
    if (!editor) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (creating) {
        const data = await adminFetch("/api/admin/emails", {
          method: "POST",
          json: draft,
        });
        setCreating(false);
        setDraft(emptyDraft);
        await load({ selectId: data.template.id });
        setNotice("Update email created.");
      } else {
        const data = await adminFetch(`/api/admin/emails/${selected.id}`, {
          method: "PATCH",
          json: {
            name: selected.name,
            subject: selected.subject,
            body: selected.body,
            audience: selected.audience,
          },
        });
        setTemplates((current) =>
          current.map((item) =>
            item.id === data.template.id ? { ...item, ...data.template } : item,
          ),
        );
        setNotice("Template saved.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!selected || creating) return;
    setTesting(true);
    setError("");
    setNotice("");
    try {
      await adminFetch(`/api/admin/emails/${selected.id}/test`, {
        method: "POST",
        json: { email: testEmail },
      });
      setNotice(`Test email sent to ${testEmail.trim()}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  }

  function requestBroadcast() {
    if (!selected || selected.trigger !== "manual") return;
    setConfirm({
      title: "Send this update?",
      body: `This sends “${selected.name}” to ${selected.recipientCount} ${audienceLabel(selected.audience).toLowerCase()}.`,
      confirmLabel: "Send now",
      action: "send",
    });
  }

  function requestDelete() {
    if (!selected || selected.isSystem) return;
    setConfirm({
      title: "Delete this template?",
      body: "This cannot be undone. Past sends stay in the log.",
      confirmLabel: "Delete",
      danger: true,
      action: "delete",
    });
  }

  async function onConfirm() {
    if (!selected || !confirm) return;
    setConfirmBusy(true);
    setError("");
    setNotice("");
    try {
      if (confirm.action === "send") {
        const result = await adminFetch(`/api/admin/emails/${selected.id}/send`, {
          method: "POST",
          json: {},
        });
        setNotice(`Sent to ${result.sent} ${result.sent === 1 ? "person" : "people"}${result.failed ? `, ${result.failed} failed` : ""}.`);
      } else if (confirm.action === "delete") {
        await adminFetch(`/api/admin/emails/${selected.id}`, { method: "DELETE" });
        setSelectedId("");
        await load();
        setNotice("Template deleted.");
      }
      setConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmBusy(false);
    }
  }

  const sesReady = Boolean(status?.configured && status?.fromEmail);

  return (
    <main className="min-w-0 flex-1 px-5 py-7 md:px-8 lg:px-10">
      <header>
        <h1 className="font-serif text-[2.35rem] font-semibold leading-none text-forest-deep">
          Emails
        </h1>
        <p className="mt-2 max-w-[42rem] text-[0.95rem] text-forest-deep/65">
          Edit the first email people get when they join, then write later updates from here.
        </p>
      </header>

      {status ? (
        <div
          className={`mt-5 flex gap-3 rounded-2xl border px-4 py-4 text-sm ${
            sesReady
              ? "border-[#dfe8e2] bg-[#eef5f0] text-[#215746]"
              : "border-[#eadfc6] bg-[#f8f1de] text-[#7a6128]"
          }`}
        >
          {sesReady ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <IconWarn className="mt-0.5 h-4 w-4 shrink-0" />}
          <div>
            {sesReady ? (
              <>
                <p className="font-semibold">
                  Sending from {status.fromName} &lt;{status.fromEmail}&gt; in {status.region}.
                </p>
                {status.productionAccess === false ? (
                  <p className="mt-1 leading-6">
                    SES is still in the sandbox. Registration emails only deliver to verified
                    recipient addresses until AWS approves production access.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="font-semibold">Amazon SES is not configured yet.</p>
                <p className="mt-1 leading-6">
                  Set <code className="font-semibold">SES_FROM_EMAIL</code> and AWS credentials,
                  then save. Templates can still be edited.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-[#eadfc6] bg-[#f8f1de] px-4 py-3 text-sm text-[#7a6128]">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mt-4 rounded-xl border border-[#dfe8e2] bg-[#eef5f0] px-4 py-3 text-sm text-[#215746]">
          {notice}
        </div>
      ) : null}

      <div className="mt-7 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {loading ? (
            <p className="px-3 py-6 text-sm text-forest-deep/50">Loading templates…</p>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setCreating(false);
                  setSelectedId(template.id);
                  setNotice("");
                  setError("");
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                  !creating && selectedId === template.id
                    ? "border-forest bg-[#e7f0ea]"
                    : "border-[#e6e0d4] bg-white hover:bg-[#fbfaf6]"
                }`}
              >
                <p className="font-medium text-forest-deep">{template.name}</p>
                <p className="mt-1 text-[0.75rem] text-forest-deep/50">
                  {triggerLabel(template.trigger)} · {audienceLabel(template.audience)}
                </p>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setDraft(emptyDraft);
              setNotice("");
              setError("");
            }}
            className={`w-full rounded-2xl border border-dashed px-4 py-3 text-left text-sm font-medium ${
              creating
                ? "border-forest bg-[#e7f0ea] text-forest"
                : "border-[#d8d1c3] text-forest/80 hover:bg-white"
            }`}
          >
            + New update email
          </button>
        </aside>

        {editor ? (
          <section className="overflow-hidden rounded-2xl border border-[#e6e0d4] bg-white shadow-[0_4px_14px_rgba(24,55,47,0.04)]">
            <div className="border-b border-[#e6e0d4] px-5 py-4 md:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-forest">
                  <IconMail className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-[1.65rem] font-semibold leading-none">
                    {creating ? "New update" : editor.name}
                  </h2>
                  <p className="mt-2 text-sm text-forest-deep/55">
                    {creating
                      ? "Saved updates can be sent to the waitlist whenever you are ready."
                      : `${triggerLabel(editor.trigger)} · Last edited ${formatDateTime(editor.updatedAt)}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5 md:px-6">
              <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                Name
                <input
                  value={editor.name}
                  onChange={(event) => updateEditor({ name: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2.5 text-[0.95rem] font-normal normal-case tracking-normal text-forest-deep outline-none focus:border-forest"
                />
              </label>

              <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                Audience
                <select
                  value={editor.audience}
                  disabled={!creating && editor.isSystem}
                  onChange={(event) => updateEditor({ audience: event.target.value })}
                  className="admin-select mt-1.5 w-full rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2.5 pr-9 text-[0.95rem] font-normal normal-case tracking-normal text-forest-deep outline-none focus:border-forest disabled:opacity-70"
                >
                  <option value="homeowner">Homeowners</option>
                  <option value="agent">Agents</option>
                  <option value="all">Everyone</option>
                </select>
              </label>

              <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                Subject
                <input
                  value={editor.subject}
                  onChange={(event) => updateEditor({ subject: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2.5 text-[0.95rem] font-normal normal-case tracking-normal text-forest-deep outline-none focus:border-forest"
                />
              </label>

              <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                Body
                <textarea
                  value={editor.body}
                  onChange={(event) => updateEditor({ body: event.target.value })}
                  rows={12}
                  className="mt-1.5 w-full resize-y rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2.5 text-[0.95rem] font-normal normal-case tracking-normal text-forest-deep outline-none focus:border-forest"
                />
              </label>

              <div className="flex gap-2 rounded-xl border border-[#d7e2ea] bg-[#eef4f8] px-3 py-3 text-[0.8rem] leading-5 text-[#35586b]">
                <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Use {"{{"}
                  {VARIABLES[editor.audience].join("}}, {{")}
                  {"}}"} and we fill them in for each person.
                </p>
              </div>

              <div className="rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                  Preview
                </p>
                <p className="mt-2 text-sm text-forest-deep/55">
                  Subject: {preview.subject || "Subject will appear here"}
                </p>
                <iframe
                  title="Email preview"
                  srcDoc={preview.html}
                  className="mt-3 h-[640px] w-full rounded-xl border border-[#e6e0d4] bg-[#f6f1e7]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-mid disabled:opacity-60"
                >
                  {saving ? "Saving…" : creating ? "Create template" : "Save changes"}
                </button>
                {!creating && !editor.isSystem ? (
                  <button
                    type="button"
                    onClick={requestDelete}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#8b4a42] hover:bg-[#f6ece9]"
                  >
                    Delete
                  </button>
                ) : null}
              </div>

              {!creating ? (
                <div className="grid gap-3 border-t border-[#e6e0d4] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                    Send a test
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(event) => setTestEmail(event.target.value)}
                      placeholder="you@heyopsy.com"
                      className="mt-1.5 w-full rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2.5 text-[0.95rem] font-normal normal-case tracking-normal text-forest-deep outline-none focus:border-forest"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={sendTest}
                    disabled={testing || !testEmail.trim() || !sesReady}
                    className="rounded-xl border border-[#e6e0d4] bg-white px-4 py-2.5 text-sm font-semibold text-forest-deep hover:bg-[#fbfaf6] disabled:opacity-60"
                  >
                    {testing ? "Sending…" : "Send test"}
                  </button>
                </div>
              ) : null}

              {!creating && editor.trigger === "manual" ? (
                <button
                  type="button"
                  onClick={requestBroadcast}
                  disabled={!sesReady || !editor.recipientCount}
                  className="w-full rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-cream hover:bg-forest-mid disabled:opacity-60"
                >
                  Send to {editor.recipientCount} {audienceLabel(editor.audience).toLowerCase()}
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <p className="rounded-2xl border border-[#e6e0d4] bg-white px-5 py-10 text-sm text-forest-deep/55">
            {loading ? "Loading…" : "Create an update email to get started."}
          </p>
        )}
      </div>

      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          busy={confirmBusy}
          onConfirm={onConfirm}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </main>
  );
}
