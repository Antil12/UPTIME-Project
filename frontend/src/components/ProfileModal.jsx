import { X, Shield, Activity, Globe, Bell } from "lucide-react";

const ProfileModal = ({
  user,
  urls,
  theme,
  onClose,
}) => {
  const totalSites = urls.length;
  const upSites = urls.filter(u => u.status === "UP").length;
  const downSites = urls.filter(u => u.status === "DOWN").length;
  const slowSites = urls.filter(u => u.status === "SLOW").length;

  const token = localStorage.getItem("loginToken");

  let tokenExpiry = "Unknown";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    tokenExpiry = new Date(payload.exp * 1000).toLocaleString();
  } catch {}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">Profile Overview</h2>

        {/* BASIC INFO */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield size={16}/> Account Info
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Token Expiry:</strong> {tokenExpiry}</p>
          </div>
        </div>

        {/* MONITORING STATS */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Activity size={16}/> Monitoring Stats
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p>Total Sites: {totalSites}</p>
            <p>UP: {upSites}</p>
            <p>DOWN: {downSites}</p>
            <p>SLOW: {slowSites}</p>
          </div>
        </div>

        {/* ALERT INFO */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Bell size={16}/> Alert Preferences
          </h3>
          <p className="text-sm">
            Default Email: {user?.email}
          </p>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;