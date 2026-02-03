export default function Alerts({ alerts }) {
  return (
    <div className="card">
      <h3>Recent Alerts</h3>
      {alerts.map((a, i) => (
        <div key={i} className={`alert ${a.type}`}>
          <strong>{a.site}</strong> — {a.message}
          <span>{a.time}</span>
        </div>
      ))}
    </div>
  );
}
