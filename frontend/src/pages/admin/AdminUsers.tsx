import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../hooks/useToast";
import "../../styles/AdminUsers.css";

// Solo el administrador principal maneja la jerarquía de roles.
const SUPREME_ADMIN_EMAIL = (import.meta.env.VITE_SUPREME_ADMIN_EMAIL || "admin@universidad.edu").toLowerCase();

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
  const { toast, showToast, hideToast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<
    { title: string; message: string; confirmLabel: string; onConfirm: () => void } | null
  >(null);
  const roleLabel = (role: UserAccount["role"]) => role === "admin" ? "Administrador" : "Estudiante";

  // El admin logueado: solo el principal puede promover/degradar.
  const currentEmail = useMemo(
    () => (JSON.parse(localStorage.getItem("user") || "{}").email || "").toLowerCase(),
    []
  );
  const isSupreme = currentEmail === SUPREME_ADMIN_EMAIL;
  const esAdminPrincipal = (user: UserAccount) => user.email.toLowerCase() === SUPREME_ADMIN_EMAIL;

  const fetchUsers = useCallback(async () => {
    const res = await api.get("/usuarios");
    setUsers(res.data);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchUsers().catch(() => showToast("No se pudieron cargar las cuentas", "error"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers, showToast]);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/usuarios/admins", newAdmin);
      setNewAdmin({ nombre: "", email: "", password: "" });
      showToast("Administrador creado con éxito", "success");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo crear el administrador", "error");
    }
  };

  const toggleSuspension = async (user: UserAccount) => {
    setProcessing(user._id);
    try {
      if (user.suspendido) {
        await api.put(`/usuarios/${user._id}/reactivar`);
        showToast("Cuenta reactivada", "success");
      } else {
        await api.put(`/usuarios/${user._id}/suspender`, { motivo: "Suspendido desde panel admin" });
        showToast("Cuenta suspendida", "success");
      }
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo actualizar la cuenta", "error");
    } finally {
      setProcessing(null);
    }
  };

  const promoteToAdmin = async (user: UserAccount) => {
    setProcessing(user._id);
    try {
      await api.put(`/usuarios/${user._id}/hacer-admin`);
      showToast("Usuario promovido a administrador", "success");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo promover la cuenta", "error");
    } finally {
      setProcessing(null);
    }
  };

  const demoteAdmin = async (user: UserAccount) => {
    setProcessing(user._id);
    try {
      await api.put(`/usuarios/${user._id}/quitar-admin`);
      showToast("Administrador degradado a estudiante", "success");
      await fetchUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { mensaje?: string } } };
      showToast(ax.response?.data?.mensaje || "No se pudo degradar la cuenta", "error");
    } finally {
      setProcessing(null);
    }
  };

  const askPromote = (user: UserAccount) => setConfirmModal({
    title: "Promover a administrador",
    message: `¿Seguro que querés promover a ${user.nombre} a administrador? Vas a poder degradarlo luego.`,
    confirmLabel: "Promover",
    onConfirm: () => promoteToAdmin(user),
  });

  const askDemote = (user: UserAccount) => setConfirmModal({
    title: "Degradar administrador",
    message: `¿Seguro que querés degradar a ${user.nombre} a estudiante?`,
    confirmLabel: "Degradar",
    onConfirm: () => demoteAdmin(user),
  });

  return (
    <div className="admin-users-page">
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Gestión de Usuarios</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra accesos, roles y estados de cuenta.</p>
        </div>
      </div>

      <Toast toast={toast} onClose={hideToast} />

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Crear Nuevo Administrador</h3>
        <p className="admin-form-intro">Creá una cuenta con permisos de gestión institucional.</p>
        <form onSubmit={createAdmin} className="admin-create-form">
          <label>
            Nombre completo
            <input
              className="full-width-input"
              placeholder="Ej: Ana Pérez"
              value={newAdmin.nombre}
              onChange={(e) => setNewAdmin((s) => ({ ...s, nombre: e.target.value }))}
              required
            />
          </label>
          <label>
            Email institucional
            <input
              className="full-width-input"
              placeholder="ana@universidad.edu"
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Contraseña temporal
            <input
              className="full-width-input"
              placeholder="Mínimo 6 caracteres"
              type="password"
              minLength={6}
              value={newAdmin.password}
              onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </label>
          <button className="btn primary admin-create-submit" type="submit">Crear administrador</button>
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
                    {roleLabel(user.role)}
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
                    {isSupreme && user.role === "student" && (
                      <button
                        className="btn primary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => askPromote(user)}
                        disabled={processing === user._id}
                      >
                        Promover
                      </button>
                    )}
                    {isSupreme && user.role === "admin" && !esAdminPrincipal(user) && (
                      <button
                        className="btn"
                        style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--error)', color: '#fff' }}
                        onClick={() => askDemote(user)}
                        disabled={processing === user._id}
                      >
                        Degradar
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
              <span className="user-card-role">{roleLabel(user.role)}</span>
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
              {isSupreme && user.role === "student" && (
                <button
                  className="btn primary"
                  onClick={() => askPromote(user)}
                  disabled={processing === user._id}
                >
                  Promover a Admin
                </button>
              )}
              {isSupreme && user.role === "admin" && !esAdminPrincipal(user) && (
                <button
                  className="btn"
                  style={{ background: 'var(--error)', color: '#fff' }}
                  onClick={() => askDemote(user)}
                  disabled={processing === user._id}
                >
                  Degradar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title || ""}
        message={confirmModal?.message || ""}
        confirmLabel={confirmModal?.confirmLabel}
        danger
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          confirmModal?.onConfirm();
          setConfirmModal(null);
        }}
      />
    </div>
  );
}
