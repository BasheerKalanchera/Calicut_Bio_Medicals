import api from "../lib/api";
import type { ZoneTreeNode, ZoneCreate, ZoneUpdate, ZoneBlastRadius } from "../types/territoryAdmin";

export async function getZoneTree(): Promise<ZoneTreeNode[]> {
  const response = await api.get("/admin/zones/tree");
  return response.data.data;
}

export async function createZone(data: ZoneCreate): Promise<ZoneTreeNode> {
  const response = await api.post("/admin/zones", data);
  return response.data.data;
}

export async function updateZone(zoneId: string, data: ZoneUpdate): Promise<ZoneTreeNode> {
  const response = await api.patch(`/admin/zones/${zoneId}`, data);
  return response.data.data;
}

export async function deprecateZone(zoneId: string): Promise<ZoneTreeNode> {
  const response = await api.post(`/admin/zones/${zoneId}/deprecate`);
  return response.data.data;
}

export async function getBlastRadius(zoneId: string): Promise<ZoneBlastRadius> {
  const response = await api.get(`/admin/zones/${zoneId}/blast-radius`);
  return response.data.data;
}

export async function rebuildClosure(): Promise<void> {
  await api.post("/admin/zones/rebuild-closure");
}
