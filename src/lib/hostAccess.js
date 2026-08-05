export function isAdminHost(hostname = window.location.hostname, pathname = window.location.pathname) {
  const normalized = hostname.toLowerCase();
  const isAdminSubdomain = normalized === "admin.localhost" || normalized.startsWith("admin.");
  // Allow admin via path when in dev, or when the VITE_ALLOW_ADMIN_PATH env var is set to 'true'.
  // This lets you run admin under the same domain (e.g. example.com/admin) when enabled in production.
  const allowAdminPath = import.meta.env.DEV || import.meta.env.VITE_ALLOW_ADMIN_PATH === "true";
  const isAdminPath = allowAdminPath && pathname.startsWith("/admin");

  return isAdminSubdomain || isAdminPath;
}
