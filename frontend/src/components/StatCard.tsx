import "../styles/StatCard.css";

type StatCardProps = {
  title: string;
  value: string | number;
  color: string;
};

const StatCard = ({ title, value, color }: StatCardProps) => {
  return (
    <div className={`stat ${color}`}>
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
};

export default StatCard;