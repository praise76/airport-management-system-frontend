import { api } from "./client";
import type { Position, PositionInput, PositionUpdate, PositionHierarchy, PositionAssignment, PositionAssignInput } from "@/types/position";

export async function getPositions(): Promise<Position[]> {
  const res = await api.get("/positions");
  return res.data.data;
}

export async function getPosition(id: string): Promise<Position> {
  const res = await api.get(`/positions/${id}`);
  return res.data.data;
}

export async function createPosition(input: PositionInput): Promise<Position> {
  const res = await api.post("/positions", input);
  return res.data.data;
}

export async function updatePosition(id: string, input: PositionUpdate): Promise<Position> {
  const res = await api.patch(`/positions/${id}`, input);
  return res.data.data;
}

export async function deletePosition(id: string): Promise<void> {
  await api.delete(`/positions/${id}`);
}

export async function getPositionHierarchy(): Promise<PositionHierarchy[]> {
  const res = await api.get("/positions/hierarchy");
  return res.data.data;
}

export async function assignPosition(positionId: string, input: PositionAssignInput): Promise<PositionAssignment> {
  const res = await api.post(`/positions/${positionId}/assign`, input);
  return res.data.data;
}

export async function getPositionAssignments(positionId: string): Promise<PositionAssignment[]> {
  const res = await api.get(`/positions/${positionId}/assignments`);
  return res.data.data;
}
