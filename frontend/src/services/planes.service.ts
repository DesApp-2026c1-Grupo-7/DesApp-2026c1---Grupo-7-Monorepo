import api from './api';

export interface PlanEstudio {
  _id: string;
  carrera: { _id: string; nombre: string; codigo: string };
  anio: number;
  materias: { _id: string; nombre: string; codigo: string; anio: number }[];
  estado: 'Vigente' | 'No vigente';
}

interface PlanesResponse {
  ok: boolean;
  data: PlanEstudio[];
}

interface PlanResponse {
  ok: boolean;
  data: PlanEstudio;
}

export async function getPlanes(params?: { carrera?: string }): Promise<PlanEstudio[]> {
  const { data } = await api.get<PlanesResponse>('/planes', { params });
  return data.data;
}

export async function getPlan(id: string): Promise<PlanEstudio> {
  const { data } = await api.get<PlanResponse>(`/planes/${id}`);
  return data.data;
}

export async function createPlan(body: {
  carrera: string;
  anio: number;
  materias?: string[];
  estado?: string;
}): Promise<PlanEstudio> {
  const { data } = await api.post<PlanResponse>('/planes', body);
  return data.data;
}

export async function updatePlan(id: string, body: Partial<PlanEstudio>): Promise<PlanEstudio> {
  const { data } = await api.put<PlanResponse>(`/planes/${id}`, body);
  return data.data;
}

export async function deletePlan(id: string): Promise<void> {
  await api.delete(`/planes/${id}`);
}
