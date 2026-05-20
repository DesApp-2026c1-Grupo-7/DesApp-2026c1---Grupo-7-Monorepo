import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, Settings2 } from "lucide-react";
import api from "../../services/api";
import "../../styles/CreateCareer.css";

interface Career { _id: string; nombre: string; }
interface Subject { _id: string; nombre: string; codigo: string; }

interface PlanMateria {
  materia: string;
  nombre?: string;
  codigo?: string;
  anio: number;
  cuatrimestre: number;
  creditos: number;
  horasSemanales: number;
  correlativas: string[];
  esOptativa: boolean;
  esUnahur: boolean;
}

export default function CreateStudyPlan() {
  const navigate = useNavigate();
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    anio: new Date().getFullYear(),
    carrera: "",
    creditosNecesarios: 0,
    materiasUnahurRequeridas: 0,
    nivelInglesRequerido: "B1",
    estado: "Vigente"
  });
  
  const [planMaterias, setPlanMaterias] = useState<PlanMateria[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [corrSearchTerm, setCorrSearchTerm] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/materias")
      .then((s) => { setAllSubjects(s.data); })
      .catch(() => {});
  }, []);

  const filteredSearch = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    const alreadySelected = new Set(planMaterias.map(m => m.materia));
    return allSubjects.filter(s => 
      !alreadySelected.has(s._id) && 
      (s.nombre.toLowerCase().includes(term) || s.codigo.toLowerCase().includes(term))
    ).slice(0, 10);
  }, [searchTerm, allSubjects, planMaterias]);

  const addMateria = (s: Subject) => {
    setPlanMaterias([...planMaterias, {
      materia: s._id,
      nombre: s.nombre,
      codigo: s.codigo,
      anio: 1,
      cuatrimestre: 1,
      creditos: 4,
      horasSemanales: 4,
      correlativas: [],
      esOptativa: false,
      esUnahur: false
    }]);
    setSearchTerm("");
  };

  const removeMateria = (index: number) => {
    const next = planMaterias.filter((_, i) => i !== index);
    setPlanMaterias(next);
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateMateria = (index: number, k: keyof PlanMateria, v: any) => {
    const next = [...planMaterias];
    next[index] = { ...next[index], [k]: v };
    setPlanMaterias(next);
  };

  const toggleCorrelativa = (index: number, cid: string) => {
    const current = planMaterias[index].correlativas;
    const next = current.includes(cid) 
      ? current.filter(id => id !== cid) 
      : [...current, cid];
    updateMateria(index, 'correlativas', next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/planes", {
        ...form,
        carrera: form.carrera || null,
        anio: Number(form.anio),
        creditosNecesarios: Number(form.creditosNecesarios),
        materiasUnahurRequeridas: Number(form.materiasUnahurRequeridas),
        materias: planMaterias.map(m => ({
          materia: m.materia,
          anio: Number(m.anio),
          cuatrimestre: Number(m.cuatrimestre),
          creditos: Number(m.creditos),
          horasSemanales: Number(m.horasSemanales),
          correlativas: m.correlativas,
          esOptativa: m.esOptativa,
          esUnahur: m.esUnahur
        }))
      });
      navigate("/admin/studyplans");
    } catch (err: unknown) {
      console.error("Error creating plan:", err);
      const ax = err as { response?: { data?: { mensaje?: string; error?: any } } };
      let detail = "";
      if (typeof ax.response?.data?.error === 'string') {
        detail = ax.response.data.error;
      } else if (typeof ax.response?.data?.error === 'object') {
        detail = JSON.stringify(ax.response.data.error);
      }
      setError(`${ax.response?.data?.mensaje || "Error al crear el plan"} ${detail ? `: ${detail}` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-career-page">
      <div className="create-career-container" style={{ maxWidth: 900 }}>
        <h1>Nuevo Plan de Estudio</h1>
        <form className="create-career-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

          <div className="form-group">
            <label>Nombre del Plan</label>
            <input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required disabled={loading} placeholder="Ej: Plan 2023" />
          </div>

          <div className="form-group">
            <label>Año del Plan</label>
            <input type="number" min={2000} max={2100} value={form.anio} onChange={(e) => setForm({...form, anio: Number(e.target.value)})} disabled={loading} />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Créditos Totales</label>
              <input type="number" min={0} value={form.creditosNecesarios} onChange={(e) => setForm({...form, creditosNecesarios: Number(e.target.value)})} disabled={loading} />
            </div>
            <div className="form-group">
              <label>UNAHUR requeridas</label>
              <input type="number" min={0} value={form.materiasUnahurRequeridas} onChange={(e) => setForm({...form, materiasUnahurRequeridas: Number(e.target.value)})} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Nivel de Inglés</label>
              <select value={form.nivelInglesRequerido} onChange={(e) => setForm({...form, nivelInglesRequerido: e.target.value})} disabled={loading}>
                {['Ninguno', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lv => <option key={lv} value={lv}>{lv}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} disabled={loading}>
              <option value="Vigente">Vigente</option>
              <option value="En transicion">En transicion</option>
              <option value="Discontinuado">Discontinuado</option>
            </select>
          </div>

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className="form-group">
            <label style={{ fontSize: '1.1rem', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
              Materias del Plan ({planMaterias.length})
            </label>
            
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar materia base..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
              
              {searchTerm && (
                <div style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: 'var(--bg-card-solid)', border: '1px solid var(--border-strong)',
                  borderRadius: 8, marginTop: 4, boxShadow: 'var(--shadow-lg)', padding: 4
                }}>
                  {filteredSearch.map(s => (
                    <div key={s._id} onClick={() => addMateria(s)} style={{ 
                      padding: '10px 12px', cursor: 'pointer', borderRadius: 6, display: 'flex', justifyContent: 'space-between'
                    }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-soft)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <span>{s.nombre}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{s.codigo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {planMaterias.map((pm, index) => (
                <div key={pm.materia} style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{pm.nombre}</span>
                      <small style={{ marginLeft: 8, color: 'var(--text-muted)' }}>({pm.codigo})</small>
                      <div style={{ marginTop: 4, display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>{pm.anio}° Año · {pm.cuatrimestre === 0 ? 'Anual' : `${pm.cuatrimestre}°C`}</span>
                        <span>{pm.creditos} Créditos</span>
                        <span>{pm.horasSemanales}h/semana</span>
                        {pm.esOptativa && <span style={{ color: 'var(--warning)' }}>Optativa</span>}
                        {pm.esUnahur && <span style={{ color: 'var(--success)' }}>UNAHUR</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setEditingIndex(editingIndex === index ? null : index)} style={{ padding: 8, background: 'var(--bg-soft)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        <Settings2 size={16} />
                      </button>
                      <button type="button" onClick={() => removeMateria(index)} style={{ padding: 8, background: 'var(--bg-soft)', color: 'var(--error)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {editingIndex === index && (
                    <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                      <div className="form-grid-4" style={{ marginBottom: 16 }}>
                        <div className="form-group">
                          <label>Año</label>
                          <select value={pm.anio} onChange={e => updateMateria(index, 'anio', Number(e.target.value))}>
                            {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}°</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Cuat.</label>
                          <select value={pm.cuatrimestre} onChange={e => updateMateria(index, 'cuatrimestre', Number(e.target.value))}>
                            <option value={1}>1°C</option><option value={2}>2°C</option><option value={0}>Anual</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Créditos</label>
                          <input type="number" value={pm.creditos} onChange={e => updateMateria(index, 'creditos', Number(e.target.value))} />
                        </div>
                        <div className="form-group">
                          <label>Horas Semanales</label>
                          <input type="number" min={1} value={pm.horasSemanales} onChange={e => updateMateria(index, 'horasSemanales', Number(e.target.value))} />
                        </div>
                      </div>

                      <div className="flex-responsive" style={{ marginBottom: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={pm.esOptativa} onChange={e => updateMateria(index, 'esOptativa', e.target.checked)} />
                          Optativa
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={pm.esUnahur} onChange={e => updateMateria(index, 'esUnahur', e.target.checked)} />
                          UNAHUR
                        </label>
                      </div>

                      <div className="form-group" style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.8rem' }}>Correlativas requeridas</label>
                        
                        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Search size={14} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Buscar correlativa..." 
                            value={corrSearchTerm}
                            onChange={(e) => setCorrSearchTerm(e.target.value)}
                            style={{ paddingLeft: 32, height: 36, fontSize: '0.85rem' }}
                          />
                          
                          {corrSearchTerm && (
                            <div style={{ 
                              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                              background: 'var(--bg-card-solid)', border: '1px solid var(--border-strong)',
                              borderRadius: 8, marginTop: 4, boxShadow: 'var(--shadow-lg)', padding: 4, maxHeight: 200, overflowY: 'auto'
                            }}>
                              {planMaterias
                                .filter((other, i) => 
                                  i !== index && 
                                  !pm.correlativas.includes(other.materia) &&
                                  (other.nombre?.toLowerCase().includes(corrSearchTerm.toLowerCase()) || 
                                   other.codigo?.toLowerCase().includes(corrSearchTerm.toLowerCase()))
                                )
                                .map(other => (
                                  <div key={other.materia} onClick={() => {
                                    toggleCorrelativa(index, other.materia);
                                    setCorrSearchTerm("");
                                  }} style={{ 
                                    padding: '8px 10px', cursor: 'pointer', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'
                                  }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-soft)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <span>{other.nombre}</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{other.codigo}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <div style={{ 
                          display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 40, padding: 8,
                          background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8
                        }}>
                          {pm.correlativas.length > 0 ? (
                            pm.correlativas.map(cid => {
                              const corrSubject = planMaterias.find(p => p.materia === cid);
                              return (
                                <div key={cid} style={{ 
                                  display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-soft)',
                                  padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', border: '1px solid var(--border)'
                                }}>
                                  <span>{corrSubject?.nombre || 'Materia'}</span>
                                  <button type="button" onClick={() => toggleCorrelativa(index, cid)} style={{ 
                                    border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', color: 'var(--error)' 
                                  }}>×</button>
                                </div>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No hay correlativas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '3rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/studyplans")}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>Crear Plan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
