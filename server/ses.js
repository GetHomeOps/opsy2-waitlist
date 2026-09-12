import { GetAccountCommand, SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

let client;

export function sesRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

export function sesFromEmail() {
  return String(process.env.SES_FROM_EMAIL || "")
    .trim()
    .toLowerCase();
}

export function sesFromName() {
  return String(process.env.SES_FROM_NAME || "Opsy").trim() || "Opsy";
}

export function hasSes() {
  return Boolean(sesFromEmail());
}

export function getSesClient() {
  if (!client) {
    client = new SESv2Client({ region: sesRegion() });
  }
  return client;
}

export function formattedFromAddress() {
  const email = sesFromEmail();
  const name = sesFromName();
  if (!email) return "";
  return name ? `${name} <${email}>` : email;
}

export async function sendSesEmail({ to, subject, text, html, replyTo }) {
  const from = formattedFromAddress();
  if (!from) {
    const error = new Error("SES_FROM_EMAIL is not configured.");
    error.status = 503;
    throw error;
  }

  const destination = String(to || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
    const error = new Error("A valid recipient email is required.");
    error.status = 400;
    throw error;
  }

  const reply = String(replyTo || process.env.SES_REPLY_TO || "")
    .trim()
    .toLowerCase();

  const result = await getSesClient().send(
    new SendEmailCommand({
      FromEmailAddress: from,
      ReplyToAddresses: reply ? [reply] : undefined,
      Destination: { ToAddresses: [destination] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: text, Charset: "UTF-8" },
            Html: { Data: html, Charset: "UTF-8" },
          },
        },
      },
    }),
  );

  return result.MessageId || null;
}

export async function getSesAccountStatus() {
  if (!hasSes()) {
    return {
      configured: false,
      region: sesRegion(),
      fromEmail: "",
      fromName: sesFromName(),
      productionAccess: false,
      sendingEnabled: false,
    };
  }

  try {
    const account = await getSesClient().send(new GetAccountCommand({}));
    return {
      configured: true,
      region: sesRegion(),
      fromEmail: sesFromEmail(),
      fromName: sesFromName(),
      productionAccess: Boolean(account.ProductionAccessEnabled),
      sendingEnabled: account.SendingEnabled !== false,
    };
  } catch {
    return {
      configured: true,
      region: sesRegion(),
      fromEmail: sesFromEmail(),
      fromName: sesFromName(),
      productionAccess: null,
      sendingEnabled: null,
    };
  }
}
