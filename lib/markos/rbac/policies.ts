export type MarkOSRole = "owner" | "operator" | "strategist" | "viewer" | "agent";

export type RouteKey =
  | "dashboard"
  | "operations"
  | "company"
  | "mir"
  | "msp"
  | "icps"
  | "segments"
  | "campaigns"
  | "settings";

const routePermissions: Record<RouteKey, MarkOSRole[]> = {
  dashboard: ["owner", "operator", "strategist", "viewer", "agent"],
  operations: ["owner", "operator"],
  company: ["owner", "operator", "strategist", "agent"],
  mir: ["owner", "operator", "strategist", "agent"],
  msp: ["owner", "operator", "strategist", "agent"],
  icps: ["owner", "operator", "strategist", "agent"],
  segments: ["owner", "operator", "strategist", "agent"],
  campaigns: ["owner", "operator", "strategist", "agent"],
  settings: ["owner", "operator"],
};

export function canAccess(role: MarkOSRole, route: string): boolean {
  const castRoute = route as RouteKey;
  if (!routePermissions[castRoute]) {
    return false;
  }

  return routePermissions[castRoute].includes(role);
}

export function canPublish(role: MarkOSRole): boolean {
  return role === "owner" || role === "operator" || role === "strategist";
}
