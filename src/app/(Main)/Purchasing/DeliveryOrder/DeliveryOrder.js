'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, Truck, Plus, Trash2, Loader2, CheckCircle2,
  ShieldCheck, Clock, PackageCheck, AlertCircle,
  FileText, Building2, Hash, Calendar, ChevronDown,
  Eye, Search, Users
} from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';

// ─── Status badge helper ────────────────────────────────────────────────────
const DOStatusBadge = ({ status }) => {
  const map = {
    DRAFT:    { cls: 'bg-gray-50 text-gray-500 border-gray-100',       label: 'Draft' },
    PENDING:  { cls: 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse', label: 'Pending Approval' },
    APPROVED: { cls: 'bg-green-50 text-green-700 border-green-200',     label: 'Approved' },
    REJECTED: { cls: 'bg-red-50 text-red-600 border-red-100',          label: 'Rejected' },
    LINKED:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',       label: 'Linked to PO' },
  };
  const s = map[status] || map.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ─── Add / Edit DO Modal ─────────────────────────────────────────────────────
export const AddDOModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([
    { id: Date.now(), description: '', qty: 1, unit: 'Kg', estimasiHarga: 0, notes: '' },
  ]);

  const [expectedDate, setExpectedDate] = useState('');
  const [doNotes, setDoNotes] = useState('');

  // Fill edit data
  useEffect(() => {
    if (editData) {
      setExpectedDate(editData.expectedDate?.split('T')[0] || '');
      setDoNotes(editData.notes || '');
      setItems(
        editData.items?.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })) ||
        [{ id: Date.now(), description: '', qty: 1, unit: 'Kg', estimasiHarga: 0, notes: '' }]
      );
    }
  }, [editData]);

  const totalEstimasi = useMemo(() =>
    items.reduce((sum, i) => sum + (parseFloat(i.qty) || 0) * (parseFloat(i.estimasiHarga) || 0), 0),
    [items]
  );

  const addItem = () => setItems(prev => [
    ...prev,
    { id: Date.now(), description: '', qty: 1, unit: 'Kg', estimasiHarga: 0, notes: '' },
  ]);

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id, field, value) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleReset = () => {
    setExpectedDate(''); setDoNotes('');
    setItems([{ id: Date.now(), description: '', qty: 1, unit: 'Kg', estimasiHarga: 0, notes: '' }]);
  };

  const handleClose = () => { handleReset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        expectedDate: expectedDate || null,
        notes: doNotes,
        requestedBy: session?.user?.name || 'User',
        items: items.map(i => ({
          description:    i.description,
          qty:            parseFloat(i.qty) || 0,
          unit:           i.unit,
          estimasiHarga:  parseFloat(i.estimasiHarga) || 0,
          notes:          i.notes || '',
        })),
      };
      const url    = editData ? `/api/delivery-order/${editData.id}` : '/api/delivery-order';
      const method = editData ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menyimpan DO');
      }
      handleReset();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="absolute inset-0 hidden md:block" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-100">
              <Truck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
                {editData ? 'Edit Delivery Order' : 'Buat Delivery Order'}
              </h2>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">
                DO → Approval → PO
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

          {/* Expected Date + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Calendar size={11} /> Estimasi Tanggal Kirim
              </label>
              <input type="date" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-200"
                value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catatan DO</label>
              <textarea rows={2} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                placeholder="Instruksi pengiriman, syarat, dll..."
                value={doNotes} onChange={e => setDoNotes(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                Daftar Item ({items.length})
              </label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-amber-600 transition-all active:scale-95">
                <Plus size={13} strokeWidth={3} /> Add Item
              </button>
            </div>

            {items.map(row => (
              <div key={row.id} className="group relative p-5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:border-amber-200 transition-all">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(row.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10">
                    <Trash2 size={13} />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Deskripsi item */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Deskripsi Item</label>
                    <input required className="w-full bg-gray-50 border border-transparent rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none focus:bg-white focus:border-amber-200 transition-all"
                      placeholder="Nama / kode item..."
                      value={row.description} onChange={e => updateItem(row.id, 'description', e.target.value)} />
                  </div>

                  {/* Qty + Unit */}
                  <div className="md:col-span-3 grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Qty</label>
                      <input type="number" step="any" required min="0.01"
                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-100"
                        value={row.qty} onChange={e => updateItem(row.id, 'qty', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Unit</label>
                      <input className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-100 uppercase"
                        value={row.unit} onChange={e => updateItem(row.id, 'unit', e.target.value)} />
                    </div>
                  </div>

                  {/* Estimasi harga */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[9px] font-black text-amber-600 uppercase">Est. Harga Satuan</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                      <input type="number" className="w-full bg-amber-50/40 border-none rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-100"
                        value={row.estimasiHarga} onChange={e => updateItem(row.id, 'estimasiHarga', e.target.value)} />
                    </div>
                  </div>

                  {/* Notes item */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Catatan</label>
                    <input className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-100"
                      placeholder="Opsional..." value={row.notes} onChange={e => updateItem(row.id, 'notes', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="bg-gray-900 px-6 py-4 rounded-2xl shadow-lg text-left w-full sm:w-auto">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Total Estimasi</p>
              <p className="text-xl font-black text-white italic tracking-tighter">
                Rp {totalEstimasi.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={handleClose}
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={loading || items.some(i => !i.description || i.qty <= 0)}
                className="flex-[2] sm:flex-none bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-8 py-4 text-[11px] font-black shadow-xl shadow-amber-100 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><FileText size={16} /> Simpan DO</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DO Detail Modal ─────────────────────────────────────────────────────────
export const DODetailModal = ({ isOpen, onClose, doData, onApprove, onReject, onConvertToPO }) => {
  const { data: session } = useSession();
  const isAdmin = ['Admin', 'Supervisor'].includes(session?.user?.role);
  const [actionLoading, setActionLoading] = useState(null);

  if (!isOpen || !doData) return null;

  const totalEst = doData.items?.reduce((s, i) =>
    s + (parseFloat(i.qty) || 0) * (parseFloat(i.estimasiHarga) || 0), 0) || 0;

  const handleAction = async (action) => {
    setActionLoading(action);
    try { await action(); } finally { setActionLoading(null); }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={`p-6 flex justify-between items-start shrink-0 ${doData.status === 'APPROVED' || doData.status === 'LINKED' ? 'bg-green-50' : doData.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${doData.status === 'APPROVED' || doData.status === 'LINKED' ? 'bg-green-100 text-green-600' : doData.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-tighter">{doData.doNo}</h3>
              <DOStatusBadge status={doData.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar,  label: 'Est. Kirim', value: doData.expectedDate ? new Date(doData.expectedDate).toLocaleDateString('id-ID') : '-' },
              { icon: Hash,      label: 'Dibuat oleh', value: doData.requestedBy },
              { icon: Calendar,  label: 'Tanggal DO', value: new Date(doData.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <item.icon size={14} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-[11px] font-bold text-gray-700 uppercase">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {doData.notes && (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
              <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Catatan</p>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">{doData.notes}</p>
            </div>
          )}

          {/* Item list */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              Item DO ({doData.items?.length || 0})
            </p>
            {doData.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-[11px] font-black text-gray-800 uppercase">{item.description}</p>
                  {item.notes && <p className="text-[9px] text-gray-400 italic mt-0.5">{item.notes}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[11px] font-black text-gray-700">{parseFloat(item.qty).toLocaleString('id-ID')} {item.unit}</p>
                  <p className="text-[9px] text-amber-600 font-bold">
                    Rp {((parseFloat(item.qty)||0)*(parseFloat(item.estimasiHarga)||0)).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-gray-900 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase">Total Estimasi</p>
            <p className="text-lg font-black text-white italic">Rp {totalEst.toLocaleString('id-ID')}</p>
          </div>

          {/* Linked PO info */}
          {doData.linkedPOId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
              <PackageCheck size={16} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-blue-600 uppercase">Sudah dikonversi ke PO</p>
                <p className="text-[11px] font-bold text-gray-700 uppercase">{doData.linkedPONo || doData.linkedPOId}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        {(isAdmin && doData.status === 'PENDING') || (doData.status === 'APPROVED' && !doData.linkedPOId) ? (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
            {isAdmin && doData.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleAction(onApprove)}
                  disabled={!!actionLoading}
                  className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-100"
                >
                  {actionLoading === onApprove ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>} Approve
                </button>
                <button
                  onClick={() => handleAction(onReject)}
                  disabled={!!actionLoading}
                  className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === onReject ? <Loader2 className="animate-spin" size={16}/> : <X size={16}/>} Reject
                </button>
              </>
            )}
            {doData.status === 'APPROVED' && !doData.linkedPOId && (
              <button
                onClick={() => handleAction(onConvertToPO)}
                disabled={!!actionLoading}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-100"
              >
                {actionLoading === onConvertToPO ? <Loader2 className="animate-spin" size={16}/> : <PackageCheck size={16}/>}
                Konversi ke PO
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ─── DO Table ────────────────────────────────────────────────────────────────
const DeliveryOrderTable = ({
  data = [],
  onView,
  onDelete,
  loading,
}) => {
  const { data: session } = useSession();
  const isAdmin = ['Admin', 'Supervisor'].includes(session?.user?.role);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-amber-500" size={32} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Memuat Delivery Orders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] bg-gray-50/50">
              {['No DO', 'Item', 'Est. Nilai', 'Status', 'Tgl Dibuat', 'Aksi'].map(h => (
                <th key={h} className="px-6 py-5 border-b border-gray-100 font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? currentData.map(do_ => {
              const totalEst = do_.items?.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.estimasiHarga)||0), 0) || 0;
              return (
                <tr key={do_.id} className="hover:bg-amber-50/20 transition-colors group">
                  <td className="px-6 py-5 border-b border-gray-50">
                    <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      {do_.doNo}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <p className="text-[11px] font-black text-gray-800 uppercase leading-tight">
                      {do_.items?.[0]?.description || '-'}
                    </p>
                    {do_.items?.length > 1 && (
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5">+{do_.items.length - 1} item lainnya</p>
                    )}
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <span className="text-[12px] font-black text-gray-800 italic">
                      Rp {totalEst.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <DOStatusBadge status={do_.status} />
                    {do_.linkedPONo && (
                      <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase">→ {do_.linkedPONo}</p>
                    )}
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <span className="text-[10px] font-bold text-gray-500">
                      {new Date(do_.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => onView(do_)}
                        className="p-2.5 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all border border-amber-100 bg-white shadow-sm active:scale-90">
                        <Eye size={16} />
                      </button>
                      {isAdmin && do_.status === 'DRAFT' && (
                        <button onClick={() => onDelete(do_.id)}
                          className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="py-24 text-center text-gray-300 font-black uppercase tracking-widest italic text-[10px]">
                  Belum ada Delivery Order
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {currentData.length > 0 ? currentData.map(do_ => {
          const totalEst = do_.items?.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.estimasiHarga)||0), 0) || 0;
          return (
            <div key={do_.id} className="p-5 space-y-3 active:bg-amber-50/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{do_.doNo}</span>
                  <p className="text-[10px] text-gray-500 font-bold">{do_.items?.[0]?.description}</p>
                </div>
                <div className="text-right">
                  <DOStatusBadge status={do_.status} />
                  <p className="text-sm font-black text-gray-800 italic mt-1">Rp {totalEst.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <button onClick={() => onView(do_)}
                className="w-full py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2">
                <Eye size={14} /> Lihat Detail
              </button>
            </div>
          );
        }) : (
          <div className="py-20 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest italic">
            Belum ada data DO
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default DeliveryOrderTable;
