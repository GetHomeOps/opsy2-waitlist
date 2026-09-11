import { buildEmailContent } from "../src/lib/emailRender.js";
import { dbError, getDb, landingTables } from "./db.js";
import { PACKAGES } from "./packages.js";
import { hasSes, sendSesEmail, getSesAccountStatus } from "./ses.js";

const HOMEOWNER_AUDIENCE = "homeowner";
const BUYING_TIMELINES = {
  in_contract: "In contract",
  within_a_year: "Within a year",
  already_home: "Already home",
};

const SYSTEM_SLUGS = new Set(["waitlist-welcome", "homeowner-welcome", "agent-welcome"]);
const WELCOME_SLUG = "waitlist-welcome";
const AUDIENCES = new Set(["homeowner", "agent", "all"]);
const TRIGGERS = new Set(["registration", "manual"]);

function field(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "update";
}

export function firstNameFrom({ name, email }) {
  const fromName = field(name, 80).split(/\s+/)[0];
  if (fromName.length >= 2) return fromName;
  const local = String(email || "").split("@")[0];
  const token = local.split(/[._-]/)[0];
  if (!token || token.length < 2) return "there";
  return token[0].toUpperCase() + token.slice(1).toLowerCase();
}

export function formatAmount(cents) {
  const value = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function serializeTemplate(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    audience: row.audience,
    trigger: row.trigger,
    subject: row.subject,
    body: row.body,
    isSystem: Boolean(row.is_system),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEmailTemplates() {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.emailTemplates)
    .select("*")
    .order("trigger", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(dbError(error));
  return (data || []).map(serializeTemplate);
}

export async function getEmailTemplate(id) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.emailTemplates)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(dbError(error));
  return data ? serializeTemplate(data) : null;
}

async function getTemplateBySlug(slug) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.emailTemplates)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(dbError(error));
  return data ? serializeTemplate(data) : null;
}

export async function createEmailTemplate(body) {
  const name = field(body.name, 80);
  const subject = field(body.subject, 200);
  const templateBody = String(body.body ?? "").trim();
  const audience = field(body.audience, 20);
  if (!name) {
    const error = new Error("Please enter a template name.");
    error.status = 400;
    throw error;
  }
  if (!subject || !templateBody) {
    const error = new Error("Subject and body are required.");
    error.status = 400;
    throw error;
  }
  if (!AUDIENCES.has(audience)) {
    const error = new Error("Audience must be homeowner, agent, or all.");
    error.status = 400;
    throw error;
  }

  const db = getDb();
  let slug = slugify(body.slug || name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await db
      .from(landingTables.emailTemplates)
      .insert({
        slug,
        name,
        audience,
        trigger: "manual",
        subject,
        body: templateBody,
        is_system: false,
      })
      .select("*")
      .single();
    if (!error) return serializeTemplate(data);
    if (error.code !== "23505") throw new Error(dbError(error));
    slug = `${slugify(name)}-${attempt + 2}`;
  }

  const failed = new Error("Could not create a unique template slug.");
  failed.status = 409;
  throw failed;
}

export async function updateEmailTemplate(id, body) {
  const existing = await getEmailTemplate(id);
  if (!existing) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }

  const patch = {};
  if (body.name !== undefined) {
    const name = field(body.name, 80);
    if (!name) {
      const error = new Error("Please enter a template name.");
      error.status = 400;
      throw error;
    }
    patch.name = name;
  }
  if (body.subject !== undefined) {
    const subject = field(body.subject, 200);
    if (!subject) {
      const error = new Error("Subject is required.");
      error.status = 400;
      throw error;
    }
    patch.subject = subject;
  }
  if (body.body !== undefined) {
    const templateBody = String(body.body ?? "").trim();
    if (!templateBody) {
      const error = new Error("Body is required.");
      error.status = 400;
      throw error;
    }
    patch.body = templateBody;
  }
  if (!existing.isSystem && body.audience !== undefined) {
    const audience = field(body.audience, 20);
    if (!AUDIENCES.has(audience)) {
      const error = new Error("Audience must be homeowner, agent, or all.");
      error.status = 400;
      throw error;
    }
    patch.audience = audience;
  }
  if (!existing.isSystem && body.trigger !== undefined) {
    const trigger = field(body.trigger, 20);
    if (!TRIGGERS.has(trigger)) {
      const error = new Error("Trigger must be registration or manual.");
      error.status = 400;
      throw error;
    }
    patch.trigger = trigger;
  }

  if (Object.keys(patch).length === 0) return existing;

  const db = getDb();
  const { data, error } = await db
    .from(landingTables.emailTemplates)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(dbError(error));
  return serializeTemplate(data);
}

export async function deleteEmailTemplate(id) {
  const existing = await getEmailTemplate(id);
  if (!existing) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }
  if (existing.isSystem || SYSTEM_SLUGS.has(existing.slug)) {
    const error = new Error("Welcome emails cannot be deleted.");
    error.status = 400;
    throw error;
  }

  const db = getDb();
  const { error } = await db.from(landingTables.emailTemplates).delete().eq("id", id);
  if (error) throw new Error(dbError(error));
  return { ok: true };
}

export async function countTemplateRecipients(audience) {
  const db = getDb();
  let homeowners = 0;
  let agents = 0;

  if (audience === "homeowner" || audience === "all") {
    const { count, error } = await db
      .from(landingTables.waitlist)
      .select("id", { count: "exact", head: true })
      .eq("audience", HOMEOWNER_AUDIENCE);
    if (error) throw new Error(dbError(error));
    homeowners = count || 0;
  }

  if (audience === "agent" || audience === "all") {
    const { count, error } = await db
      .from(landingTables.reservations)
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .is("deleted_at", null);
    if (error) throw new Error(dbError(error));
    agents = count || 0;
  }

  return {
    homeowners,
    agents,
    total: homeowners + agents,
  };
}

async function listBroadcastRecipients(audience) {
  const db = getDb();
  const recipients = [];

  if (audience === "homeowner" || audience === "all") {
    const { data, error } = await db
      .from(landingTables.waitlist)
      .select("id, email, market, buying_timeline")
      .eq("audience", HOMEOWNER_AUDIENCE);
    if (error) throw new Error(dbError(error));
    for (const row of data || []) {
      recipients.push({
        email: row.email,
        waitlistId: row.id,
        vars: homeownerVars(row),
      });
    }
  }

  if (audience === "agent" || audience === "all") {
    const { data, error } = await db
      .from(landingTables.reservations)
      .select("id, agent_name, email, package, amount_paid")
      .eq("payment_status", "paid")
      .is("deleted_at", null);
    if (error) throw new Error(dbError(error));
    for (const row of data || []) {
      recipients.push({
        email: row.email,
        reservationId: row.id,
        vars: agentVars(row),
      });
    }
  }

  return recipients;
}

export function homeownerVars(row) {
  return {
    firstName: firstNameFrom({ email: row.email }),
    email: row.email,
    market: row.market || "",
    buyingTimeline: BUYING_TIMELINES[row.buying_timeline] || row.buying_timeline || "",
  };
}

export function agentVars(row) {
  const catalog = PACKAGES[row.package] || {};
  return {
    firstName: firstNameFrom({ name: row.agent_name, email: row.email }),
    email: row.email,
    planName: catalog.displayName || row.package || "",
    amountPaid: formatAmount(row.amount_paid),
  };
}

async function recordSend({
  templateId,
  trigger,
  recipientEmail,
  waitlistId,
  reservationId,
  sesMessageId,
  errorMessage,
}) {
  const db = getDb();
  const { error } = await db.from(landingTables.emailSends).insert({
    template_id: templateId,
    trigger,
    recipient_email: recipientEmail,
    waitlist_id: waitlistId || null,
    reservation_id: reservationId || null,
    ses_message_id: sesMessageId || null,
    error: errorMessage || null,
  });
  if (error && error.code !== "23505") {
    console.error("[email] failed to record send", error.message);
  }
  return !error || error.code === "23505";
}

async function claimRegistrationSend({ templateId, recipientEmail, waitlistId, reservationId }) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.emailSends)
    .insert({
      template_id: templateId,
      trigger: "registration",
      recipient_email: recipientEmail,
      waitlist_id: waitlistId || null,
      reservation_id: reservationId || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(dbError(error));
  }
  return data.id;
}

async function completeRegistrationSend(id, { sesMessageId, errorMessage }) {
  const db = getDb();
  const { error } = await db
    .from(landingTables.emailSends)
    .update({
      ses_message_id: sesMessageId || null,
      error: errorMessage || null,
    })
    .eq("id", id);
  if (error) console.error("[email] failed to update send", error.message);
}

async function deliverTemplate(template, { to, vars, replyTo }) {
  const content = buildEmailContent(template, vars);
  const messageId = await sendSesEmail({
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    replyTo,
  });
  return { ...content, messageId };
}

export async function sendRegistrationEmail({ audience, to, vars, waitlistId, reservationId }) {
  if (!hasSes()) {
    console.warn("[email] SES is not configured; skipped registration email.");
    return { skipped: true };
  }

  const template =
    (await getTemplateBySlug(WELCOME_SLUG)) ||
    (await getTemplateBySlug(audience === "agent" ? "agent-welcome" : "homeowner-welcome"));
  if (!template) {
    console.warn(`[email] missing template ${WELCOME_SLUG}`);
    return { skipped: true };
  }

  let claimId;
  try {
    claimId = await claimRegistrationSend({
      templateId: template.id,
      recipientEmail: to,
      waitlistId,
      reservationId,
    });
  } catch (error) {
    console.error("[email] could not claim registration send", error.message);
    return { skipped: true };
  }
  if (!claimId) return { skipped: true, duplicate: true };

  try {
    const delivered = await deliverTemplate(template, { to, vars });
    await completeRegistrationSend(claimId, { sesMessageId: delivered.messageId });
    return { ok: true, messageId: delivered.messageId };
  } catch (error) {
    await completeRegistrationSend(claimId, { errorMessage: error.message });
    console.error("[email] registration send failed", error.message);
    return { ok: false, error: error.message };
  }
}

export async function sendTestEmail(id, email) {
  const to = field(email, 254).toLowerCase();
  if (!isValidEmail(to)) {
    const error = new Error("Please enter a valid email.");
    error.status = 400;
    throw error;
  }

  const template = await getEmailTemplate(id);
  if (!template) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }

  const homeowner = homeownerVars({
    email: to,
    market: "Austin",
    buying_timeline: "within_a_year",
  });
  const agent = agentVars({
    agent_name: "Alex Rivera",
    email: to,
    package: "one",
    amount_paid: 9900,
  });
  const vars =
    template.audience === "agent"
      ? agent
      : template.audience === "all"
        ? { ...homeowner, ...agent }
        : homeowner;

  const delivered = await deliverTemplate(template, { to, vars });
  await recordSend({
    templateId: template.id,
    trigger: "test",
    recipientEmail: to,
    sesMessageId: delivered.messageId,
  });
  return { ok: true, messageId: delivered.messageId };
}

export async function sendBroadcast(id) {
  const template = await getEmailTemplate(id);
  if (!template) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }
  if (template.trigger !== "manual") {
    const error = new Error("Welcome emails send automatically. Create an update email to send a list.");
    error.status = 400;
    throw error;
  }

  const recipients = await listBroadcastRecipients(template.audience);
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      const delivered = await deliverTemplate(template, {
        to: recipient.email,
        vars: recipient.vars,
      });
      await recordSend({
        templateId: template.id,
        trigger: "broadcast",
        recipientEmail: recipient.email,
        waitlistId: recipient.waitlistId,
        reservationId: recipient.reservationId,
        sesMessageId: delivered.messageId,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      await recordSend({
        templateId: template.id,
        trigger: "broadcast",
        recipientEmail: recipient.email,
        waitlistId: recipient.waitlistId,
        reservationId: recipient.reservationId,
        errorMessage: error.message,
      });
    }
  }

  return { ok: true, sent, failed, total: recipients.length };
}

export async function emailAdminPayload() {
  const [templates, status] = await Promise.all([
    listEmailTemplates(),
    getSesAccountStatus(),
  ]);
  const counts = {};
  await Promise.all(
    ["homeowner", "agent", "all"].map(async (audience) => {
      counts[audience] = await countTemplateRecipients(audience);
    }),
  );
  return {
    templates: templates.map((template) => ({
      ...template,
      recipientCount: counts[template.audience]?.total || 0,
    })),
    status,
    recipientCounts: counts,
  };
}
