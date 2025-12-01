import { useEffect, useState, useCallback } from "react";

/**
 * Kupon.jsx
 *
 * Endpoints used (proxied via /api -> your host):
 * GET    /api/auth2/get-all-kupon        -> list all kupon
 * POST   /api/auth2/create-kupon         -> create kupon (body JSON)
 * PUT    /api/auth2/update-kupon/:id     -> update kupon (if your API uses :id)
 * PUT    /api/auth2/update-kupon         -> update kupon (fallback)
 * DELETE /api/auth2/delete-kupon         -> delete kupon (body: { ids: [...] })
 *
 * Auth: will send Authorization Bearer header if token present:
 *   localStorage.token || import.meta.env.VITE_API_TOKEN
 *
 * If your backend requires cookies/session, change credentials as needed and ensure backend CORS allows it.
 */

const API_LIST = "/api/auth2/get-all-kupon";
const API_CREATE = "/api/auth2/create-kupon";
const API_UPDATE_ID = (id) => `/api/auth2/update-kupon/${id}`;
const API_UPDATE = "/api/auth2/update-kupon";
const API_DELETE = "/api/auth2/delete-kupon";

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || import.meta.env.VITE_API_TOKEN || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Kupon() {
  const [items, setItems] = useState([]); // list of kupon objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  // selection for bulk delete
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // kupon object or null

  const initialForm = {
    kupon_type: "diskon", // or lainnya
    code: "",
    jumlah: 1,
    minimal_pembelian: 0,
    potongan: 0,
    insentif: "",
    deskripsi: "",
    kategori: "",
  };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const res = await fetch(API_LIST, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        credentials: "omit",
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

      if (!res.ok) {
        throw { status: res.status, body: data ?? text };
      }

      // The shape from your example looked like a single object in body (but not necessarily array).
      // We expect API returns something like: { data: [ { ... }, ... ], message: "..." } or maybe data: {...}
      // Normalize to array:
      let list = [];

      if (data === null) list = [];
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data)) list = data;
      else if (data.data && typeof data.data === "object") {
        // If API returned grouped or object, try to flatten arrays inside
        const flattened = [];
        Object.values(data.data).forEach((v) => {
          if (Array.isArray(v)) flattened.push(...v);
        });
        // if flattened not empty use it, else try to use data.data as single-item array
        list = flattened.length ? flattened : [data.data];
      } else if (data.data) {
        list = [data.data];
      } else {
        list = [];
      }

      setItems(list);
    } catch (err) {
      console.error("Fetch kupon error:", err);
      setError(err);
    } finally {
      setLoading(false);
      setSelectAll(false);
      setSelectedIds(new Set());
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // selection helpers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      setSelectAll(false);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(items.map((it) => it.id));
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  // open modal for create or edit
  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
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
    });
    setShowModal(true);
  };

  const onChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  // create / update save
  const saveKupon = async () => {
    setSaving(true);
    setError(null);

    // basic validation
    if (!form.code) {
      setError({ message: "Kode kupon wajib diisi" });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        kupon_type: form.kupon_type,
        code: form.code,
        jumlah: Number(form.jumlah) || 0,
        minimal_pembelian: Number(form.minimal_pembelian) || 0,
        potongan: Number(form.potongan) || 0,
        insentif: form.insentif,
        deskripsi: form.deskripsi,
        kategori: form.kategori,
      };

      let url = API_CREATE;
      let method = "POST";
      if (editing && editing.id) {
        // try update by id endpoint; if not supported, fallback to generic API_UPDATE
        url = API_UPDATE_ID(editing.id);
        method = "PUT";
      }

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
      try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }

      if (!res.ok) {
        // fallback: if we used API_UPDATE_ID and get 404/405, try fallback update endpoint without id
        if (method === "PUT" && res.status >= 400) {
          // try generic update endpoint
          const res2 = await fetch(API_UPDATE, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader(),
            },
            credentials: "omit",
            body: JSON.stringify({ id: editing?.id, ...payload }),
          });
          const txt2 = await res2.text();
          let d2;
          try { d2 = txt2 ? JSON.parse(txt2) : null; } catch(e){ d2 = null;}
          if (!res2.ok) throw { status: res2.status, body: d2 ?? txt2 };
          // success fallback -> continue
        } else {
          throw { status: res.status, body: data ?? text };
        }
      }

      // success
      await fetchList();
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      console.error("Save kupon error:", err);
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  // delete (single or multiple)
  const doDelete = async (idsArray) => {
    setError(null);
    try {
      const res = await fetch(API_DELETE, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        credentials: "omit",
        body: JSON.stringify({ ids: idsArray }),
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch(e){ data = null; }

      if (!res.ok) throw { status: res.status, body: data ?? text };

      // refresh
      await fetchList();
    } catch (err) {
      console.error("Delete kupon error:", err);
      setError(err);
    }
  };

  // filtered list with search
  const filtered = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (it.code || "").toLowerCase().includes(q) ||
           (it.insentif || "").toLowerCase().includes(q) ||
           (it.kupon_type || "").toLowerCase().includes(q);
  });

  // grouping for UI: if original API already groups, items may be flat; we will show single table filtered
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Kupon</h2>
        <div className="flex gap-2">
          <button onClick={() => fetchList()} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Refresh</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Create Kupon</button>
          <button
            onClick={() => {
              if (selectedIds.size === 0) return alert("Pilih minimal 1 kupon untuk dihapus.");
              if (!confirm(`Hapus ${selectedIds.size} kupon?`)) return;
              doDelete(Array.from(selectedIds));
            }}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Selected
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, insentif, type..."
          className="border rounded p-2 flex-1"
        />
        <div className="text-sm text-gray-600">Found: {filtered.length}</div>
      </div>

      {loading && <div className="text-gray-600 mb-4">Loading kupon...</div>}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="font-medium">Error</div>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="p-3"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
              <th className="p-3">#</th>
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Jumlah</th>
              <th className="p-3">Minimal</th>
              <th className="p-3">Potongan</th>
              <th className="p-3">Insentif</th>
              <th className="p-3">Deskripsi</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">No coupons found.</td>
              </tr>
            ) : (
              filtered.map((k, idx) => (
                <tr key={k.id ?? idx} className="border-b hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.has(k.id)} onChange={() => toggleSelect(k.id)} /></td>
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-mono">{k.code}</td>
                  <td className="p-3">{k.kupon_type}</td>
                  <td className="p-3">{k.jumlah}</td>
                  <td className="p-3">{k.minimal_pembelian}</td>
                  <td className="p-3">{k.potongan}</td>
                  <td className="p-3">{k.insentif}</td>
                  <td className="p-3 text-sm text-gray-600">{k.deskripsi}</td>
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

      {/* Modal: create / edit */}
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
                <label className="block text-sm font-medium">Type</label>
                <select value={form.kupon_type} onChange={(e) => onChange("kupon_type", e.target.value)} className="w-full border rounded p-2">
                  <option value="diskon">diskon</option>
                  <option value="potongan_kategori">potongan</option>
                  <option value="free">free</option>
                </select>
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
                  <label className="block text-sm font-medium">Potongan (%)</label>
                  <input type="number" value={form.potongan} onChange={(e) => onChange("potongan", e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Insentif</label>
                  <input value={form.insentif} onChange={(e) => onChange("insentif", e.target.value)} className="w-full border rounded p-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => onChange("deskripsi", e.target.value)} className="w-full border rounded p-2" rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={saveKupon} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : (editing ? "Update" : "Create")}</button>
              </div>

              {error && <div className="text-sm text-red-600">Error: {JSON.stringify(error)}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
