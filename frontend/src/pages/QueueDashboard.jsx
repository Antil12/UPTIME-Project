import React from "react";

const QueueDashboard = () => {
  return (
    <div className="w-full h-[85vh] rounded-xl overflow-hidden border dark:border-gray-700">
      <iframe
        src="http://localhost:5000/bulldashboard"
        title="Queue Dashboard"
        className="w-full h-full"
      />
    </div>
  );
};

export default QueueDashboard;