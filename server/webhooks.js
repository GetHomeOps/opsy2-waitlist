import { getDb, dbError, landingTables } from "./db.js";
import { getStripe } from "./stripe.js";
import { PACKAGES } from "./packages.js";
import { markRefunded, upsertFromCheckoutSession } from "./reservations.js";

async function alreadyProcessed(eventId) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.stripeEvents)
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw new Error(dbError(error));
  return Boolean(data);
}

async function markProcessed(event) {
  const db = getDb();
  const { error } = await db.from(landingTables.stripeEvents).upsert(
    { id: event.id, event_type: event.type },
    { onConflict: "id" },
  );
  if (error) throw new Error(dbError(error));
}

function isFoundingSession(session) {
  return (
    session?.metadata?.product === "founding_transactions" &&
    Boolean(PACKAGES[session?.metadata?.package])
  );
}

function paymentStatusFromSession(session) {
  if (session.payment_status === "paid") return "paid";
  return "pending";
}

async function handleCheckoutSession(session, forcedStatus) {
  if (!isFoundingSession(session)) return;
  await upsertFromCheckoutSession(session, forcedStatus || paymentStatusFromSession(session));
}

async function handleRefundEvent(object) {
  const paymentIntentId =
    typeof object.payment_intent === "string"
      ? object.payment_intent
      : object.payment_intent?.id || null;

  if (object.object === "charge" && object.refunded === true) {
    await markRefunded({ paymentIntentId });
  }
}

export async function processStripeWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  if (await alreadyProcessed(event.id)) {
    return { received: true, duplicate: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutSession(
        event.data.object,
        event.type === "checkout.session.async_payment_succeeded" ? "paid" : undefined,
      );
      break;
    case "checkout.session.async_payment_failed":
      await handleCheckoutSession(event.data.object, "pending");
      break;
    case "charge.refunded":
      await handleRefundEvent(event.data.object);
      break;
    default:
      break;
  }

  await markProcessed(event);
  return { received: true };
}
