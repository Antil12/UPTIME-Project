import SettingsMenu from "./SettingsMenu";

function Navbar() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "15px" }}>
      <SettingsMenu />
    </div>
  );
}

export default Navbar;
