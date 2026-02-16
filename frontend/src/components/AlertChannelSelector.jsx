import React from "react";

const channels = [
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "SMS", value: "sms" },
  { label: "Voice Call", value: "voice" },
];

const AlertChannelSelector = ({ selected, setSelected }) => {
  const toggleChannel = (value) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((c) => c !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium text-sm">Alert Notification Channels</label>
      <div className="grid grid-cols-2 gap-2">
        {channels.map((channel) => (
          <button
            key={channel.value}
            type="button"
            onClick={() => toggleChannel(channel.value)}
            className={`p-2 rounded-lg border text-sm 
              ${selected.includes(channel.value)
                ? "bg-blue-600 text-white"
                : "bg-white/10 border-gray-300"}`}
          >
            {channel.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlertChannelSelector;
