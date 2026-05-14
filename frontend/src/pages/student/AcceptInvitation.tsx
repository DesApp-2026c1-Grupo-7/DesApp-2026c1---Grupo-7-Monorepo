import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/Social.css';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no proporcionado.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get(`/invitaciones/verificar/${token}`);
        setInvitation(response.data);
      } catch (err: any) {
        setError(err.response?.data?.mensaje || 'Error al verificar la invitación.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAction = async (action: 'aceptar' | 'rechazar') => {
    setProcessing(true);
    try {
      await api.post(`/invitaciones/${action}`, { token });
      setSuccess(`Has ${action === 'aceptar' ? 'aceptado' : 'rechazado'} la invitación con éxito.`);
      setTimeout(() => navigate('/student/social'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || `Error al ${action} la invitación.`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="social-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="social-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2>Ups! Algo salió mal</h2>
          <p>{error}</p>
          <div style={{ marginTop: '2rem' }}>
            <Link to="/student/social" className="btn primary">Ir a Social</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="social-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span style={{ fontSize: '3rem' }}>✅</span>
          <h2>¡Listo!</h2>
          <p>{success}</p>
          <p>Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="social-container">
      <h1>Invitación de Contacto</h1>
      
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="avatar-main" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', fontSize: '2rem' }}>
          {invitation.remitente.foto ? <img src={invitation.remitente.foto} alt="Perfil" /> : "👤"}
        </div>
        
        <h2>{invitation.remitente.nombre} quiere ser tu contacto</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Al aceptar, podrán ver sus perfiles y colaborar en la plataforma.
        </p>

        <div className="actions" style={{ justifyContent: 'center', gap: '1rem' }}>
          <button 
            className="btn primary btn-large" 
            onClick={() => handleAction('aceptar')}
            disabled={processing}
          >
            {processing ? 'Procesando...' : 'Aceptar Invitación'}
          </button>
          <button 
            className="btn secondary btn-large" 
            onClick={() => handleAction('rechazar')}
            disabled={processing}
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
