import api from './api';

export interface Materia {
  _id: string;
  nombre: string;
  codigo: string;
  anio: number;
  carrera: { _id: string; nombre: string; codigo: string };
  correlativas: { _id: string; nombre: string; codigo: string }[];
}

interface MateriasResponse {
  ok: boolean;
  data: Materia[];
}

interface MateriaResponse {
  ok: boolean;
  data: Materia;
}

export async function getMaterias(params?: { carrera?: string; anio?: number }): Promise<Materia[]> {
  const { data } = await api.get<MateriasResponse>('/materias', { params });
  return data.data;
}

export async function getMateria(id: string): Promise<Materia> {
  const { data } = await api.get<MateriaResponse>(`/materias/${id}`);
  return data.data;
}

export async function createMateria(body: {
  nombre: string;
  codigo: string;
  anio: number;
  carrera: string;
  correlativas?: string[];
}): Promise<Materia> {
  const { data } = await api.post<MateriaResponse>('/materias', body);
  return data.data;
}

export async function updateMateria(id: string, body: Partial<Materia>): Promise<Materia> {
  const { data } = await api.put<MateriaResponse>(`/materias/${id}`, body);
  return data.data;
}

export async function deleteMateria(id: string): Promise<void> {
  await api.delete(`/materias/${id}`);
}
