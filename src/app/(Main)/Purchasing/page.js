'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, BookOpen, Filter, RefreshCcw, Truck, ChevronDown } from 'lucide-react';
import AddPurchasing from './PurchasingItem/AddPurchasing';
import PurchasingTable from './PurchasingItem/PurchasingTable';
import PurchasingStats from './PurchasingItem/PurchasingStats';
import PrintPO from '@/app/(Main)/Components/Purchasing/PrintPo';
import SearchInput from '@/app/(Main)/Components/SeachInput';
import DeliveryOrderTable, {
  AddDOModal,
  DODetailModal,
} from './DeliveryOrder/DeliveryOrder';

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'po',  label: 'Purchase Orders',   icon: BookOpen, color: 'blue'  },
  { key: 'do',  label: 'Delivery Orders',   icon: Truck,    color: 'amber' },
];

const Purchasing = () => {
  // ── PO state ────────────────────────────────────────────────────────────────
  const [requests,    setRequests]    = useState([]);
  const [poLoading,   setPoLoading]   = useState(true);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedPO,  setSelectedPO]  = useState(null);
  const [poSearch,    setPoSearch]    = useState('');

  // ── DO state ────────────────────────────────────────────────────────────────
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [doLoading,      setDoLoading]      = useState(true);
  const [isDoModalOpen,  setIsDoModalOpen]  = useState(false);
  const [selectedDO,     setSelectedDO]     = useState(null);
  const [doDetailOpen,   setDoDetailOpen]   = useState(false);
  const [doSearch,       setDoSearch]       = useState('');
  const [doStatusFilter, setDoStatusFilter] = useState('ALL');

  // ── Active tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('do'); // Default tampilkan DO dulu

  // ─── Fetchers ────────────────────────────────────────────────────────────────
  const fetchPOs = useCallback(async () => {
    setPoLoading(true);
    try {
      const res = await fetch('/api/purchasing');
      if (res.ok) setRequests(Array.isArray(await res.json()) ? await res.json() : []);
    } catch (e) { console.error('PO fetch:', e); }
    finally { setPoLoading(false); }
  }, []);

  // Ulang fetch dengan closure yang benar
  const fetchPOsClean = useCallback(async () => {
    setPoLoading(true);
    try {
      const res  = await fetch('/api/purchasing');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.error('PO fetch:', e); }
    finally { setPoLoading(false); }
  }, []);

  const fetchDOs = useCallback(async () => {
    setDoLoading(true);
    try {
      const res  = await fetch('/api/delivery-order');
      const data = await res.json();
      setDeliveryOrders(Array.isArray(data) ? data : []);
    } catch (e) { console.error('DO fetch:', e); }
    finally { setDoLoading(false); }
  }, []);

  useEffect(() => {
    fetchPOsClean();
    fetchDOs();
  }, [fetchPOsClean, fetchDOs]);

  // ─── PO Handlers ─────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/purchasing/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchPOsClean();
      else alert('Gagal memperbarui status.');
    } catch (e) { console.error(e); }
  };

  const handleBulkStatusUpdate = async (ids, newStatus) => {
    try {
      const res = await fetch('/api/purchasing/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: newStatus }),
      });
      if (res.ok) fetchPOsClean();
      else { const e = await res.json(); alert(`Bulk Error: ${e.message}`); }
    } catch (e) { console.error(e); }
  };

  const deletePurchasing = async (id) => {
    if (!confirm('Hapus pengajuan PO ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/purchasing/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPOsClean();
      else { const e = await res.json(); alert(`Error: ${e.message}`); }
    } catch (e) { console.error(e); }
  };

  const handlePrint = (po) => {
    setSelectedPO({ ...po, suratJalan: po.receipts?.[0]?.suratJalan, vehicleNo: po.receipts?.[0]?.vehicleNo });
    setTimeout(() => { window.print(); setSelectedPO(null); }, 200);
  };

  // ─── DO Handlers ─────────────────────────────────────────────────────────────
  const handleViewDO = (do_) => { setSelectedDO(do_); setDoDetailOpen(true); };

  const handleDeleteDO = async (id) => {
    if (!confirm('Hapus Delivery Order ini?')) return;
    try {
      const res = await fetch(`/api/delivery-order/${id}`, { method: 'DELETE' });
      if (res.ok) fetchDOs();
      else { const e = await res.json(); alert(e.message); }
    } catch (e) { console.error(e); }
  };

  const handleApproveDO = async () => {
    const res = await fetch(`/api/delivery-order/${selectedDO.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (res.ok) { fetchDOs(); setDoDetailOpen(false); }
    else { const e = await res.json(); alert(e.message); }
  };

  const handleRejectDO = async () => {
    const res = await fetch(`/api/delivery-order/${selectedDO.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.ok) { fetchDOs(); setDoDetailOpen(false); }
    else { const e = await res.json(); alert(e.message); }
  };

  const handleConvertToPO = async () => {
    const res = await fetch(`/api/delivery-order/${selectedDO.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert-to-po' }),
    });
    if (res.ok) {
      const result = await res.json();
      alert(result.message);
      fetchDOs();
      fetchPOsClean();
      setDoDetailOpen(false);
      // Alihkan ke tab PO agar user langsung lihat hasil konversi
      setActiveTab('po');
    } else {
      const e = await res.json();
      alert(e.message);
    }
  };

  // ─── Filtered data ────────────────────────────────────────────────────────────
  const filteredPOs = requests.filter(req => {
    const q = poSearch.toLowerCase();
    return (
      (req.noPO       || '').toLowerCase().includes(q) ||
      (req.supplier   || '').toLowerCase().includes(q) ||
      (req.item       || '').toLowerCase().includes(q) ||
      (req.requestedBy|| '').toLowerCase().includes(q)
    );
  });

  const filteredDOs = deliveryOrders.filter(do_ => {
    const matchSearch =
      !doSearch ||
      do_.doNo?.toLowerCase().includes(doSearch.toLowerCase()) ||
      do_.supplier?.toLowerCase().includes(doSearch.toLowerCase()) ||
      do_.items?.some(i => i.description?.toLowerCase().includes(doSearch.toLowerCase()));
    const matchStatus = doStatusFilter === 'ALL' || do_.status === doStatusFilter;
    return matchSearch && matchStatus;
  });

  // ─── DO summary counts ────────────────────────────────────────────────────────
  const doCounts = {
    total:    deliveryOrders.length,
    pending:  deliveryOrders.filter(d => d.status === 'PENDING').length,
    approved: deliveryOrders.filter(d => d.status === 'APPROVED').length,
    linked:   deliveryOrders.filter(d => d.status === 'LINKED').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {selectedPO && <PrintPO data={selectedPO} />}

      <DODetailModal
        isOpen={doDetailOpen}
        onClose={() => setDoDetailOpen(false)}
        doData={selectedDO}
        onApprove={handleApproveDO}
        onReject={handleRejectDO}
        onConvertToPO={handleConvertToPO}
      />

      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 text-gray-800 print:hidden">

        {/* ── Modals ─────────────────────────────────────────────────────────── */}
        <AddPurchasing isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} onAdd={fetchPOsClean} />
        <AddDOModal    isOpen={isDoModalOpen} onClose={() => setIsDoModalOpen(false)} onSuccess={fetchDOs} />

        {/* ── Page Header ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100 hidden sm:flex">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
                  Procurement Center
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-gray-400 text-[10px] md:text-[11px] font-bold uppercase tracking-widest italic">
                    DO → Approval → PO Workflow
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button onClick={() => { setIsDoModalOpen(true); setActiveTab('do'); }}
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-100 transition-all font-black text-[11px] uppercase tracking-widest italic active:scale-95 group">
                <Truck size={16} className="group-hover:translate-x-1 transition-transform" />
                Buat DO
              </button>
              <button onClick={() => { setIsPoModalOpen(true); setActiveTab('po'); }}
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 transition-all font-black text-[11px] uppercase tracking-widest italic active:scale-95 group">
                <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                Buat PO
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats (selalu tampil untuk PO) ─────────────────────────────────── */}
        <PurchasingStats requests={requests} />

        {/* ── DO Mini Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total DO',    value: doCounts.total,    color: 'text-amber-600',  bg: 'bg-amber-50'  },
            { label: 'Pending',     value: doCounts.pending,  color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Approved',    value: doCounts.approved, color: 'text-green-600',  bg: 'bg-green-50'  },
            { label: 'Linked to PO',value: doCounts.linked,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-[20px] px-5 py-4 border border-white flex items-center justify-between`}>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</p>
              <span className={`text-xl font-black ${s.color}`}>{doLoading ? '—' : s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 bg-gray-50/30">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-4 text-[11px] font-black uppercase tracking-widest italic transition-all border-b-2 ${
                  activeTab === tab.key
                    ? tab.color === 'blue'
                      ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                      : 'border-amber-500 text-amber-600 bg-amber-50/30'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  activeTab === tab.key
                    ? tab.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {tab.key === 'po' ? filteredPOs.length : filteredDOs.length}
                </span>
              </button>
            ))}

            {/* Spacer + Refresh */}
            <div className="flex-1 flex items-center justify-end pr-4 gap-3">
              <button
                onClick={() => activeTab === 'po' ? fetchPOsClean() : fetchDOs()}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <RefreshCcw size={15} className={(activeTab === 'po' ? poLoading : doLoading) ? 'animate-spin' : ''} />
              </button>
              <div className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hidden sm:block">
                {activeTab === 'po' ? filteredPOs.length : filteredDOs.length} Records
              </div>
            </div>
          </div>

          {/* Tab toolbar */}
          <div className="p-4 md:p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
            <div className="w-full sm:w-80">
              <SearchInput
                value={activeTab === 'po' ? poSearch : doSearch}
                onChange={activeTab === 'po' ? setPoSearch : setDoSearch}
                placeholder={activeTab === 'po' ? 'Cari PO, Supplier, Item...' : 'Cari DO, Supplier, Item...'}
              />
            </div>

            {/* DO status filter */}
            {activeTab === 'do' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'LINKED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setDoStatusFilter(s)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                      doStatusFilter === s
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100'
                        : 'bg-white text-gray-400 border-gray-100 hover:border-amber-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Tab content ──────────────────────────────────────────────────── */}
          <div className="relative overflow-x-auto">

            {/* PO Table */}
            {activeTab === 'po' && (
              <>
                <PurchasingTable
                  data={filteredPOs}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={deletePurchasing}
                  onPrint={handlePrint}
                  onBulkStatusUpdate={handleBulkStatusUpdate}
                />
                {!poLoading && filteredPOs.length === 0 && (
                  <div className="p-16 md:p-24 text-center flex flex-col items-center justify-center">
                    <div className="bg-gray-50 p-8 rounded-full border border-gray-100 mb-4">
                      <BookOpen size={40} className="text-gray-200" />
                    </div>
                    <h4 className="text-gray-800 font-black uppercase italic text-sm mb-2">No PO Found</h4>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] max-w-[220px] leading-relaxed">
                      {poSearch ? `"${poSearch}" tidak ditemukan` : 'Buat PO baru atau konversi dari DO yang sudah approved.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* DO Table */}
            {activeTab === 'do' && (
              <>
                <DeliveryOrderTable
                  data={filteredDOs}
                  onView={handleViewDO}
                  onDelete={handleDeleteDO}
                  loading={doLoading}
                />
                {!doLoading && filteredDOs.length === 0 && (
                  <div className="p-16 md:p-24 text-center flex flex-col items-center justify-center">
                    <div className="bg-amber-50 p-8 rounded-full border border-amber-100 mb-4">
                      <Truck size={40} className="text-amber-200" />
                    </div>
                    <h4 className="text-gray-800 font-black uppercase italic text-sm mb-2">No DO Found</h4>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] max-w-[220px] leading-relaxed">
                      {doSearch || doStatusFilter !== 'ALL'
                        ? 'Filter tidak menghasilkan data.'
                        : 'Buat Delivery Order pertama Anda untuk memulai proses pengadaan.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;
