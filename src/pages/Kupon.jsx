import { useCallback, useEffect, useState } from "react";

/**
 * Kupon.jsx
 * - Menyesuaikan kupon_type valid values sesuai backend:
 *   ["free_item","diskon","potongan_kategori","potongan_rupiah"]
 * - Validasi klien sebelum submit
 * - Tampilkan pesan error server bila ada
 *
 * Endpoints (via /api proxy recommended):
 * GET    /api/auth2/get-all-kupon
 * POST   /api/auth2/create-kupon
 * PUT    /api/auth2/update-kupon/:id   (fallback PUT /api/auth2/update-kupon)
 * DELETE /api/auth2/delete-kupon        (body: { ids: [...] })
 */

const API_LIST = "/api/auth2/get-all-kupon";
const API_CREATE = "/api/auth2/create-kupon";
const API_UPDATE_ID = (id) => `/api/auth2/update-kupon/${id}`;
const API_UPDATE = "/api/auth2/update-kupon";
const API_DELETE = "/api/auth2/delete-kupon";

const allowedTypes = ["free_item", "diskon", "potongan_kategori", "potongan_rupiah"];

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || import.meta.env.VITE_API_TOKEN || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Kupon() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI & form state
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);

  const initialForm = {
    kupon_type: "diskon",
    code: "",
    jumlah: 1,
    minimal_pembelian: 0,
    potongan: 0,
    insentif: "",
    deskripsi: "",
    kategori: "",
    // optional fields for free_item
    free_item_sku: "",
    free_item_qty: 1,
  };
  const [form, setForm] = useState(initialForm);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    setServerMessage(null);
    try {
      const res = await fetch(API_LIST, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        credentials: "omit",
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e){ data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      // Normalize: backend returns { data: [...] } or similar
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : (data?.data ? (Array.isArray(data.data) ? data.data : [data.data]) : []);
      setItems(list);
    } catch (err) {
      console.error("Fetch kupon error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // form helpers
  const onChange = (key, value) => setForm(s => ({ ...s, [key]: value }));

  const validateForm = () => {
    setServerMessage(null);
    // code required
    if (!form.code || form.code.trim() === "") {
      return { ok: false, message: "Kode kupon (code) wajib diisi." };
    }

    // kupon_type required and must be allowed
    if (!form.kupon_type || !allowedTypes.includes(form.kupon_type)) {
      return { ok: false, message: `kupon_type harus salah satu dari: ${allowedTypes.join(", ")}` };
    }

    // For discount types, potongan must be > 0
    if (["diskon", "potongan_rupiah"].includes(form.kupon_type)) {
      if (form.potongan === "" || Number(form.potongan) <= 0) {
        return { ok: false, message: "Potongan harus diisi dan lebih besar dari 0 untuk tipe diskon/potongan_rupiah." };
      }
    }

    // jumlah must be positive integer
    if (!Number.isInteger(Number(form.jumlah)) || Number(form.jumlah) < 1) {
      return { ok: false, message: "Jumlah kupon harus bilangan bulat >= 1." };
    }

    // minimal_pembelian >= 0
    if (Number(form.minimal_pembelian) < 0) {
      return { ok: false, message: "Minimal pembelian tidak boleh negatif." };
    }

    // for free_item make sure free_item_sku provided
    if (form.kupon_type === "free_item" && (!form.free_item_sku || form.free_item_sku.trim() === "")) {
      return { ok: false, message: "Untuk kupon tipe free_item, field free_item_sku harus diisi." };
    }

    return { ok: true };
  };

  const saveKupon = async () => {
    setSaving(true);
    setError(null);
    setServerMessage(null);

    const v = validateForm();
    if (!v.ok) {
      setSaving(false);
      setServerMessage({ type: "error", text: v.message });
      return;
    }

    // build payload: remove empty optional fields
    const payload = {
      kupon_type: form.kupon_type,
      code: form.code.trim(),
      jumlah: Number(form.jumlah) || 0,
      minimal_pembelian: Number(form.minimal_pembelian) || 0,
      potongan: (form.potongan !== "" && form.potongan != null) ? Number(form.potongan) : undefined,
      insentif: form.insentif ? form.insentif : undefined,
      deskripsi: form.deskripsi ? form.deskripsi : undefined,
      kategori: form.kategori ? form.kategori : undefined,
    };

    // include free_item fields if relevant
    if (form.kupon_type === "free_item") {
      payload.free_item_sku = form.free_item_sku;
      payload.free_item_qty = Number(form.free_item_qty) || 1;
    }

    try {
      let url = API_CREATE;
      let method = "POST";
      if (editing && editing.id) {
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
      try { data = text ? JSON.parse(text) : null; } catch(e){ data = null; }

      if (!res.ok) {
        // try fallback update (if update by id not supported)
        if (method === "PUT" && res.status >= 400) {
          const res2 = await fetch(API_UPDATE, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getAuthHeader() },
            credentials: "omit",
            body: JSON.stringify({ id: editing.id, ...payload }),
          });
          const t2 = await res2.text();
          let d2;
          try { d2 = t2 ? JSON.parse(t2) : null } catch(e){ d2 = null; }
          if (!res2.ok) throw { status: res2.status, body: d2 ?? t2 };
        } else {
          throw { status: res.status, body: data ?? text };
        }
      }

      setServerMessage({ type: "success", text: data?.message ?? "Berhasil menyimpan kupon" });
      await fetchList();
      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
    } catch (err) {
      console.error("Save kupon error:", err);
      let msg = "Gagal menyimpan kupon";
      if (err?.body) msg = err.body?.message ?? JSON.stringify(err.body);
      setServerMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  // delete multiple
  const doDelete = async (idsArray) => {
    if (!idsArray || idsArray.length === 0) return;
    setError(null);
    setServerMessage(null);
    try {
      const res = await fetch(API_DELETE, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        credentials: "omit",
        body: JSON.stringify({ ids: idsArray }),
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null } catch(e){ data=null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      setServerMessage({ type: "success", text: data?.message ?? "Berhasil menghapus." });
      await fetchList();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Delete error:", err);
      let msg = "Gagal menghapus kupon";
      if (err?.body) msg = err.body?.message ?? JSON.stringify(err.body);
      setServerMessage({ type: "error", text: msg });
    }
  };

  // UI small helpers
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setServerMessage(null);
    setShowModal(true);
  };

  const openEdit = (kupon) => {
    setEditing(kupon);
    setForm({
      kupon_type: kupon.kupon_type ?? initialForm.kupon_type,
      code: kupon.code ?? "",
      jumlah: kupon.jumlah ?? 1,
      minimal_pembelian: kupon.minimal_pembelian ?? 0,
      potongan: kupon.potongan ?? 0,
      insentif: kupon.insentif ?? "",
      deskripsi: kupon.deskripsi ?? "",
      kategori: kupon.kategori ?? "",
      free_item_sku: kupon.free_item_sku ?? "",
      free_item_qty: kupon.free_item_qty ?? 1,
    });
    setShowModal(true);
  };

  const filtered = items.filter(it => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (it.code || "").toLowerCase().includes(q) || (it.insentif || "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Kupon</h2>
        <div className="flex gap-2">
          <button onClick={fetchList} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">+ Create Kupon</button>
          <button
            onClick={() => { if (selectedIds.size===0) return alert("Pilih kupon dulu"); if (!confirm("Hapus selected kupon?")) return; doDelete(Array.from(selectedIds)); }}
            className="px-3 py-2 bg-red-600 text-white rounded"
          >
            Delete Selected
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or insentif..." className="border rounded p-2 flex-1" />
        <div className="text-sm text-gray-600">Found: {filtered.length}</div>
      </div>

      {loading && <div className="text-gray-600 mb-4">Loading kupon...</div>}
      {serverMessage && (
        <div className={`mb-4 p-3 rounded ${serverMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {serverMessage.text}
        </div>
      )}
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{JSON.stringify(error)}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="p-3"><input type="checkbox" onChange={e => {
                if (e.target.checked) setSelectedIds(new Set(items.map(it => it.id)));
                else setSelectedIds(new Set());
              }} checked={selectedIds.size === items.length && items.length>0} /></th>
              <th className="p-3">#</th>
              <th className="p-3">Code</th>
              <th className="p-3">Tipe</th>
              <th className="p-3">Jumlah</th>
              <th className="p-3">Minimal</th>
              <th className="p-3">Potongan</th>
              <th className="p-3">Insentif</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="p-4 text-center text-gray-500">No coupons found.</td></tr>
            ) : (
              filtered.map((k, idx) => (
                <tr key={k.id ?? idx} className="border-b hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.has(k.id)} onChange={() => toggleSelect(k.id)} /></td>
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-mono">{k.code}</td>
                  <td className="p-3">{k.kupon_type}</td>
                  <td className="p-3">{k.jumlah}</td>
                  <td className="p-3">{k.minimal_pembelian}</td>
                  <td className="p-3">{k.potongan ?? "-"}</td>
                  <td className="p-3">{k.insentif ?? "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(k)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                      <button onClick={() => { if (!confirm(`Hapus kupon ${k.code}?`)) return; doDelete([k.id]); }} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editing ? "Edit Kupon" : "Create Kupon"}</h3>
              <div>
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-3 py-1 bg-gray-200 rounded">Close</button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Tipe Kupon</label>
                <select value={form.kupon_type} onChange={(e) => onChange("kupon_type", e.target.value)} className="w-full border rounded p-2">
                  {allowedTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="text-xs text-gray-500 mt-1">Tipe harus sesuai: {allowedTypes.join(", ")}</div>
              </div>

              <div>
                <label className="block text-sm font-medium">Code</label>
                <input value={form.code} onChange={(e) => onChange("code", e.target.value)} className="w-full border rounded p-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Jumlah</label>
                  <input type="number" value={form.jumlah} onChange={(e) => onChange("jumlah", e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium">Minimal Pembelian</label>
                  <input type="number" value={form.minimal_pembelian} onChange={(e) => onChange("minimal_pembelian", e.target.value)} className="w-full border rounded p-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium">Potongan (angka)</label>
                  <input type="number" value={form.potongan} onChange={(e) => onChange("potongan", e.target.value)} className="w-full border rounded p-2" />
                  <div className="text-xs text-gray-500 mt-1">Jika tipe diskon → persen, potongan_rupiah → nominal</div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Insentif</label>
                  <input value={form.insentif} onChange={(e) => onChange("insentif", e.target.value)} className="w-full border rounded p-2" />
                </div>
              </div>

              {/* free_item fields */}
              {form.kupon_type === "free_item" && (
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-sm font-medium mb-2">Pengaturan free_item</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="SKU / nama produk" value={form.free_item_sku} onChange={(e) => onChange("free_item_sku", e.target.value)} className="border rounded p-2" />
                    <input type="number" value={form.free_item_qty} onChange={(e) => onChange("free_item_qty", e.target.value)} className="border rounded p-2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => onChange("deskripsi", e.target.value)} className="w-full border rounded p-2" rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={saveKupon} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : (editing ? "Update" : "Create")}</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
