// src/pages/Produk.jsx
import { useEffect, useState, useCallback } from "react";

/*
  Produk.jsx
  - expects proxied endpoints (see vite.config.js):
    GET  /api/get-produk
    POST /api/auth2/create-produk
    PUT  /api/auth2/update-produk/:id
    DELETE /api/auth2/delete-produk/:id

  - token: localStorage.getItem("token") || import.meta.env.VITE_API_TOKEN
*/

const API_GET = "/api/get-produk";
const API_CREATE = "/api/auth2/create-produk";
const API_UPDATE = (id) => `/api/auth2/update-produk/${id}`;
const API_DELETE = (id) => `/api/auth2/delete-produk/${id}`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || import.meta.env.VITE_API_TOKEN || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Produk() {
  const [grouped, setGrouped] = useState({}); // {Kategori: [items]}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI states
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // product object or null for create
  const [confirmDelete, setConfirmDelete] = useState(null);

  // form state
  const emptyForm = {
    judul: "",
    gambar: "",
    deskripsi: "",
    kategori: "",
    harga: 0,
    point: 0,
    stock: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_GET, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        credentials: "omit", // using proxy; change to "include" only if backend requires cookies and CORS allows it
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }

      if (!res.ok) {
        throw { status: res.status, body: data ?? text };
      }

      // Expect shape: { data: { "Dessert": [], "Makanan": [...], "Minuman": [] }, message: "..." }
      const groupedData = data?.data ?? {};
      setGrouped(groupedData);

      const cats = Object.keys(groupedData);
      if (cats.length && !activeCategory) setActiveCategory(cats[0]);
    } catch (err) {
      console.error("Fetch produk error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      judul: p.judul ?? "",
      gambar: p.gambar ?? "",
      deskripsi: p.deskripsi ?? "",
      kategori: p.kategori ?? "",
      harga: Number(String(p.harga).replace(/\D/g, "")) || 0,
      point: p.point ?? 0,
      stock: p.stock ?? 0,
    });
    setShowModal(true);
  };

  const onChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const saveProduct = async () => {
    setSaving(true);
    setError(null);

    // basic validation
    if (!form.judul || !form.kategori) {
      setError({ message: "Judul dan kategori harus diisi" });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        judul: form.judul,
        gambar: form.gambar,
        deskripsi: form.deskripsi,
        kategori: form.kategori,
        harga: Number(form.harga) || 0,
        point: Number(form.point) || 0,
        stock: Number(form.stock) || 0,
      };

      const url = editing ? API_UPDATE(editing.id) : API_CREATE;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        credentials: "omit",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e){ data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      // success: refresh list
      await fetchList();
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      console.error("Save product error:", err);
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = async (p) => {
    setConfirmDelete(p);
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setError(null);
    try {
      const res = await fetch(API_DELETE(confirmDelete.id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        credentials: "omit",
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e){ data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      await fetchList();
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err);
    }
  };

  const formatPrice = (val) => {
    if (typeof val === "number") return "Rp. " + val.toLocaleString("id-ID");
    return val;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Produk</h2>
        <div className="flex gap-2">
          <button onClick={fetchList} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Refresh</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Create Produk</button>
        </div>
      </div>

      {loading && <div className="mb-4 text-gray-600">Loading produk...</div>}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="font-medium">Error</div>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {Object.keys(grouped).length === 0 ? (
            <span className="text-sm text-gray-500">No categories</span>
          ) : (
            Object.keys(grouped).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${activeCategory === cat ? "bg-blue-600 text-white" : "bg-white border"}`}
              >
                {cat} <span className="ml-2 text-xs text-gray-500">({grouped[cat]?.length || 0})</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {(!activeCategory || !grouped[activeCategory] || grouped[activeCategory].length === 0) ? (
          <div className="p-6 text-center text-gray-500">Tidak ada produk pada kategori ini.</div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-blue-600 text-white text-left">
                    <th className="p-4">#</th>
                    <th className="p-4">Gambar</th>
                    <th className="p-4">Judul</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4">Point</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[activeCategory].map((p, i) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 align-top">{i + 1}</td>
                      <td className="p-4">
                        {p.gambar ? (
                          <img src={p.gambar} alt={p.judul} className="w-20 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-20 h-14 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">No image</div>
                        )}
                      </td>
                      <td className="p-4 align-top font-medium">{p.judul}</td>
                      <td className="p-4 align-top text-sm text-gray-600">{p.deskripsi}</td>
                      <td className="p-4 align-top">{formatPrice(p.harga)}</td>
                      <td className="p-4 align-top">{p.point}</td>
                      <td className="p-4 align-top">{p.stock}</td>
                      <td className="p-4 align-top">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                          <button onClick={() => confirmDeleteProduct(p)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {grouped[activeCategory].map((p, i) => (
                <div key={p.id} className="border rounded p-3 flex gap-3">
                  {p.gambar ? (
                    <img src={p.gambar} alt={p.judul} className="w-20 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-20 h-16 bg-gray-100 rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{p.judul}</div>
                        <div className="text-xs text-gray-500">{p.kategori}</div>
                      </div>
                      <div className="text-sm font-bold">{formatPrice(p.harga)}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">{p.deskripsi}</div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Edit</button>
                      <button onClick={() => confirmDeleteProduct(p)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editing ? "Edit Produk" : "Create Produk"}</h3>
              <div>
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-3 py-1 bg-gray-200 rounded">Close</button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium">Judul</label>
                <input value={form.judul} onChange={(e) => onChange("judul", e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Gambar (URL)</label>
                <input value={form.gambar} onChange={(e) => onChange("gambar", e.target.value)} className="w-full border rounded p-2" />
                {form.gambar && <img src={form.gambar} alt="preview" className="mt-2 w-32 h-20 object-cover rounded" />}
              </div>
              <div>
                <label className="block text-sm font-medium">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => onChange("deskripsi", e.target.value)} className="w-full border rounded p-2" rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium">Kategori</label>
                  <input value={form.kategori} onChange={(e) => onChange("kategori", e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Harga</label>
                  <input type="number" value={form.harga} onChange={(e) => onChange("harga", e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Point</label>
                  <input type="number" value={form.point} onChange={(e) => onChange("point", e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => onChange("stock", e.target.value)} className="w-full border rounded p-2" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={saveProduct} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : (editing ? "Update" : "Create")}</button>
              </div>

              {error && <div className="text-sm text-red-600">Error: {JSON.stringify(error)}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded p-4 max-w-md w-full">
            <div className="font-semibold mb-2">Hapus Produk</div>
            <div className="text-sm text-gray-600 mb-4">Yakin hapus <strong>{confirmDelete.judul}</strong>?</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 bg-gray-200 rounded">Batal</button>
              <button onClick={doDelete} className="px-3 py-1 bg-red-600 text-white rounded">Hapus</button>
            </div>
            {error && <pre className="mt-3 text-xs text-red-600">{JSON.stringify(error, null, 2)}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}
