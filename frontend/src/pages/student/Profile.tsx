import "../../styles/Profile.css";

export default function Profile() {
  return (
    <div className="profile-container">
      <h1>Mi Perfil</h1>
      <p className="subtitle">Administra tu información personal</p>

      {/* CARD PERFIL */}
      <div className="card profile-card">
        <div className="profile-info">
          <div className="avatar">👤</div>

          <div className="user-data">
            <h2>Juan Pérez</h2>
            <span className="role">Estudiante</span>

            <div className="user-details">
              <span>📧 juan.perez@universidad.edu</span>
              <span>📚 Ingeniería en Sistemas</span>
              <span>📞 +54 11 1234-5678</span>
              <span>📍 Buenos Aires, Argentina</span>
            </div>
          </div>
        </div>

        <button className="btn-primary">Editar Perfil</button>
      </div>

      {/* CONFIGURACIÓN */}
      <div className="card">
        <h3>🔒 Configuración de Privacidad</h3>

        <div className="setting-item">
          <div>
            <strong>Visibilidad del Perfil</strong>
            <p>Quién puede ver tu información</p>
          </div>
          <select>
            <option>Público</option>
            <option>Privado</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <strong>Historial Académico</strong>
            <p>Quién puede ver tus materias</p>
          </div>
          <select>
            <option>Solo contactos</option>
            <option>Público</option>
            <option>Privado</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <strong>Solicitudes de Conexión</strong>
            <p>Quién puede enviarte solicitudes</p>
          </div>
          <select>
            <option>Todos</option>
            <option>Solo contactos</option>
          </select>
        </div>
      </div>

      {/* CONTACTOS */}
      <div className="card">
        <div className="contacts-header">
          <h3>👥 Mis Contactos</h3>
          <span>3 contactos</span>
        </div>

        <div className="contact">
          <div>
            <strong>María González</strong>
            <p>Ing. Sistemas · 5 contactos en común</p>
          </div>
          <button className="btn-secondary">Ver Perfil</button>
        </div>

        <div className="contact">
          <div>
            <strong>Carlos Ruiz</strong>
            <p>Lic. Informática · 3 contactos en común</p>
          </div>
          <button className="btn-secondary">Ver Perfil</button>
        </div>

        <div className="contact">
          <div>
            <strong>Ana López</strong>
            <p>Ing. Sistemas · 8 contactos en común</p>
          </div>
          <button className="btn-secondary">Ver Perfil</button>
        </div>
      </div>
    </div>
  );
}