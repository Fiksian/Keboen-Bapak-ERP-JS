'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, RefreshCcw, Truck, FileText } from 'lucide-react';
import AddPurchasing from './PurchasingItem/AddPurchasing';
import PurchasingTable from './PurchasingItem/PurchasingTable';
import PurchasingStats from './PurchasingItem/PurchasingStats';
import PrintPO from '@/app/(Main)/Components/Purchasing/PrintPo';
import SearchInput from '@/app/(Main)/Components/SeachInput';
import DeliveryOrderTable, {
  AddDOModal,
  DODetailModal,
  CreatePOModal,
} from './DeliveryOrder/DeliveryOrder';

const TABS = [
  { key: 'do', label: 'Delivery Orders', icon: FileText, color: 'blue'  },
  { key: 'po', label: 'Purchase Orders', icon: BookOpen, color: 'green' },
];

const Purchasing = () => {
  // ── PO state ─────────────────────────────────────────────────────────────────
  const [requests,      setRequests]      = useState([]);
  const [poLoading,     setPoLoading]     = useState(true);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedPO,    setSelectedPO]    = useState(null);
  const [poSearch,      setPoSearch]      = useState('');

  // ── DO state ─────────────────────────────────────────────────────────────────
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [doLoading,      setDoLoading]      = useState(true);
  const [isDoModalOpen,  setIsDoModalOpen]  = useState(false);
  const [selectedDO,     setSelectedDO]     = useState(null);
  const [doDetailOpen,   setDoDetailOpen]   = useState(false);
  const [doSearch,       setDoSearch]       = useState('');
  const [doStatusFilter, setDoStatusFilter] = useState('ALL');

  // ── Create PO from DO modal ──────────────────────────────────────────────────
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [createPOData, setCreatePOData] = useState(null); // full DO data dengan items

  const [activeTab, setActiveTab] = useState('do');

  // ─── Fetchers ────────────────────────────────────────────────────────────────
  const fetchPOs = useCallback(async () => {
    setPoLoading(true);
    try {
      const res  = await fetch('/api/purchasing');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setPoLoading(false); }
  }, []);

  const fetchDOs = useCallback(async () => {
    setDoLoading(true);
    try {
      const res  = await fetch('/api/delivery-order');
      const data = await res.json();
      setDeliveryOrders(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setDoLoading(false); }
  }, []);

  useEffect(() => { fetchPOs(); fetchDOs(); }, [fetchPOs, fetchDOs]);

  // ─── PO handlers ─────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
    const res = await fetch(`/api/purchasing/${id}/approve`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchPOs(); else alert('Gagal memperbarui status.');
  };

  const handleBulkStatusUpdate = async (ids, newStatus) => {
    const res = await fetch('/api/purchasing/bulk-status', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status: newStatus }),
    });
    if (res.ok) fetchPOs();
    else { const e = await res.json(); alert(`Bulk Error: ${e.message}`); }
  };

  const deletePurchasing = async (id) => {
    if (!confirm('Hapus PO ini?')) return;
    const res = await fetch(`/api/purchasing/${id}`, { method: 'DELETE' });
    if (res.ok) { fetchPOs(); fetchDOs(); } // DO status mungkin berubah
    else { const e = await res.json(); alert(`Error: ${e.message}`); }
  };

  const handlePrint = (po) => {
    setSelectedPO({ ...po, suratJalan: po.receipts?.[0]?.suratJalan, vehicleNo: po.receipts?.[0]?.vehicleNo });
    setTimeout(() => { window.print(); setSelectedPO(null); }, 200);
  };

  // ─── DO handlers ─────────────────────────────────────────────────────────────
  const handleViewDO = async (do_) => {
    // Fetch DO detail lengkap (dengan purchasingOrders per item)
    try {
      const res  = await fetch(`/api/delivery-order/${do_.id}`);
      const data = await res.json();
      setSelectedDO(data);
    } catch { setSelectedDO(do_); }
    setDoDetailOpen(true);
  };

  const handleDeleteDO = async (id) => {
    if (!confirm('Hapus Delivery Order ini?')) return;
    const res = await fetch(`/api/delivery-order/${id}`, { method: 'DELETE' });
    if (res.ok) fetchDOs();
    else { const e = await res.json(); alert(e.message); }
  };

  const handleApproveDO = async () => {
    const res = await fetch(`/api/delivery-order/${selectedDO.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (res.ok) { await fetchDOs(); setDoDetailOpen(false); }
    else { const e = await res.json(); alert(e.message); }
  };

  const handleRejectDO = async () => {
    const res = await fetch(`/api/delivery-order/${selectedDO.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.ok) { await fetchDOs(); setDoDetailOpen(false); }
    else { const e = await res.json(); alert(e.message); }
  };

  // Buka Create PO modal — fetch detail DO terlebih dahulu
  const handleOpenCreatePO = async () => {
    try {
      const res  = await fetch(`/api/delivery-order/${selectedDO.id}`);
      const data = await res.json();
      setCreatePOData(data);
      setDoDetailOpen(false);
      setCreatePOOpen(true);
    } catch { alert('Gagal memuat detail DO'); }
  };

  // Setelah PO berhasil dibuat dari DO
  const handleCreatePOSuccess = async () => {
    await Promise.all([fetchPOs(), fetchDOs()]);
    setCreatePOOpen(false);
    setCreatePOData(null);
    setActiveTab('po'); // Tunjukkan tab PO supaya user bisa langsung lihat PO baru
  };

  // ─── Filter data ─────────────────────────────────────────────────────────────
  const filteredPOs = requests.filter(req => {
    const q = poSearch.toLowerCase();
    return (req.noPO || '').toLowerCase().includes(q) ||
      (req.supplier || '').toLowerCase().includes(q) ||
      (req.item || '').toLowerCase().includes(q) ||
      (req.requestedBy || '').toLowerCase().includes(q);
  });

  const filteredDOs = deliveryOrders.filter(do_ => {
    const matchSearch =
      !doSearch ||
      do_.doNo?.toLowerCase().includes(doSearch.toLowerCase()) ||
      do_.title?.toLowerCase().includes(doSearch.toLowerCase()) ||
      do_.items?.some(i => (i.itemName || '').toLowerCase().includes(doSearch.toLowerCase()));
    const matchStatus = doStatusFilter === 'ALL' || do_.status === doStatusFilter;
    return matchSearch && matchStatus;
  });

  // DO mini counts
  const doCounts = {
    total:     deliveryOrders.length,
    pending:   deliveryOrders.filter(d => d.status === 'PENDING').length,
    approved:  deliveryOrders.filter(d => ['APPROVED', 'PARTIAL'].includes(d.status)).length,
    fulfilled: deliveryOrders.filter(d => d.status === 'FULFILLED').length,
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {selectedPO && <PrintPO data={selectedPO} />}

      {/* Modals */}
      <AddPurchasing isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} onAdd={fetchPOs} />
      <AddDOModal    isOpen={isDoModalOpen} onClose={() => setIsDoModalOpen(false)} onSuccess={fetchDOs} />
      <DODetailModal
        isOpen={doDetailOpen}
        onClose={() => setDoDetailOpen(false)}
        doData={selectedDO}
        onApprove={handleApproveDO}
        onReject={handleRejectDO}
        onCreatePO={handleOpenCreatePO}
        onRefresh={() => { fetchDOs(); fetchPOs(); }}
      />
      <CreatePOModal
        isOpen={createPOOpen}
        onClose={() => { setCreatePOOpen(false); setCreatePOData(null); }}
        doData={createPOData}
        onSuccess={handleCreatePOSuccess}
      />

      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 text-gray-800 print:hidden">

        {/* Page header */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100 hidden sm:flex">
                <FileText size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
                  Procurement Center
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">
                    DO (Rencana) → Approval → PO per Supplier
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Buat DO — langkah pertama */}
              <button
                onClick={() => { setIsDoModalOpen(true); setActiveTab('do'); }}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-100 transition-all font-black text-[11px] uppercase tracking-widest italic active:scale-95"
              >
                <FileText size={16} /> Buat DO
              </button>
              {/* Buat PO langsung (tanpa DO) */}
              <button
                onClick={() => { setIsPoModalOpen(true); setActiveTab('po'); }}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-100 transition-all font-black text-[11px] uppercase tracking-widest italic active:scale-95"
              >
                <Plus size={16} strokeWidth={3} /> PO Langsung
              </button>
            </div>
          </div>
        </div>

        {/* PO Stats */}
        <PurchasingStats requests={requests} />

        {/* DO mini stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total DO',     value: doCounts.total,     bg: 'bg-blue-50',   text: 'text-blue-600'   },
            { label: 'Pending',      value: doCounts.pending,   bg: 'bg-orange-50', text: 'text-orange-600' },
            { label: 'Approved',     value: doCounts.approved,  bg: 'bg-green-50',  text: 'text-green-600'  },
            { label: 'Fulfilled',    value: doCounts.fulfilled, bg: 'bg-purple-50', text: 'text-purple-600' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-[20px] px-5 py-4 border border-white flex items-center justify-between`}>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</p>
              <span className={`text-xl font-black ${s.text}`}>{doLoading ? '—' : s.value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex border-b border-gray-100 bg-gray-50/30">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-4 text-[11px] font-black uppercase tracking-widest italic transition-all border-b-2 ${
                  activeTab === tab.key
                    ? tab.color === 'blue'
                      ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                      : 'border-green-600 text-green-600 bg-green-50/30'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <tab.icon size={15} />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  activeTab === tab.key
                    ? tab.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {tab.key === 'po' ? filteredPOs.length : filteredDOs.length}
                </span>
              </button>
            ))}
            <div className="flex-1 flex items-center justify-end pr-4">
              <button onClick={() => activeTab === 'po' ? fetchPOs() : fetchDOs()}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <RefreshCcw size={14} className={(activeTab === 'po' ? poLoading : doLoading) ? 'animate-spin' : ''} />
              </button>
              <div className="ml-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hidden sm:block">
                {activeTab === 'po' ? filteredPOs.length : filteredDOs.length} Records
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 md:p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
            <div className="w-full sm:w-80">
              <SearchInput
                value={activeTab === 'po' ? poSearch : doSearch}
                onChange={activeTab === 'po' ? setPoSearch : setDoSearch}
                placeholder={activeTab === 'po' ? 'Cari PO, Supplier, Item...' : 'Cari DO, Judul, Item...'}
              />
            </div>
            {activeTab === 'do' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                {['ALL', 'PENDING', 'APPROVED', 'PARTIAL', 'FULFILLED', 'REJECTED'].map(s => (
                  <button key={s} onClick={() => setDoStatusFilter(s)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                      doStatusFilter === s
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                        : 'bg-white text-gray-400 border-gray-100 hover:border-blue-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative overflow-x-auto">
            {activeTab === 'po' ? (
              <>
                <PurchasingTable
                  data={filteredPOs}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={deletePurchasing}
                  onPrint={handlePrint}
                  onBulkStatusUpdate={handleBulkStatusUpdate}
                />
                {!poLoading && filteredPOs.length === 0 && (
                  <div className="p-16 text-center flex flex-col items-center gap-4">
                    <div className="bg-gray-50 p-8 rounded-full border border-gray-100">
                      <BookOpen size={40} className="text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-black uppercase italic text-sm">
                      {poSearch ? `"${poSearch}" tidak ditemukan` : 'PO dibuat melalui DO yang sudah Approved, atau via "PO Langsung".'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <DeliveryOrderTable
                  data={filteredDOs}
                  onView={handleViewDO}
                  onDelete={handleDeleteDO}
                  loading={doLoading}
                />
                {!doLoading && filteredDOs.length === 0 && (
                  <div className="p-16 text-center flex flex-col items-center gap-4">
                    <div className="bg-blue-50 p-8 rounded-full border border-blue-100">
                      <FileText size={40} className="text-blue-200" />
                    </div>
                    <p className="text-gray-400 font-black uppercase italic text-sm">
                      {doSearch || doStatusFilter !== 'ALL' ? 'Filter tidak cocok.' : 'Buat DO terlebih dahulu sebagai rencana kebutuhan barang.'}
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
