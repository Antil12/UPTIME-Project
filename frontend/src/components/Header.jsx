

const Header = () => {
  return (
    <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
      {/* Logo / Title */}
      <h1 className="text-xl font-bold tracking-wide">
        ⏱️ Uptime Monitor
      </h1>

      {/* Navigation */}
      <nav className="space-x-6 text-sm font-medium">
        <button className="hover:text-green-400 transition">
          Dashboard
        </button>
        <button className="hover:text-green-400 transition">
          Add URL
        </button>
        <button className="hover:text-green-400 transition">
          Reports
        </button>
      </nav>
    </header>
  );
};

export default Header;
