export default function Dashboard() {
  const cards = [
    { title: "Total User", value: 0 },
    { title: "Total Produk", value: 0 },
    { title: "Total Kupon", value: 0 },
    { title: "Total Karyawan", value: 0 },
    { title: "Total Order", value: 0 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Coffe</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cards.map((c) => (
          <div key={c.title} className="bg-white p-6 shadow rounded-lg">
            <h3 className="text-gray-600 text-lg font-medium">{c.title}</h3>
            <p className="mt-3 text-4xl font-bold text-blue-600">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
