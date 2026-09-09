export async function adminFetch(path, options = {}) {
  const { json, ...rest } = options;
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    ...rest,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.includes("/admin/login")) {
    if (!window.location.pathname.startsWith("/admin/login")) {
      window.location.assign("/admin/login");
    }
    const error = new Error("Unauthorized.");
    error.status = 401;
    error.data = data;
    throw error;
  }

  if (!res.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
