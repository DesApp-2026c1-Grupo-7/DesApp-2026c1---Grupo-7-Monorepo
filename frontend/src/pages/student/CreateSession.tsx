import { useNavigate } from "react-router-dom";
import CreateSessionForm from "../../components/CreateSessionForm";

export default function CreateSession() {
  const navigate = useNavigate();

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        
        {/* Volver */}
        <button
          onClick={() => navigate("/student/sessions")}
          className="text-blue-600 text-sm mb-3 hover:underline"
        >
          ← Volver a sesiones
        </button>

        {/* Título */}
        <h1 className="text-2xl font-semibold">
          Crear Sesión de Estudio
        </h1>
        <p className="text-gray-500 mb-6">
          Organiza una sesión y conecta con otros estudiantes
        </p>

        {/* Form */}
        <CreateSessionForm />
      </div>
    </div>
  );
}