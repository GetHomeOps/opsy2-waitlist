export async function fetchFoundingPricing() {
  try {
    const res = await fetch("/api/founding-pricing");
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export async function handleCheckout(plan) {
  const params = new URLSearchParams(window.location.search);

  const res = await fetch("/api/founding-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      package: plan,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      referrer: document.referrer || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Checkout is unavailable right now.");
  }

  window.location.href = data.url;
}
