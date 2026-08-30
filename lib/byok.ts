export function hasByokAccess(user: { byokEnabled?: boolean; plan?: string }): boolean {
  if (!user) return false;
  return user.byokEnabled === true || user.plan === "ADMIN";
}
