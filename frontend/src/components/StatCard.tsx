import "../styles/StatCard.css";

const StatCard = ({ title, value, color }: any) => {
  return (
    <div className={`stat ${color}`}>
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
};

export default StatCard;