import React, { useState } from "react";
import ShaderBackground from "../components/ShaderBackground";

const AddUrl = ({
  theme,
  domain,
  url,
  setDomain,
  setUrl,
  urlError,
  onSave,
  urls = [],
}) => {
  const [responseThresholdMs, setResponseThresholdMs] = useState("");
  const [alertChannels, setAlertChannels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [alertIfAllRegionsDown, setAlertIfAllRegionsDown] = useState(false);
  const [category, setCategory] = useState("");
  const [localError, setLocalError] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [phoneContact, setPhoneContact] = useState("");
  const [priority, setPriority] = useState(0); 

  const normalize = (value = "") =>
    value.trim().toLowerCase().replace(/\/$/, "");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const normalizedDomain = normalize(domain);
    const normalizedUrl = normalize(url);

    if (!normalizedDomain || !normalizedUrl) {
      setLocalError("❌ Domain and URL are required");
      return;
    }

    const duplicateDomain = urls.some(
      (u) => normalize(u.domain) === normalizedDomain
    );

    if (duplicateDomain) {
      setLocalError("❌ Domain name already exists");
      return;
    }

    const duplicateUrl = urls.some(
      (u) => normalize(u.url) === normalizedUrl
    );

    if (duplicateUrl) {
      setLocalError("❌ URL already exists");
      return;
    }

    onSave({
      domain: domain.trim(),
      url: url.trim(),
      category: category.trim() || null,
      responseThresholdMs,
      alertChannels,
      regions,
      alertIfAllRegionsDown,
      emailContact,
      phoneContact,
      priority,
    });

    setCategory("");
  };

  const isDark = theme === "dark";

  const containerClass = isDark
    ? "bg-gray-900 text-white border border-gray-700"
    : "bg-white text-gray-900 border border-gray-200";

  const inputClass = isDark
    ? "w-full p-3 rounded-xl border bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    : "w-full p-3 rounded-xl border bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  const chipBase =
    "px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200";

 return (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

    {/* 🔥 WebGL Animated Background */}
    <ShaderBackground />

    {/* Soft Overlay (Improves readability) */}
    <div
      className={`
        absolute inset-0 backdrop-blur-[2px]
        ${isDark ? "bg-black/40" : "bg-white/40"}
      `}
    />

    {/* Main Container */}
    <div className="relative z-10 w-full max-w-3xl px-6 py-16">

      <div
        className={`
          relative p-12 rounded-3xl
          backdrop-blur-3xl
          border
          shadow-[0_25px_80px_rgba(0,0,0,0.25)]
          transition-all duration-500
          ${
            isDark
              ? "bg-white/5 border-white/10 text-white"
              : "bg-white/70 border-gray-200 text-gray-900"
          }
        `}
      >

        {/* Gradient Edge Glow */}
        <div
          className="
            absolute -inset-[1px] rounded-3xl
            bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-transparent
            opacity-40 blur-xl
            pointer-events-none
          "
        />

        {/* ================= HEADER ================= */}
        <div className="mb-14 relative">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Add Website
          </h2>
          <p className="text-sm opacity-60 mt-3">
            Configure uptime monitoring and alert preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ================= INPUTS ================= */}
          {[{
              type: "text",
              placeholder: "Domain Name",
              value: domain,
              setter: setDomain,
            },
            {
              type: "url",
              placeholder: "https://example.com",
              value: url,
              setter: setUrl,
            },
            {
              type: "text",
              placeholder: "Category (optional)",
              value: category,
              setter: setCategory,
            },
          ].map((field, i) => (
            <div key={i} className="relative group">
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                className={`
                  w-full px-5 py-4 rounded-2xl
                  bg-transparent border
                  outline-none
                  transition-all duration-300
                  ${
                    isDark
                      ? "border-white/10 focus:border-blue-500 placeholder-gray-400"
                      : "border-gray-300 focus:border-blue-600 placeholder-gray-500"
                  }
                  focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)]
                `}
              />

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-white/5 pointer-events-none" />
            </div>
          ))}

          {/* Response Time */}
          <input
            type="number"
            placeholder="Max Response Time (ms)"
            value={responseThresholdMs}
            onChange={(e) => setResponseThresholdMs(e.target.value)}
            className={`
              w-full px-5 py-4 rounded-2xl bg-transparent border
              transition-all duration-300 outline-none
              ${
                isDark
                  ? "border-white/10 focus:border-blue-500 placeholder-gray-400"
                  : "border-gray-300 focus:border-blue-600 placeholder-gray-500"
              }
              focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)]
            `}
          />

{/* ================= CHANNEL BUTTONS ================= */}
<div>
  <div className="flex items-center justify-between mb-4">
    <p className="text-sm opacity-70">
      Notification Channels
    </p>

    {/* 🔴 Priority Dropdown */}
    <div className="flex items-center gap-3">
      <span className="text-xs opacity-60">Priority</span>

    {/* 🔴 Priority Checkbox */}
<div className="flex items-center gap-3">
  <label className="flex items-center gap-2 text-xs cursor-pointer">
    
    <input
      type="checkbox"
      checked={priority === 1}
      onChange={(e) => setPriority(e.target.checked ? 1 : 0)}
      className="accent-red-600 w-4 h-4"
    />
    High Priority
  </label>
</div>

    </div>
  </div>


  <div className="flex flex-wrap gap-4 mb-6">
    {["email", "sms", "whatsapp", "voice"].map((channel) => {
      const active = alertChannels.includes(channel);

      return (
        <button
          key={channel}
          type="button"
          onClick={() =>
            setAlertChannels((prev) =>
              prev.includes(channel)
                ? prev.filter((c) => c !== channel)
                : [...prev, channel]
            )
          }
          className={`
            px-5 py-3 rounded-2xl
            transition-all duration-300
            font-medium tracking-wide
            backdrop-blur-xl border
            ${
              active
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30"
                : isDark
                ? "bg-white/5 border-white/10 hover:bg-white/10"
                : "bg-white/60 border-gray-300 hover:bg-gray-100"
            }
            hover:scale-105 active:scale-95
          `}
        >
          {channel.toUpperCase()}
        </button>
      );
    })}
  </div>

  {/* 🔹 Email Input */}
  {alertChannels.includes("email") && (
    <div className="relative group mb-4">
      <input
        type="email"
        placeholder="Enter email address for alerts"
        value={emailContact}
        onChange={(e) => setEmailContact(e.target.value)}
        className={`
          w-full px-5 py-4 rounded-2xl
          bg-transparent border
          transition-all duration-300 outline-none
          ${
            isDark
              ? "border-white/10 focus:border-blue-500 placeholder-gray-400"
              : "border-gray-300 focus:border-blue-600 placeholder-gray-500"
          }
          focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)]
        `}
      />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-white/5 pointer-events-none" />
    </div>
  )}

  {/* 🔹 Phone Input (SMS / WhatsApp / Voice) */}
  {(alertChannels.includes("sms") ||
    alertChannels.includes("whatsapp") ||
    alertChannels.includes("voice")) && (
    <div className="relative group">
      <input
        type="tel"
        placeholder="Enter mobile number (e.g. +91 9876543210)"
        value={phoneContact}
        onChange={(e) => setPhoneContact(e.target.value)}
        className={`
          w-full px-5 py-4 rounded-2xl
          bg-transparent border
          transition-all duration-300 outline-none
          ${
            isDark
              ? "border-white/10 focus:border-blue-500 placeholder-gray-400"
              : "border-gray-300 focus:border-blue-600 placeholder-gray-500"
          }
          focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)]
        `}
      />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-white/5 pointer-events-none" />
    </div>
  )}
</div>


          {/* ERROR */}
          {(urlError || localError) && (
            <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">
              {localError || urlError}
              
            </div>
            
          )}
          
          {/* ================= REGIONS ================= */}
<div>
  <p className="text-sm mb-4 opacity-70">
    Monitoring Regions
  </p>

  <div className="flex flex-wrap gap-4 mb-6">
    {["India", "USA", "Germany"].map((region) => {
      const active = regions.includes(region);

      return (
        <button
          key={region}
          type="button"
          onClick={() =>
            setRegions((prev) =>
              prev.includes(region)
                ? prev.filter((r) => r !== region)
                : [...prev, region]
            )
          }
          className={`
            px-5 py-3 rounded-2xl
            transition-all duration-300
            font-medium tracking-wide
            backdrop-blur-xl border
            ${
              active
                ? "bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/30"
                : isDark
                ? "bg-white/5 border-white/10 hover:bg-white/10"
                : "bg-white/60 border-gray-300 hover:bg-gray-100"
            }
            hover:scale-105 active:scale-95
          `}
        >
          {region}
        </button>
      );
    })}
  </div>

  {/* Alert Condition */}
  <label className="flex items-center gap-3 text-sm opacity-80 cursor-pointer">
    <input
      type="checkbox"
      checked={alertIfAllRegionsDown}
      onChange={(e) => setAlertIfAllRegionsDown(e.target.checked)}
      className="accent-blue-600 w-4 h-4"
    />
    Alert only if ALL regions are down
  </label>
</div>


          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className={`
              w-full py-5 rounded-2xl text-lg font-semibold
              transition-all duration-300
              ${
                isDark
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-500/30"
                  : "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg"
              }
              hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            Add Website
          </button>

        </form>
      </div>
    </div>
  </div>
);


};

export default AddUrl;
