import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../../styles/StudyPlans.css";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
}

interface PlanMateria {
  materia: Subject;
  anio: number;
  cuatrimestre: number;
  creditos: number;
  esOptativa?: boolean;
  esUnahur?: boolean;
  correlativas?: Subject[];
}

interface Plan {
  _id: string;
  nombre: string;
  anio: number;
  carrera?: { nombre: string; codigo: string };
  materias: PlanMateria[];
  creditosNecesarios?: number;
  materiasUnahurRequeridas?: number;
  nivelInglesRequerido?: string;
  activo: boolean;
}

export default function StudyPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/planes/${id}`).then((r) => setPlan(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="plans-container"><p>Cargando plan...</p></div>;
  if (!plan) return <div className="plans-container"><p>Plan no encontrado.</p></div>;

  const porAnio: Record<number, PlanMateria[]> = {};
  plan.materias.forEach((pm) => {
    if (!porAnio[pm.anio]) porAnio[pm.anio] = [];
    porAnio[pm.anio].push(pm);
  });
  const totalCreditos = plan.materias.reduce((s, m) => s + (m.creditos || 0), 0);

  return (
    <div className="plans-container">
      <div className="plans-header">
        <div>
          <h1>{plan.nombre}</h1>
          <p>{plan.carrera?.nombre} · Año {plan.anio} · {plan.materias.length} materias · {totalCreditos} créditos totales</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={() => navigate("/admin/studyplans")}>← Volver</button>
          <button className="btn-primary" onClick={() => navigate(`/admin/studyplans/editar/${id}`)}>✏️ Editar</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ padding: '12px 16px', background: '#f3f4f6', borderRadius: 8 }}>
          <strong>Créditos Necesarios:</strong> {plan.creditosNecesarios || 0}
        </div>
        <div style={{ padding: '12px 16px', background: '#f3f4f6', borderRadius: 8 }}>
          <strong>Materias UNAHUR:</strong> {plan.materiasUnahurRequeridas || 0}
        </div>
        <div style={{ padding: '12px 16px', background: '#f3f4f6', borderRadius: 8 }}>
          <strong>Nivel Inglés:</strong> {plan.nivelInglesRequerido || '-'}
        </div>
        <div style={{ padding: '12px 16px', background: plan.activo ? '#d1fae5' : '#fee2e2', borderRadius: 8 }}>
          <strong>Estado:</strong> {plan.activo ? 'Vigente' : 'Inactivo'}
        </div>
      </div>

      {Object.keys(porAnio).sort().map((y) => (
        <div key={y} style={{ marginBottom: 24 }}>
          <h3>Año {y}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {porAnio[Number(y)].map((pm) => (
              <div key={pm.materia?._id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <strong style={{ maxWidth: '70%' }}>{pm.materia?.nombre || 'Materia desconocida'}</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'end' }}>
                    {pm.esOptativa && <span style={{ fontSize: 10, padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 4 }}>Optativa</span>}
                    {pm.esUnahur && <span style={{ fontSize: 10, padding: '2px 6px', background: '#d1fae5', color: '#065f46', borderRadius: 4 }}>UNAHUR</span>}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0' }}>
                  {pm.materia?.codigo} · {pm.cuatrimestre === 0 ? 'Anual' : `${pm.cuatrimestre}° Cuat`} · {pm.creditos} créditos
                </p>
                {pm.correlativas && pm.correlativas.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#888', margin: '0 0 2px 0' }}>📎 Correlativas:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {pm.correlativas.map((c) => (
                        <span key={c._id} style={{ fontSize: 10, background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{c.codigo}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
