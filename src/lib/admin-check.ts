/** Pure admin check shared by the proxy and server code: configured admin email AND verified. */
export function isAdminUser(user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin || !user?.email) return false;
  return user.email.toLowerCase() === admin && Boolean(user.email_confirmed_at);
}
