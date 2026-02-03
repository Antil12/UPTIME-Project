import { useState } from "react";

export default function WebsiteTable({ sites }) {
  // local pin state (frontend only)
  const [pinned, setPinned] = useState({});

  const togglePin = (index) => {
    setPinned((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const deleteRow = (index) => {
    if (!confirm("Delete this website?")) return;
    sites.splice(index, 1); // UI-only delete (replace with backend later)
  };

  return (
    <div className="card">
      <h3>Website List</h3>

      <table>
        <thead>
          <tr>
            <th>Website</th>
            <th>Status</th>
            <th>Response</th>
            <th>Last Check</th>
            <th>Actions</th> {/* ✅ NEW */}
          </tr>
        </thead>

        <tbody>
          {sites.map((s, i) => (
            <tr key={i}>
              <td>{s.url}</td>
              <td className={s.status.toLowerCase()}>{s.status}</td>
              <td>{s.responseTime} ms</td>
              <td>{s.lastCheck}</td>

              {/* ✅ ACTION BAR */}
              <td>
                <button
                  onClick={() => togglePin(i)}
                  style={{
                    marginRight: "8px",
                    cursor: "pointer",
                    color: pinned[i] ? "gold" : "gray"
                  }}
                >
                  📌
                </button>

                <button
                  onClick={() => deleteRow(i)}
                  style={{ cursor: "pointer", color: "red" }}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
