export default function Navbar() {
  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-3">
        <span className="font-medium">Admin</span>
        <img
          src="https://api.multiavatar.com/admin.svg"
          alt="avatar"
          className="w-9 h-9 rounded-full border"
        />
      </div>
    </header>
  );
}
