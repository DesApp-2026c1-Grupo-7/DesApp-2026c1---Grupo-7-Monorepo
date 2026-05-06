import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminCareers.css";

interface UserAccount {
  _id: string;
  nombre: string;
  email: string;
  role: "student" | "admin";
  suspendido: boolean;
  motivoSuspension?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newAdmin, setNewAdmin] = useState({ nombre: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await api.get("/usuarios");
    setUsers(res.data);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchUsers().catch(() => setError("No se pudieron cargar las cuentas"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/usuarios/admins", newAdmin);
      setNewAdmin({ nombre: "", email: "", password: "" });
      setMessage("Administrador creado");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al crear administrador");
    }
  };

  const toggleSuspension = async (user: UserAccount) => {
    setMessage("");
    setError("");
    try {
      if (user.suspendido) {
        await api.put(`/usuarios/${user._id}/reactivar`);
        setMessage("Cuenta reactivada");
      } else {
        await api.put(`/usuarios/${user._id}/suspender`, { motivo: "Suspendido desde panel admin" });
        setMessage("Cuenta suspendida");
      }
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "No se pudo actualizar la cuenta");
    }
  };

  const promoteToAdmin = async (user: UserAccount) => {
    setMessage("");
    setError("");
    try {
      await api.put(`/usuarios/${user._id}/hacer-admin`);
      setMessage("Usuario promovido a administrador");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "No se pudo promover la cuenta");
    }
  };

  return (
    <div className="admin-careers">
      <div className="admin-header">
        <div>
          <h1>Usuarios</h1>
          <p>Altas de administradores y suspension/reactivacion de estudiantes.</p>
        </div>
      </div>

      {message && <p style={{ color: "#15803d" }}>{message}</p>}
      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      <form onSubmit={createAdmin} className="filters" style={{ alignItems: "end" }}>
        <input placeholder="Nombre admin" value={newAdmin.nombre} onChange={(e) => setNewAdmin((s) => ({ ...s, nombre: e.target.value }))} required />
        <input placeholder="Email admin" type="email" value={newAdmin.email} onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))} required />
        <input placeholder="Password inicial" type="password" value={newAdmin.password} onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))} required />
        <button className="btn-primary" type="submit">Crear admin</button>
      </form>

      <div className="careers-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.nombre}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.suspendido ? `Suspendido ${user.motivoSuspension ? `(${user.motivoSuspension})` : ""}` : "Activo"}</td>
                <td>
                  <button className="btn-secondary" onClick={() => toggleSuspension(user)} disabled={user.role === "admin"}>
                    {user.suspendido ? "Reactivar" : "Suspender"}
                  </button>
                  {user.role === "student" && (
                    <button className="btn-primary" onClick={() => promoteToAdmin(user)} style={{ marginLeft: 8 }}>
                      Hacer admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
