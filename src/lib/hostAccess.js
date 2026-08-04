export function isAdminHost(hostname = window.location.hostname, pathname = window.location.pathname) {
  const normalized = hostname.toLowerCase();
  const isAdminSubdomain = normalized === "admin.localhost" || normalized.startsWith("admin.");
  const isLocalDevHost = normalized === "localhost" || normalized === "127.0.0.1";
  const isLocalAdminPath = import.meta.env.DEV && isLocalDevHost && pathname.startsWith("/admin");

  return isAdminSubdomain || isLocalAdminPath;
}
