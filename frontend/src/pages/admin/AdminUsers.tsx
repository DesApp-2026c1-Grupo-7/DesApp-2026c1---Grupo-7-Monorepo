import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/AdminUsers.css";

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
  const [processing, setProcessing] = useState<string | null>(null);

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
      setMessage("✅ Administrador creado con éxito");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "Error al crear administrador");
    }
  };

  const toggleSuspension = async (user: UserAccount) => {
    setMessage("");
    setError("");
    setProcessing(user._id);
    try {
      if (user.suspendido) {
        await api.put(`/usuarios/${user._id}/reactivar`);
        setMessage("✅ Cuenta reactivada");
      } else {
        await api.put(`/usuarios/${user._id}/suspender`, { motivo: "Suspendido desde panel admin" });
        setMessage("⚠️ Cuenta suspendida");
      }
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "No se pudo actualizar la cuenta");
    } finally {
      setProcessing(null);
    }
  };

  const promoteToAdmin = async (user: UserAccount) => {
    if (!window.confirm(`¿Estás seguro de promover a ${user.nombre} a Administrador?`)) return;
    
    setMessage("");
    setError("");
    setProcessing(user._id);
    try {
      await api.put(`/usuarios/${user._id}/hacer-admin`);
      setMessage("🚀 Usuario promovido a administrador");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      setError(ax.response?.data?.mensaje || "No se pudo promover la cuenta");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Gestión de Usuarios</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra accesos, roles y estados de cuenta.</p>
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
        <h3>Crear Nuevo Administrador</h3>
        <form onSubmit={createAdmin} className="filters" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            className="full-width-input" 
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Nombre completo" 
            value={newAdmin.nombre} 
            onChange={(e) => setNewAdmin((s) => ({ ...s, nombre: e.target.value }))} 
            required 
          />
          <input 
            className="full-width-input"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Email institucional" 
            type="email" 
            value={newAdmin.email} 
            onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))} 
            required 
          />
          <input 
            className="full-width-input"
            style={{ flex: 1, minWidth: '150px' }}
            placeholder="Contraseña" 
            type="password" 
            value={newAdmin.password} 
            onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))} 
            required 
          />
          <button className="btn primary" type="submit" style={{ height: '45px' }}>Crear</button>
        </form>
      </div>

      {/* TABLE LAYOUT (Desktop) */}
      <div className="users-table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={{ fontWeight: 600 }}>{user.nombre}</td>
                <td>{user.email}</td>
                <td>
                  <span className="role-badge" style={{ margin: 0, fontSize: '0.75rem' }}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.suspendido ? 'libre' : 'aprobada'}`}>
                    {user.suspendido ? "Suspendido" : "Activo"}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button 
                      className={`btn ${user.suspendido ? 'primary' : 'secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => toggleSuspension(user)} 
                      disabled={user.role === "admin" || processing === user._id}
                    >
                      {user.suspendido ? "Reactivar" : "Suspender"}
                    </button>
                    {user.role === "student" && (
                      <button 
                        className="btn primary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => promoteToAdmin(user)}
                        disabled={processing === user._id}
                      >
                        Promover
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CARD LAYOUT (Mobile) */}
      <div className="user-cards-container">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <div className="user-card-header">
              <div className="user-card-name">{user.nombre}</div>
              <span className="user-card-role">{user.role}</span>
            </div>
            <div className="user-card-body">
              <div className="user-card-info">
                <span>{user.email}</span>
                <div className={`user-card-status ${user.suspendido ? 'suspended' : ''}`}>
                  {user.suspendido ? "🔴 Suspendido" : "🟢 Activo"}
                  {user.suspendido && user.motivoSuspension && (
                    <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                      Motivo: {user.motivoSuspension}
                    </small>
                  )}
                </div>
              </div>
            </div>
            <div className="user-card-actions">
              <button 
                className={`btn ${user.suspendido ? 'primary' : 'secondary'}`}
                onClick={() => toggleSuspension(user)} 
                disabled={user.role === "admin" || processing === user._id}
              >
                {user.suspendido ? "Reactivar" : "Suspender"}
              </button>
              {user.role === "student" && (
                <button 
                  className="btn primary"
                  onClick={() => promoteToAdmin(user)}
                  disabled={processing === user._id}
                >
                  Promover a Admin
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
