import { useEffect, useState } from "react";

const API_URL = "/api/auth2/get-user"; // proxied by vite to https://api-kedai-genz.vercel.app/auth2/get-user

export default function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ambil token dari env build (Vite)
  const envToken = import.meta.env.VITE_API_TOKEN || "";

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      setUsers([]);

      // prioritas: token di localStorage (jika login flow sudah ada),
      // fallback ke token env (development token).
      const token = localStorage.getItem("token") || envToken;

      try {
        const res = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // kirim Authorization hanya jika token ada
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "omit", // kita pakai proxy, jadi omit (kecuali backend butuh cookie)
        });

        // jika fetch gagal (network / CORS) -> throw
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let body;
          try { body = text ? JSON.parse(text) : text; } catch(e){ body = text; }
          throw { status: res.status, body };
        }

        const data = await res.json();
        // data diharapkan bentuk { data: [ ... ] }
        if (data && Array.isArray(data.data)) {
          setUsers(data.data);
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setError({ message: "Unexpected response structure", body: data });
        }
      } catch (err) {
        console.error("Fetch users error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // run once on mount

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Users</h1>

      {loading && <div className="text-gray-600 mb-4">Loading users...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
          <div className="font-semibold">Error loading users</div>
          {error.status && <div>HTTP status: {error.status}</div>}
          {error.message && <div>Message: {String(error.message)}</div>}
          {error.body && (
            <pre className="mt-2 max-h-40 overflow-auto bg-white p-2 text-xs rounded">
              {typeof error.body === "string" ? error.body : JSON.stringify(error.body, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="p-4">#</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u, idx) => (
                <tr key={u.id || idx} className="border-b hover:bg-blue-50">
                  <td className="p-4">{idx + 1}</td>
                  <td className="p-4 font-medium">{u.nama}</td>
                  <td className="p-4">{u.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={3}>
                  Tidak ada data user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}