import React, { useEffect, useState } from "react";
import axios from "axios";

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Token tidak ditemukan. Silakan login dulu.");
        return;
      }

      const res = await axios.get(
        "https://api-kedai-genz.vercel.app/auth2/get-all-order",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(res.data.history || []);
    } catch (err) {
      console.log("ERROR:", err);
      setError(err.response?.data || "Gagal mengambil data order");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Daftar Order</h1>

      {error && (
        <div className="bg-red-100 border border-red-500 text-red-700 p-3 mb-4">
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-600">Tidak ada data order...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Total Item</th>
              <th className="border p-2">Total Harga</th>
              <th className="border p-2">Setelah Kupon</th>
              <th className="border p-2">Detail Produk</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">{item.tanggal}</td>
                <td className="border p-2">{item.total_item}</td>
                <td className="border p-2">{item.total_harga}</td>
                <td className="border p-2">{item.total_setelah_kupon}</td>
                <td className="border p-2">
                  {item.data.map((p) => (
                    <div key={p.id}>
                      {p.nama} — {p.quantity} pcs — Rp {p.harga}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
