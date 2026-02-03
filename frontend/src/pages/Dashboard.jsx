import React, { useEffect, useState } from "react";
import AddUrl from "./AddUrl";
import UrlTable from "../components/UrlTable";
import StatCard from "../components/StatCard";
import axios from "axios";

const Dashboard = () => {
  const [websites, setWebsites] = useState([]);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/urls");
        setWebsites(res.data);
        setLastCheck(new Date());
      } catch (err) {
        console.error(err);
      }
    };

    fetchWebsites();
    // Optionally, refresh every 5 minutes
    const interval = setInterval(fetchWebsites, 300000);
    return () => clearInterval(interval);
  }, []);

  const upWebsites = websites.filter((w) => w.status === "up");
  const downWebsites = websites.filter((w) => w.status === "down");
  const uptimePercent = ((upWebsites.length / websites.length) * 100).toFixed(1);

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ===== TOP STAT CARDS ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Websites UP" value={upWebsites.length} color="green" icon="✅" />
        <StatCard title="Websites DOWN" value={downWebsites.length} color="red" icon="❌" />
        <StatCard title="Avg Response" value="432 ms" color="yellow" icon="⏱️" />
        <StatCard title="Uptime (7 Days)" value={`${uptimePercent}%`} color="blue" icon="📊" />
      </section>

      {/* ===== UP / DOWN Website Lists ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-md">
          <h2 className="text-green-400 font-bold mb-2">✅ Websites UP</h2>
          <ul className="space-y-1">
            {upWebsites.map((w) => (
              <li key={w._id} className="bg-green-700 p-2 rounded-md">{w.domain}</li>
            ))}
            {upWebsites.length === 0 && <li>No websites are UP.</li>}
          </ul>
        </div>
        <div className="bg-gray-800 p-4 rounded-md">
          <h2 className="text-red-400 font-bold mb-2">❌ Websites DOWN</h2>
          <ul className="space-y-1">
            {downWebsites.map((w) => (
              <li key={w._id} className="bg-red-700 p-2 rounded-md">{w.domain}</li>
            ))}
            {downWebsites.length === 0 && <li>No websites are DOWN.</li>}
          </ul>
        </div>
      </section>

      {/* ===== OTHER METRICS ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sites" value={websites.length} color="gray" icon="🌐" />
        <StatCard title="Uptime" value={`${uptimePercent}%`} color="green" icon="📈" />
        <StatCard title="Last Check" value={lastCheck?.toLocaleTimeString()} color="blue" icon="⏰" />
        <StatCard title="Settings" value="Configure" color="purple" icon="⚙️" />
      </section>

      {/* ===== EXISTING FLOW (UNCHANGED) ===== */}
      <AddUrl />
      <UrlTable />
    </main>
  );
};

export default Dashboard;
