import { useCallback, useEffect, useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import api from "../../services/api";
import "../../styles/AdminCareers.css";

interface Subject {
  _id: string;
  nombre: string;
  codigo: string;
}

interface Offer {
  _id: string;
  anio: number;
  cuatrimestre: number;
  materias: Subject[];
}

export default function AcademicOffers() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState({
    anio: new Date().getFullYear(),
    cuatrimestre: new Date().getMonth() < 7 ? 1 : 2,
    materias: [] as string[]
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const [subjectsRes, offersRes] = await Promise.all([
      api.get("/materias"),
      api.get("/ofertas")
    ]);
    setSubjects(subjectsRes.data);
    setOffers(offersRes.data);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAll().catch(() => setError("No se pudo cargar la oferta academica"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return subjects.filter(s => 
      !form.materias.includes(s._id) && 
      (s.nombre.toLowerCase().includes(term) || s.codigo.toLowerCase().includes(term))
    ).slice(0, 8);
  }, [subjects, searchTerm, form.materias]);

  const selectedSubjectsList = useMemo(() => {
    return subjects.filter(s => form.materias.includes(s._id));
  }, [subjects, form.materias]);

  const toggleSubject = (id: string) => {
    setForm((current) => ({
      ...current,
      materias: current.materias.includes(id)
        ? current.materias.filter((item) => item !== id)
        : [...current.materias, id]
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/ofertas", form);
      setMessage("Oferta guardada con éxito");
      setForm(prev => ({ ...prev, materias: [] }));
      setSearchTerm("");
      await fetchAll();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al guardar oferta");
    }
  };

  return (
    <div className="admin-careers-container">
      <div className="admin-careers-header">
        <div>
          <h1>Oferta Académica</h1>
          <p>Define qué materias se ofrecen por periodo para filtrar inscribibles.</p>
        </div>
      </div>

      {message && (
        <div className="profile-alert success" style={{ marginBottom: '1.5rem', position: 'static', transform: 'none' }}>
          {message}
        </div>
      )}
      
      {error && (
        <div className="profile-alert error" style={{ marginBottom: '1.5rem', position: 'static', transform: 'none' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Nueva Oferta</h3>
        <form onSubmit={submit} className="filters" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
            <input 
              type="number" 
              className="full-width-input"
              style={{ width: '100px' }}
              value={form.anio} 
              onChange={(e) => setForm((s) => ({ ...s, anio: Number(e.target.value) }))} 
            />
            <select 
              className="full-width-input"
              value={form.cuatrimestre} 
              onChange={(e) => setForm((s) => ({ ...s, cuatrimestre: Number(e.target.value) }))}
            >
              <option value={1}>Primer Cuatrimestre (1C)</option>
              <option value={2}>Segundo Cuatrimestre (2C)</option>
              <option value={0}>Anual</option>
            </select>
          </div>
          <button className="btn primary" type="submit" style={{ height: '45px' }}>Guardar oferta</button>
          
          <div style={{ flexBasis: "100%", marginTop: '1.5rem', position: 'relative' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
              Seleccionar materias para la oferta:
            </p>
            
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar materia por nombre o código..." 
                className="full-width-input"
                style={{ paddingLeft: '42px', height: '48px', fontSize: '0.95rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {searchTerm && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 100, 
                  background: 'var(--bg-card-solid)', 
                  border: '1px solid var(--border-strong)', 
                  borderRadius: 'var(--radius-lg)', 
                  boxShadow: 'var(--shadow-lg)',
                  marginTop: '6px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  padding: '6px'
                }}>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map(s => (
                      <div 
                        key={s._id} 
                        onClick={() => {
                          toggleSubject(s._id);
                          setSearchTerm("");
                        }}
                        style={{ 
                          padding: '12px 14px', 
                          cursor: 'pointer', 
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{s.nombre}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-soft)', padding: '3px 8px', borderRadius: '6px' }}>{s.codigo}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No se encontraron materias que coincidan
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px', 
              minHeight: '60px', 
              padding: '12px', 
              background: 'var(--bg-soft)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px dashed var(--border-strong)' 
            }}>
              {selectedSubjectsList.length > 0 ? (
                selectedSubjectsList.map(s => (
                  <div key={s._id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'var(--bg-card-solid)', 
                    color: 'var(--text-main)', 
                    padding: '6px 12px', 
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <span>{s.nombre}</span>
                    <button 
                      type="button"
                      onClick={() => toggleSubject(s._id)}
                      style={{ 
                        background: 'var(--bg-main)', 
                        border: 'none', 
                        color: 'var(--text-muted)', 
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', gap: '8px' }}>
                  <span>No hay materias seleccionadas. Usa el buscador arriba.</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* TABLE LAYOUT (Desktop) */}
      <div className="admin-table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th style={{ width: '200px' }}>Periodo</th>
              <th>Materias Ofrecidas</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer._id}>
                <td style={{ fontWeight: 600 }}>
                  {offer.anio} - {offer.cuatrimestre === 0 ? "Anual" : `${offer.cuatrimestre}C`}
                </td>
                <td style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                  {offer.materias.map((m) => `${m.nombre} (${m.codigo})`).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="mobile-only-cards">
        {offers.map((offer) => (
          <div key={offer._id} className="career-mobile-card">
            <div className="card-row header">
              <span className="name">{offer.anio} - {offer.cuatrimestre === 0 ? "Anual" : `${offer.cuatrimestre}C`}</span>
            </div>
            <div className="card-body" style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Materias:</p>
              <p style={{ fontSize: '0.95rem' }}>
                {offer.materias.map((m) => `${m.nombre} (${m.codigo})`).join(", ")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
