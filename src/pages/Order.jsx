// src/pages/Order.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Order.jsx
 * - Menampilkan struk dalam grid 3x3 (9 struk per halaman)
 * - Responsive: 1 / 2 / 3 columns
 * - Pagination sederhana (Prev / Next)
 * - Requires token in localStorage.token (Bearer)
 *
 * Perubahan: setiap struk kini menggunakan layout flex column sehingga
 * footer ("Terima kasih...") selalu berada di bagian bawah kartu.
 */

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination: 9 struk per page (3x3)
  const PER_PAGE = 9;
  const [page, setPage] = useState(1);

  // store info (customize)
  const storeInfo = {
    name: "KEDAI GENZ",
    addressLine1: "Jl. KH Noer Ali No.23",
    addressLine2: "Bekasi Selatan, Kota Bekasi",
    phone: "0812-3456-7890",
    footerNote: "Terima kasih telah berbelanja",
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError({
          message:
            "Token tidak ditemukan. Silakan login atau set token via console: localStorage.setItem('token','<TOKEN>')",
        });
        setOrders([]);
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "https://api-kedai-genz.vercel.app/auth2/get-all-order",
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );

      const history = res.data?.history ?? res.data?.data?.history ?? res.data?.data ?? [];
      setOrders(Array.isArray(history) ? history : []);
      setPage(1);
    } catch (err) {
      console.error("Fetch orders error:", err);
      if (err.response) {
        setError({
          status: err.response.status,
          message: err.response.data?.message ?? err.response.data ?? err.response.statusText,
        });
      } else {
        setError({ message: err.message || "Network error" });
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // pagination helpers
  const totalPages = Math.max(1, Math.ceil(orders.length / PER_PAGE));
  const startIndex = (page - 1) * PER_PAGE;
  const visibleOrders = orders.slice(startIndex, startIndex + PER_PAGE);

  const gotoPrev = () => setPage((p) => Math.max(1, p - 1));
  const gotoNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // small helpers
  const formatIDR = (v) => {
    const n = Number(v) || 0;
    return "Rp " + n.toLocaleString("id-ID");
  };
  const lineSubtotal = (it) => {
    const harga = Number(it.harga) || 0;
    const qty = Number(it.quantity) || 0;
    return harga * qty;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Riwayat Order — Struk</h1>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={fetchOrders}
            className="px-3 py-2 bg-white border rounded hover:bg-gray-50 text-sm"
            aria-label="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status */}
      {loading && <div className="text-gray-600 mb-4">Memuat order...</div>}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="font-medium">Error</div>
          <div className="text-sm">{error.message}</div>
          {error.status === 401 && (
            <div className="mt-2 text-xs text-gray-700">
              Token tidak valid atau kadaluwarsa — login ulang untuk mendapatkan token baru.
            </div>
          )}
        </div>
      )}

      {!loading && orders.length === 0 && !error && (
        <div className="text-gray-600">Belum ada order untuk ditampilkan.</div>
      )}

      {/* Grid 3x3 */}
      <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {visibleOrders.map((order, idx) => {
            const items = Array.isArray(order.data) ? order.data : [];
            const subtotal = Number(order.total_harga) || items.reduce((s, it) => s + lineSubtotal(it), 0);
            const afterCoupon = Number(order.total_setelah_kupon) || subtotal;
            const kupon = order.kupon ?? null;
            const potonganAmount = Math.max(0, subtotal - afterCoupon);

            return (
              // make each article full height and column-flex so footer stays bottom
              <article
                key={startIndex + idx}
                className="bg-white border rounded-md shadow-sm p-4 text-sm print:shadow-none print:border-0 flex flex-col h-full"
                aria-label={`Struk ${startIndex + idx + 1}`}
              >
                {/* content that grows (header/meta/items/summary) */}
                <div className="flex-1 flex flex-col">
                  {/* header */}
                  <div className="text-center mb-2">
                    <div className="font-semibold">{storeInfo.name}</div>
                    <div className="text-xs text-gray-600">{storeInfo.addressLine1}</div>
                    <div className="text-xs text-gray-600">{storeInfo.addressLine2}</div>
                    <div className="text-xs text-gray-600">Tel: {storeInfo.phone}</div>
                    <div className="my-2 text-[12px] text-gray-300">────────────────</div>
                  </div>

                  {/* meta */}
                  <div className="flex justify-between text-[12px] text-gray-600 mb-2">
                    <div>
                      <div className="text-xs">No. Order</div>
                      <div className="font-mono">{order.id ?? `#${startIndex + idx + 1}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs">Tanggal</div>
                      <div className="font-mono">{order.tanggal ?? "-"}</div>
                    </div>
                  </div>

                  {/* items */}
                  <div className="border-t border-b py-2 text-[13px] flex-1">
                    {items.length === 0 ? (
                      <div className="text-gray-500">Tidak ada item</div>
                    ) : (
                      items.map((it) => (
                        <div key={it.id} className="mb-3">
                          <div className="flex justify-between items-start">
                            <div className="w-2/3">
                              <div className="font-medium">{it.nama}</div>
                              <div className="text-xs text-gray-500">{it.keterangan ?? ""}</div>
                            </div>
                            <div className="w-1/3 text-right font-mono">
                              <div className="text-xs text-gray-600">{it.quantity} x {formatIDR(it.harga)}</div>
                              <div className="text-sm font-semibold">{formatIDR(lineSubtotal(it))}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* summary */}
                  <div className="mt-3 text-[13px]">
                    <div className="flex justify-between border-b pb-1 text-gray-600">
                      <div>HARGA JUAL</div>
                      <div className="font-mono">{formatIDR(subtotal)}</div>
                    </div>

                    {kupon ? (
                      <>
                        <div className="flex justify-between mt-2 text-green-700">
                          <div className="text-sm">Kupon ({kupon.code ?? kupon.code_id ?? "-"})</div>
                          <div className="font-mono">-{kupon.potongan ? `${kupon.potongan}%` : formatIDR(potonganAmount)}</div>
                        </div>
                        <div className="flex justify-between mt-2 font-semibold text-base">
                          <div>TOTAL</div>
                          <div>{formatIDR(afterCoupon)}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between mt-3 font-semibold text-base">
                        <div>TOTAL</div>
                        <div>{formatIDR(afterCoupon)}</div>
                      </div>
                    )}

                    {order.kupon?.keterangan && (
                      <div className="mt-2 text-[11px] text-gray-500">{order.kupon.keterangan}</div>
                    )}
                  </div>
                </div>

                {/* footer - tetap di bawah karena article adalah flex column */}
                <div className="mt-3 text-xs text-center text-gray-500 pt-3 border-t">
                  {storeInfo.footerNote}
                </div>
              </article>
            );
          })}
        </div>

        {/* pagination controls (below grid) */}
        <div className="mt-6 flex items-center justify-between print:hidden">
          <div className="text-sm text-gray-600">
            Menampilkan {Math.min(orders.length, startIndex + 1)}–{Math.min(orders.length, startIndex + PER_PAGE)} dari {orders.length} order
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={gotoPrev}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
            >
              Prev
            </button>
            <div className="text-sm px-2">Halaman {page} / {totalPages}</div>
            <button
              onClick={gotoNext}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${page === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* print styling: show only receipts (articles) */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          article, article * { visibility: visible; }
          article { page-break-inside: avoid; margin: 0; }
        }
      `}</style>
    </div>
  );
}

/* helper */
function formatIDR(v) {
  const n = Number(v) || 0;
  return "Rp " + n.toLocaleString("id-ID");
}
