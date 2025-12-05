import { useEffect, useState, useCallback } from "react";

/*
  Produk.jsx (updated)
  - Default active tab = "Semua Produk"
  - Menghapus tombol "Order" dari card aksi
  - Fetch list from /api/get-produk (proxy)
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

  // UI state
  // default active category is "Semua Produk"
  const [activeCategory, setActiveCategory] = useState("Semua Produk");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, else product object
  const [confirmDelete, setConfirmDelete] = useState(null);

  const initialForm = {
    judul: "",
    gambar: "",
    deskripsi: "",
    kategori: "",
    harga: 0,
    point: 0,
    stock: 0,
  };
  const [form, setForm] = useState(initialForm);
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
        credentials: "omit",
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }

      if (!res.ok) {
        throw { status: res.status, body: data ?? text };
      }

      // Expect: { data: { "Makanan": [...], "Minuman": [...], ... }, message }
      const groupedData = data?.data ?? {};

      // ensure categories include "Semua Produk" when displayed
      setGrouped(groupedData);

      // if current activeCategory is not present in keys and not "Semua Produk", fallback
      const cats = Object.keys(groupedData);
      if (activeCategory !== "Semua Produk" && !cats.includes(activeCategory)) {
        setActiveCategory("Semua Produk");
      }
    } catch (err) {
      console.error("Fetch produk error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    // on mount fetch and set default active
    setActiveCategory("Semua Produk");
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // open create modal
  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  // open edit modal -> fill form
  const openEdit = (product) => {
    setEditing(product);
    setForm({
      judul: product.judul || "",
      gambar: product.gambar || "",
      deskripsi: product.deskripsi || "",
      kategori: product.kategori || "",
      harga: Number((product.harga || 0).toString().replace(/\D/g, "")) || 0,
      point: product.point ?? 0,
      stock: product.stock ?? 0,
    });
    setShowModal(true);
  };

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const saveProduct = async () => {
    setSaving(true);
    setError(null);

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
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

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

  const deleteProduct = async (product) => {
    setError(null);
    try {
      const res = await fetch(API_DELETE(product.id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        credentials: "omit",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let body;
        try { body = text ? JSON.parse(text) : text; } catch(e){ body = text; }
        throw { status: res.status, body };
      }

      await fetchList();
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err);
    }
  };

  const formatPrice = (val) => {
    if (typeof val === "number") {
      return "Rp. " + val.toLocaleString("id-ID");
    }
    return val;
  };

  // helper to produce list shown depending on activeCategory
  const getDisplayedList = () => {
    if (activeCategory === "Semua Produk") {
      // flatten all categories
      const all = [];
      Object.values(grouped).forEach((arr) => {
        if (Array.isArray(arr)) all.push(...arr);
      });
      return all;
    }
    return grouped[activeCategory] || [];
  };

  // categories for tabs (keep order)
  const categories = ["Semua Produk", ...Object.keys(grouped)];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Produk</h2>
        <div className="flex items-center gap-3">
          {/* <button onClick={fetchList} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Refresh</button> */}
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Tambah Produk</button>
        </div>
      </div>

      {loading && <div className="mb-4 text-gray-600">Loading produk...</div>}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="font-medium">Error</div>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {/* category tabs */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {categories.length === 0 ? (
            <span className="text-sm text-gray-500">No categories</span>
          ) : (
            categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${activeCategory === cat ? "bg-blue-600 text-white" : "bg-white border"}`}
              >
                {cat} <span className="ml-2 text-xs text-gray-500">{cat === "Semua Produk" ? (() => {
                  // count total items
                  const all = [];
                  Object.values(grouped).forEach((a)=>{ if(Array.isArray(a)) all.push(...a)});
                  return `(${all.length})`;
                })() : `(${(grouped[cat]||[]).length})`}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* product list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getDisplayedList().length === 0 ? (
          <div className="col-span-full p-6 text-center text-gray-500">Tidak ada produk pada kategori ini.</div>
        ) : (
          getDisplayedList().map((p, i) => (
            <div key={p.id ?? i} className="bg-white rounded-lg shadow p-4">
              <div className="h-40 bg-gray-100 rounded mb-3 overflow-hidden flex items-center justify-center">
                {p.gambar ? (
                  <img src={p.gambar} alt={p.judul} className="w-full h-full object-cover"/>
                ) : (
                  <div className="text-sm text-gray-400">No image</div>
                )}
              </div>

              <div className="mb-2">
                <div className="text-sm text-blue-600 inline-block bg-blue-50 px-2 py-1 rounded-full">{p.kategori}</div>
                <div className="float-right text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{p.stock} tersedia</div>
              </div>

              <h3 className="text-lg font-semibold mb-1">{p.judul}</h3>
              <div className="text-blue-600 font-bold mb-2">{formatPrice(p.harga)}</div>
              <div className="text-sm text-gray-600 mb-3">{p.deskripsi}</div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">Edit</button>
                <button onClick={() => setConfirmDelete(p)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Hapus</button>
                {/* Order button removed as requested */}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editing ? "Edit Produk" : "Create Produk"}</h3>
              <div className="flex items-center gap-2">
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
                  <label className="block text-sm font-medium">Harga (number)</label>
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

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded p-4 max-w-md w-full">
            <div className="font-semibold mb-2">Hapus Produk</div>
            <div className="text-sm text-gray-600 mb-4">Yakin ingin menghapus <strong>{confirmDelete.judul}</strong>?</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 bg-gray-200 rounded">Batal</button>
              <button onClick={() => deleteProduct(confirmDelete)} className="px-3 py-1 bg-red-600 text-white rounded">Hapus</button>
            </div>
            {error && <pre className="mt-3 text-xs text-red-600">{JSON.stringify(error, null, 2)}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}
