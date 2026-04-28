import "../../styles/Social.css";

const Social = () => {
  return (
    <div className="social-container">
      <h1>Red Social</h1>
      <p className="subtitle">Conecta con otros estudiantes</p>

      {/* Solicitudes */}
      <div className="card">
        <h3>Solicitudes Pendientes (2)</h3>

        <div className="request-item">
          <div className="user-info">
            <div className="avatar" />
            <div>
              <strong>Pedro Martínez</strong>
              <p>Ing. Industrial</p>
              <span>4 contactos en común</span>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary">Aceptar</button>
            <button className="btn secondary">Rechazar</button>
          </div>
        </div>

        <div className="request-item">
          <div className="user-info">
            <div className="avatar" />
            <div>
              <strong>Laura Fernández</strong>
              <p>Ing. Sistemas</p>
              <span>7 contactos en común</span>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary">Aceptar</button>
            <button className="btn secondary">Rechazar</button>
          </div>
        </div>
      </div>

      {/* Crear post */}
      <div className="card post-box">
        <div className="post-input">
          <div className="avatar" />
          <textarea placeholder="¿Qué estás pensando?" />
        </div>
        <div className="post-actions">
          <button className="btn primary">Publicar</button>
        </div>
      </div>

      {/* Post */}
      <div className="card post">
        <div className="post-header">
          <div className="avatar" />
          <div>
            <strong>María González</strong>
            <p>Ing. Sistemas</p>
            <span>Hace 2 horas</span>
          </div>
        </div>

        <p className="post-content">
          Acabo de aprobar Algoritmos! 🎉 Gracias a todos los que me ayudaron en las sesiones de estudio
        </p>

        <div className="post-footer">
          <span>👍 12</span>
          <span>💬 3</span>
          <span>🔗 Compartir</span>
        </div>
      </div>
    </div>
  );
};

export default Social;