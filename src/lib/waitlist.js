export async function fetchHouseholdCount() {
  try {
    const res = await fetch("/api/founding-households");
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.count !== "number") return null;
    return {
      count: data.count,
      cap: typeof data.cap === "number" ? data.cap : 250,
      amount: typeof data.amount === "number" ? data.amount : 1,
    };
  } catch {
    return null;
  }
}

export async function registerHousehold(details) {
  const params = new URLSearchParams(window.location.search);
  const res = await fetch("/api/founding-households", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: details.email,
      phone: details.phone,
      market: details.market,
      buyingTimeline: details.buyingTimeline,
      smsConsent: details.smsConsent,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      referrer: document.referrer || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(
      data.error || "We couldn't complete your registration. Please try again shortly.",
    );
    error.status = res.status;
    throw error;
  }
  if (data.url) {
    window.location.href = data.url;
  }
  return data;
}
