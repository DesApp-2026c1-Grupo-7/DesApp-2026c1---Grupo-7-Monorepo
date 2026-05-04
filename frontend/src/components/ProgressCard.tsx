import "../styles/ProgressCard.css";

const ProgressCard = () => {
  return (
    <div className="progress-card">
      <div className="header">
        <div>
          <h3>Avance en la Carrera</h3>
          <p>Ingeniería en Sistemas</p>
        </div>
        <span>68%</span>
      </div>

      <div className="bar">
        <div className="fill" />
      </div>

      <p className="text">32 de 47 materias aprobadas</p>
    </div>
  );
};

export default ProgressCard;