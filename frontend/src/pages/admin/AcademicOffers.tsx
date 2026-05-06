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
    <div className="admin-careers">
      <div className="admin-header">
        <div>
          <h1>Oferta Academica</h1>
          <p>Define que materias se ofrecen por periodo para filtrar inscribibles.</p>
        </div>
      </div>

      {message && <p style={{ color: "#15803d" }}>{message}</p>}
      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      <form onSubmit={submit} className="filters" style={{ alignItems: "start" }}>
        <input type="number" value={form.anio} onChange={(e) => setForm((s) => ({ ...s, anio: Number(e.target.value) }))} />
        <select value={form.cuatrimestre} onChange={(e) => setForm((s) => ({ ...s, cuatrimestre: Number(e.target.value) }))}>
          <option value={1}>1C</option>
          <option value={2}>2C</option>
          <option value={0}>Anual</option>
        </select>
        <button className="btn-primary" type="submit">Guardar oferta</button>
        <div style={{ flexBasis: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {subjects.map((subject) => (
            <label key={subject._id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={form.materias.includes(subject._id)} onChange={() => toggleSubject(subject._id)} />
              {subject.nombre} ({subject.codigo})
            </label>
          ))}
        </div>
      </form>

      <div className="careers-table">
        <table>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Materias</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer._id}>
                <td>{offer.anio} - {offer.cuatrimestre === 0 ? "Anual" : `${offer.cuatrimestre}C`}</td>
                <td>{offer.materias.map((m) => `${m.nombre} (${m.codigo})`).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
