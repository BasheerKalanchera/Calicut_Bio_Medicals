// D76 (Basheer, 2026-10-24): a manager's team is listed under them, indented,
// because their targets are a share of the manager's -- a flat list invites
// adding them up twice. Used by Target vs Actuals and Team Plans.

interface ReportingPerson {
  user_id: string;
  display_name: string;
  manager_id: string | null;
}

export interface TreeRow<T> { person: T; depth: number; managerName: string | null }

// Whoever's manager isn't in the list starts a branch; each level keeps the
// list's own order (the server's, by name).
export function asTree<T extends ReportingPerson>(people: T[]): TreeRow<T>[] {
  const byId = new Map(people.map((p) => [p.user_id, p]));
  const out: TreeRow<T>[] = [];
  const seen = new Set<string>();
  const walk = (p: T, depth: number) => {
    if (seen.has(p.user_id)) return;
    seen.add(p.user_id);
    const manager = p.manager_id ? byId.get(p.manager_id) : undefined;
    out.push({ person: p, depth, managerName: depth > 0 && manager ? manager.display_name : null });
    for (const c of people) if (c.manager_id === p.user_id) walk(c, depth + 1);
  };
  for (const p of people) if (!p.manager_id || !byId.has(p.manager_id)) walk(p, 0);
  // A reporting loop would leave someone unreached; still list them.
  for (const p of people) walk(p, 0);
  return out;
}
