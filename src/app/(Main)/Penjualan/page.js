'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Plus, Search, ShoppingBag, DollarSign, MoreVertical,
  ChevronRight, Loader2, Trash2, CheckCircle, Printer,
  AlertCircle, RefreshCw, TrendingUp, Clock, X,
  Filter, Calendar, FileText, Tag
} from 'lucide-react';
import AddSale    from '@/app/(Main)/Penjualan/AddSale';
import SaleDetail from '@/app/(Main)/Penjualan/SaleDetail';
import Pagination from '@/app/(Main)/Components/Pagination';

// ─── Status config — mencakup semua status (REGULAR + DIRECT + legacy) ─────
const STATUS_CFG = {
  // Legacy
  PENDING:            { label: 'Pending',         bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  dot: 'bg-amber-400',  pulse: true  },
  // 4-stage approval
  PENDING_SALES:      { label: 'Menunggu Sales',  bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-400', pulse: true  },
  PENDING_ADMIN:      { label: 'Menunggu Admin',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',  pulse: true  },
  PENDING_SUPERVISOR: { label: 'Menunggu SPV',    bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400', pulse: true  },
  PENDING_MANAGER:    { label: 'Menunggu Manager',bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',   pulse: true  },
  // Final
  COMPLETED:          { label: 'Selesai',         bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  pulse: false },
  CANCELLED:          { label: 'Dibatalkan',      bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400',    pulse: false },
};

// Filter tabs config
const STATUS_FILTERS = [
  { key: 'ALL',                label: 'Semua'    },
  { key: 'PENDING_SALES',      label: 'Sales'    },
  { key: 'PENDING_ADMIN',      label: 'Admin'    },
  { key: 'PENDING_SUPERVISOR', label: 'SPV'      },
  { key: 'PENDING_MANAGER',    label: 'Manager'  },
  { key: 'COMPLETED',          label: 'Selesai'  },
  { key: 'CANCELLED',          label: 'Batal'    },
  // Legacy
  { key: 'PENDING',            label: 'Legacy'   },
];

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
    <div className={`${color} p-3 rounded-xl text-white shadow-md shrink-0`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{label}</p>
      <p className="text-base md:text-lg font-black text-gray-900 italic tracking-tighter truncate">{value}</p>
      {sub && <p className="text-[9px] font-bold text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// =============================================================================
// Main Page
// =============================================================================
const SalesPage = () => {
  const [salesData,     setSalesData]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('ALL');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [showFilter,    setShowFilter]    = useState(false);

  const [isAddOpen,     setIsAddOpen]     = useState(false);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [selectedSale,  setSelectedSale]  = useState(null);
  const [activeMenu,    setActiveMenu]    = useState(null);
  const menuRef = useRef(null);

  const [page, setPage] = useState(1);
  const PER_PAGE        = 8;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo)   params.set('to',   dateTo);
      const res  = await fetch(`/api/penjualan?${params}`);
      const data = await res.json();
      if (res.ok) setSalesData(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // ── Outside-click untuk menu ───────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── In-place update setelah approval (TANPA full re-fetch) ────────────────
  //
  // Optimistic: dipanggil dua kali — sekali saat optimistic (isFinal=false),
  // sekali saat server confirm (isFinal=true). Jika error, rollback dipanggil
  // dari ApprovalModal secara otomatis.
  //
  const handleSaleUpdated = useCallback((updatedSale, isFinal) => {
    setSalesData(prev =>
      prev.map(item => {
        // Match by dbId atau invoiceId
        if (item.dbId === updatedSale.dbId || item.id === updatedSale.id) {
          return { ...item, ...updatedSale };
        }
        return item;
      })
    );
    // Update selectedSale juga agar detail modal reflect perubahan
    if (selectedSale) {
      setSelectedSale(prev => {
        if (!prev) return prev;
        if (prev.dbId === updatedSale.dbId || prev.id === updatedSale.id) {
          return { ...prev, ...updatedSale };
        }
        return prev;
      });
    }
    // Jika final approved → refresh setelah 2 detik untuk sinkron server
    if (isFinal) {
      setTimeout(fetchSales, 2000);
    }
  }, [selectedSale, fetchSales]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm(`Hapus permanen transaksi ${id}?`)) return;
    try {
      const res = await fetch(`/api/penjualan?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSalesData(prev => prev.filter(item => item.id !== id));
        setActiveMenu(null);
      } else {
        const e = await res.json();
        alert(e.message);
      }
    } catch (err) { alert("Kesalahan koneksi"); }
  };

  const handleOpenDetail = (sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  // ── Filter / stats ─────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    salesData.filter(item =>
      (item.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.customer || '').toLowerCase().includes(search.toLowerCase())
    ),
    [salesData, search]
  );

  const totalPages   = Math.ceil(filtered.length / PER_PAGE);
  const currentItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => {
    const completed = salesData.filter(i => i.status === 'COMPLETED');
    const pending   = salesData.filter(i => !['COMPLETED','CANCELLED'].includes(i.status));
    const revenue   = completed.reduce((s, i) => s + i.total, 0);
    const pipeline  = pending.reduce((s, i) => s + i.total, 0);
    return { revenue, pipeline, completedCount: completed.length, pendingCount: pending.length };
  }, [salesData]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-3 md:p-6 lg:p-8 font-sans pb-24 md:pb-8">

      <AddSale
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onRefresh={fetchSales}
      />
      <SaleDetail
        isOpen={isDetailOpen}
        sale={selectedSale}
        onClose={() => setIsDetailOpen(false)}
        onSaleUpdated={handleSaleUpdated}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Manajemen Penjualan
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-1.5">
            FIFO · 4-Stage Approval · Keboen Bapak ERP
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#8da070] text-white px-6 py-4 md:py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#8da070]/20 hover:bg-[#7a8c61]"
        >
          <Plus size={18} strokeWidth={3} /> Input Sales Order
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revenue (Selesai)"  value={`Rp ${stats.revenue.toLocaleString('id-ID')}`} icon={DollarSign}  color="bg-blue-500"   sub={`${stats.completedCount} transaksi`} />
        <StatCard label="Pipeline (Approval)"value={`Rp ${stats.pipeline.toLocaleString('id-ID')}`} icon={Clock}      color="bg-amber-500"  sub={`${stats.pendingCount} menunggu`} />
        <StatCard label="Selesai"            value={stats.completedCount.toString()}                 icon={CheckCircle} color="bg-[#8da070]" sub="transaksi terbayar" />
        <StatCard label="Total SO"           value={salesData.length.toString()}                     icon={ShoppingBag} color="bg-purple-500" sub="semua periode" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[24px] md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-gray-50 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Cari invoice atau pelanggan..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 placeholder:font-medium text-gray-700"
            />
          </div>

          {/* Status filter tabs (scrollable) */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 w-full md:w-auto shrink-0 md:flex-nowrap">
            {STATUS_FILTERS.filter(f => {
              // Sembunyikan "Legacy PENDING" jika tidak ada data dengan status itu
              if (f.key === 'PENDING') return salesData.some(s => s.status === 'PENDING');
              return true;
            }).map(s => (
              <button key={s.key}
                onClick={() => { setStatusFilter(s.key); setPage(1); }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                  statusFilter === s.key
                    ? 'bg-[#8da070] text-white border-[#8da070] shadow-md shadow-[#8da070]/20'
                    : 'bg-white text-gray-400 border-gray-100 hover:border-[#8da070]/30'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto shrink-0">
            <button onClick={() => setShowFilter(p => !p)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${
                showFilter || dateFrom || dateTo
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'
              }`}>
              <Filter size={13} /> Filter
              {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
            <button onClick={fetchSales} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 text-gray-500 rounded-xl border border-gray-100 text-[10px] font-black uppercase hover:bg-gray-100 transition-all disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Date filter row */}
        {showFilter && (
          <div className="px-4 md:px-5 py-3 border-b border-gray-50 bg-blue-50/30 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-2 duration-200">
            <Calendar size={14} className="text-blue-500 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input type="date"
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100"
                value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              />
              <span className="text-[10px] font-black text-gray-400">s/d</span>
              <input type="date"
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100"
                value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-100">
                <X size={12} /> Reset
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="animate-spin text-[#8da070]" size={32} />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Syncing Data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {['Invoice ID', 'Pelanggan', 'Tanggal', 'Total', 'Status', 'Tipe', 'Opsi'].map(h => (
                      <th key={h} className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentItems.length > 0 ? currentItems.map((item) => (
                    <tr key={item.id}
                      className="hover:bg-gray-50/40 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(item)}>

                      {/* Desktop */}
                      <td className="hidden md:table-cell px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={13} className="text-gray-300 shrink-0" />
                          <span className="font-black text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{item.id}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.customer}</p>
                        <p className="text-[10px] font-bold text-gray-400">{item.itemCount} item</p>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        <p className="text-[11px] font-bold text-gray-600">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {item.dueDate && (
                          <p className="text-[9px] font-bold text-amber-500 flex items-center gap-1">
                            <Clock size={9} /> Tempo: {new Date(item.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        <p className="text-sm font-black text-gray-900 italic">Rp {item.total.toLocaleString('id-ID')}</p>
                        {parseFloat(item.taxPct) > 0 && (
                          <p className="text-[9px] font-bold text-blue-400 flex items-center gap-1">
                            <Tag size={8} /> inkl. PPN {item.taxPct}%
                          </p>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        {/* StatusBadge akan reflect status terbaru (termasuk optimistic) */}
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="hidden md:table-cell px-5 py-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                          item.saleType === 'DIRECT'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {item.saleType || 'REGULAR'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenDetail(item)}
                            className="p-2 text-gray-300 hover:text-[#8da070] hover:bg-[#8da070]/10 rounded-xl transition-all">
                            <ChevronRight size={18} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === item.id ? null : item.id); }}
                              className={`p-2 rounded-xl border transition-all ${activeMenu === item.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 border-transparent hover:border-gray-100'}`}>
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu === item.id && (
                              <div ref={menuRef}
                                className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in slide-in-from-bottom-2 duration-150">
                                {item.status === 'COMPLETED' && (
                                  <button onClick={() => { setSelectedSale(item); setIsDetailOpen(true); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 uppercase transition-colors">
                                    <Printer size={15} className="text-blue-500" /> Cetak Nota
                                  </button>
                                )}
                                <div className="h-px bg-gray-50 my-1 mx-3" />
                                <button onClick={() => handleDelete(item.id)}
                                  className="w-full text-left px-4 py-3 text-[10px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase transition-colors">
                                  <Trash2 size={15} /> Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="md:hidden table-cell p-4 w-full">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{item.id}</span>
                            <p className="text-sm font-black text-gray-800 uppercase mt-1">{item.customer}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                              {new Date(item.createdAt).toLocaleDateString('id-ID')} · {item.itemCount} item
                            </p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
                          <p className="text-base font-black text-gray-900 italic">Rp {item.total.toLocaleString('id-ID')}</p>
                          <button onClick={() => handleOpenDetail(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase border border-gray-100">
                            Detail <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <ShoppingBag size={40} className="text-gray-200" />
                          <p className="text-gray-300 font-black uppercase tracking-widest italic text-[10px]">
                            {search || statusFilter !== 'ALL' ? 'Tidak ada data yang cocok' : 'Belum ada transaksi'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => { setPage(p); setActiveMenu(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </div>
    </div>
  );
};

export default memo(SalesPage);