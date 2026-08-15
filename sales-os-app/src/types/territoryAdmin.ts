// Hand-written to match backend/app/domains/reference/schemas.py's Zone admin
// shapes exactly (ZoneTreeNode/ZoneCreate/ZoneUpdate/ZoneBlastRadius).
// npm run generate:types hasn't been run since these endpoints landed --
// swap these for the generated versions once that's done (see
// docs/Territory-Admin-Screen-Implementation-Plan.md).

export interface ZoneAssignee {
  id: string;
  display_name: string;
  role_name: string;
}

export interface ZoneTreeNode {
  id: string;
  name: string;
  zone_level: string | null;
  is_active: boolean | null;
  children: ZoneTreeNode[];
  assignees: ZoneAssignee[];
}

export interface ZoneCreate {
  name: string;
  parent_zone_id?: string | null;
  zone_level?: string | null;
}

export interface ZoneUpdate {
  name?: string | null;
  parent_zone_id?: string | null;
  zone_level?: string | null;
}

export interface ZoneBlastRadius {
  account_count: number;
  user_count: number;
}

export interface ZoneNameMatch {
  id: string;
  name: string;
  parent_name: string | null;
}
