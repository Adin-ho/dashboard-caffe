import { useEffect, useState, useCallback } from "react";

/**
 Karyawan.jsx
 - Login: POST /login-karyawan
 - List:  GET  /auth2/get-karyawan
 - Create: POST /auth2/create-karyawan
 - Update: PUT /auth2/update-karyawan/:id  (fallback PUT /auth2/update-karyawan)
 - Delete: DELETE /auth2/delete-karyawan/:id
 - Uses dev proxy: /api -> your host (see vite.config.js)
 - Token priority: localStorage.token -> VITE_API_TOKEN
*/

const API_LOGIN = "/api/login-karyawan";
const API_GET = "/api/auth2/get-karyawan";
const API_CREATE = "/api/auth2/create-karyawan";
const API_UPDATE_ID = (id) => `/api/auth2/update-karyawan/${id}`;
const API_UPDATE = `/api/auth2/update-karyawan`;
const API_DELETE_ID = (id) => `/api/auth2/delete-karyawan/${id}`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || import.meta.env.VITE_API_TOKEN || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Karyawan() {
  // auth & login UI
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // list state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);

  // create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const initialForm = { nama: "", username: "", password: "", role: "karyawan" };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // fetch list
  const fetchList = useCallback(async () => {
    setLoading(true);
    setListError(null);
    setItems([]);
    try {
      const res = await fetch(API_GET, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        credentials: "omit",
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      // Example response in your earlier message looked like single object — normalize:
      // If server returns { data: [...] } or directly array.
      let list = [];
      if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data)) list = data;
      else if (data?.data && typeof data.data === "object") {
        // If data is single object, try to convert to array
        if (Array.isArray(data.data)) list = data.data;
        else list = Array.isArray(data.data) ? data.data : [data.data];
      } else if (data) list = [data];
      else list = [];

      setItems(list);
    } catch (err) {
      console.error("Fetch karyawan error:", err);
      setListError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchList();
  }, [isLoggedIn, fetchList]);

  // login handler
  const doLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify(loginData),
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e){ data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      // backend should return token (assumption). Try common fields:
      const token = data?.token || data?.access_token || data?.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        setIsLoggedIn(true);
        setLoginData({ username: "", password: "" });
        // after login, fetch list
        await fetchList();
      } else {
        // If no token but login succeeded, still try fetch list
        await fetchList();
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(err);
    } finally {
      setLoginLoading(false);
    }
  };

  // logout
  const doLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setItems([]);
  };

  // open create modal
  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  // open edit with fill
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nama: item.nama || "",
      username: item.username || "",
      password: "", // do not prefill password
      role: item.role || "karyawan",
    });
    setShowModal(true);
  };

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // save create/update
  const saveItem = async () => {
    setSaving(true);
    setListError(null);
    try {
      const payload = { ...form };
      let url = API_CREATE;
      let method = "POST";

      if (editing && editing.id) {
        // try id-based update
        url = API_UPDATE_ID(editing.id);
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        credentials: "omit",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e){ data=null; }

      if (!res.ok) {
        // fallback: try generic update endpoint without id
        if (method === "PUT") {
          const res2 = await fetch(API_UPDATE, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getAuthHeader() },
            credentials: "omit",
            body: JSON.stringify({ id: editing.id, ...payload }),
          });
          const t2 = await res2.text();
          let d2;
          try { d2 = t2 ? JSON.parse(t2) : null } catch(e){ d2 = null }
          if (!res2.ok) throw { status: res2.status, body: d2 ?? t2 };
        } else throw { status: res.status, body: data ?? text };
      }

      await fetchList();
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      console.error("Save karyawan error:", err);
      setListError(err);
    } finally {
      setSaving(false);
    }
  };

  // delete
  const deleteItem = async (id) => {
    if (!confirm("Hapus karyawan ini?")) return;
    setListError(null);
    try {
      const res = await fetch(API_DELETE_ID(id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        credentials: "omit",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let d;
        try { d = txt ? JSON.parse(txt) : null } catch(e){ d = null }
        throw { status: res.status, body: d ?? txt };
      }

      await fetchList();
    } catch (err) {
      console.error("Delete error:", err);
      setListError(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Karyawan</h2>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button onClick={() => fetchList()} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
              <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">+ Create</button>
              <button onClick={doLogout} className="px-3 py-2 bg-red-500 text-white rounded">Logout</button>
            </>
          ) : (
            <div className="text-sm text-gray-600">Please login to manage karyawan</div>
          )}
        </div>
      </div>

      {/* Login box */}
      {!isLoggedIn && (
        <div className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Login Karyawan (Dev)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded p-2" placeholder="username" value={loginData.username} onChange={(e) => setLoginData((s) => ({ ...s, username: e.target.value }))} />
            <input type="password" className="border rounded p-2" placeholder="password" value={loginData.password} onChange={(e) => setLoginData((s) => ({ ...s, password: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={doLogin} disabled={loginLoading} className="px-4 py-2 bg-blue-600 text-white rounded">{loginLoading ? "Logging..." : "Login"}</button>
              <button onClick={() => { setLoginData({ username: "", password: "" }); localStorage.removeItem("token"); }} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
            </div>
          </div>
          {loginError && <div className="mt-3 text-sm text-red-600">Login error: {JSON.stringify(loginError)}</div>}
          <div className="mt-3 text-xs text-gray-500">Tip: for dev you can set token in localStorage manually to skip login.</div>
        </div>
      )}

      {/* list errors */}
      {listError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="font-medium">Error</div>
          <pre className="text-xs mt-2">{JSON.stringify(listError, null, 2)}</pre>
        </div>
      )}

      {/* list */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="p-3">#</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Username</th>
              <th className="p-3">Role</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-600">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No karyawan</td></tr>
            ) : (
              items.map((it, idx) => (
                <tr key={it.id ?? idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{it.nama}</td>
                  <td className="p-3">{it.username}</td>
                  <td className="p-3">{it.role}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(it)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                      <button onClick={() => deleteItem(it.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal create/edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-xl rounded shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editing ? "Edit Karyawan" : "Create Karyawan"}</h3>
              <div>
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-3 py-1 bg-gray-200 rounded">Close</button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Nama</label>
                <input className="w-full border rounded p-2" value={form.nama} onChange={(e) => onChange("nama", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Username</label>
                  <input className="w-full border rounded p-2" value={form.username} onChange={(e) => onChange("username", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Password</label>
                  <input type="password" className="w-full border rounded p-2" value={form.password} onChange={(e) => onChange("password", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Role</label>
                  <select className="w-full border rounded p-2" value={form.role} onChange={(e) => onChange("role", e.target.value)}>
                    <option value="karyawan">karyawan</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={saveItem} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : (editing ? "Update" : "Create")}</button>
              </div>

              {listError && <div className="text-sm text-red-600">Error: {JSON.stringify(listError)}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
