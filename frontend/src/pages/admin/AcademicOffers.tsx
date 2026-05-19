import { useCallback, useEffect, useState } from "react";
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
      setMessage("Oferta guardada");
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
          
          <div style={{ flexBasis: "100%", marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Seleccionar materias disponibles:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {subjects.map((subject) => (
                <label key={subject._id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.materias.includes(subject._id)} onChange={() => toggleSubject(subject._id)} />
                  <span>{subject.nombre} <small style={{ color: 'var(--text-muted)' }}>({subject.codigo})</small></span>
                </label>
              ))}
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
