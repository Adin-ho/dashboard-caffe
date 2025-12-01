export default function Sidebar({ page, setPage }) {
  const menu = [
    ["dashboard", "Dashboard"],
    ["user", "User"],
    ["produk", "Produk"],
    ["kupon", "Kupon"],
    ["karyawan", "Karyawan"],
    ["order", "Order"],
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="text-center font-bold text-xl py-6 border-b">
        Admin Panel
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menu.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPage(key)}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition
              ${page === key ? "bg-blue-600 text-white" : "hover:bg-gray-200"}
            `}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
