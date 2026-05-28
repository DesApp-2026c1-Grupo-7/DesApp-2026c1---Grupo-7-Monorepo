import { useParams } from "react-router-dom";
import CreateSessionForm from "../../components/CreateSessionForm";

export default function EditSession() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Editar Sesión de Estudio</h2>
      <CreateSessionForm sessionId={id} />
    </div>
  );
}
