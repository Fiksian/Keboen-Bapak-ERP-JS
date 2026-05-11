'use client';

import React, { useState, memo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Hash, Building2, CalendarDays, User, ShieldCheck,
  Trash2, PackageCheck, Scale, Check, Globe,
  CheckSquare, Square, ArrowDownRight, TrendingUp,
  AlertTriangle, DollarSign, Info, UserCheck, ChevronRight
} from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT:     { label: 'Draft',     cls: 'bg-gray-50 text-gray-500 border-gray-200',       pulse: false },
  PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200',    pulse: true  },
  APPROVED:  { label: 'Approved',  cls: 'bg-green-50 text-green-700 border-green-200',    pulse: false },
  RECEIVED:  { label: 'Received',  cls: 'bg-blue-50 text-blue-700 border-blue-200',       pulse: false },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-200',          pulse: false },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${s.cls} ${s.pulse ? 'animate-pulse' : ''}`}>
      {s.label}
    </span>
  );
};

const fmtRp  = (v) => new Intl.NumberFormat('id-ID').format(Math.round(parseFloat(v)||0));
const fmtQty = (v) => (parseFloat(v)||0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

// ─── Susut badge ──────────────────────────────────────────────────────────────
const SusutBadge = ({ pct }) => {
  if (!pct) return null;
  const isAlert = pct > 8.5;
  return (
    <span className={`inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded border ${isAlert ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
      {isAlert && <AlertTriangle size={9} />}
      Susut {pct.toFixed(1)}%
    </span>
  );
};

// ─── Fulfillment bar (ekor) ───────────────────────────────────────────────────
const HeadFulfillBar = ({ headOrdered, headArrived }) => {
  const pct = Math.min(100, headOrdered > 0 ? Math.round((headArrived / headOrdered) * 100) : 0);
  if (!headOrdered) return null;
  return (
    <div className="space-y-0.5">
      <span className={`text-[8px] font-black uppercase ${pct >= 100 ? 'text-green-600' : pct > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
        {pct >= 100 ? '✓ Tiba' : pct > 0 ? `${pct}% Tiba` : 'Belum Tiba'}
      </span>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
const CattlePurchasingTable = ({
  data = [],
  onStatusUpdate,
  onDelete,
  onBulkStatusUpdate,
  onViewDetail,
}) => {
  const { data: session } = useSession();
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [currentPage,  setCurrentPage]  = useState(1);
  const PER_PAGE = 6;

  const isAuthorized = ['SuperAdmin', 'Supervisor', 'Manager'].includes(session?.user?.role);

  const totalPages = Math.ceil(data.length / PER_PAGE);
  const currentData = data.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const toggleSelect = (id) => {
    if (!isAuthorized) return;
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const toggleSelectAll = () => {
    if (!isAuthorized) return;
    const selectable = currentData.filter(r => !r.isReceived && r.status !== 'APPROVED');
    if (selectedIds.length === selectable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map(r => r.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="w-full bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">

        {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
        {selectedIds.length > 0 && isAuthorized && (
          <div className="bg-slate-900 px-8 py-4 flex justify-between items-center animate-in slide-in-from-top duration-300 sticky top-0 z-20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-[#8da070] p-1.5 rounded-lg text-white">
                <Check size={14} strokeWidth={4} />
              </div>
              <div>
                <p className="text-white text-[11px] font-black uppercase italic tracking-widest">
                  {selectedIds.length} PO Dipilih
                </p>
                <p className="text-slate-500 text-[8px] font-bold uppercase tracking-tighter">Bulk Approval Mode</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onBulkStatusUpdate?.(selectedIds, 'APPROVED'); setSelectedIds([]); }}
                className="bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic transition-all active:scale-95 shadow-lg flex items-center gap-2">
                <ShieldCheck size={14} /> Bulk Approve
              </button>
              <button onClick={() => setSelectedIds([])}
                className="bg-slate-800 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border border-slate-700">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Desktop Table ────────────────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] bg-gray-50/50">
                <th className="px-6 py-6 w-14 text-center border-b border-gray-100">
                  {isAuthorized && (
                    <button onClick={toggleSelectAll} className="text-gray-300 hover:text-[#8da070] transition-colors">
                      {selectedIds.length > 0 && selectedIds.length === currentData.filter(r => !r.isReceived && r.status !== 'APPROVED').length
                        ? <CheckSquare size={18} className="text-[#8da070]" />
                        : <Square size={18} />}
                    </button>
                  )}
                </th>
                <th className="px-4 py-6 border-b border-gray-100">PO & Eksportir</th>
                <th className="px-5 py-6 border-b border-gray-100">Detail Sapi</th>
                <th className="px-5 py-6 border-b border-gray-100 text-center">Ekor & Bobot</th>
                <th className="px-5 py-6 border-b border-gray-100 text-center">Harga & HPP</th>
                <th className="px-5 py-6 border-b border-gray-100 text-center">Status</th>
                <th className="px-7 py-6 border-b border-gray-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentData.length > 0 ? currentData.map((po, index) => {
                const isSelected    = selectedIds.includes(po.id);
                const headArrived   = po.arrivals?.reduce((s, a) => s + (a.totalHeadArrived||0), 0) || 0;
                const isFirstGroup  = index === 0 || po.vendorName !== currentData[index - 1]?.vendorName;
                const dateCreated   = new Date(po.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

                // Ringkasan items
                const breeds = [...new Set((po.items||[]).map(i => i.jenisSapi))].join(', ');
                const genders = [...new Set((po.items||[]).map(i => i.gender).filter(Boolean))];

                return (
                  <tr key={po.id}
                    className={`transition-all group ${isSelected ? 'bg-[#8da070]/5 shadow-inner' : 'hover:bg-gray-50/50'} ${isFirstGroup && index !== 0 ? 'border-t-2 border-gray-100' : ''}`}>

                    {/* Checkbox */}
                    <td className={`px-6 py-5 text-center border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      {isAuthorized && !po.isReceived && po.status !== 'APPROVED' ? (
                        <button onClick={() => toggleSelect(po.id)}
                          className={`transition-colors ${isSelected ? 'text-[#8da070]' : 'text-gray-200 group-hover:text-gray-400'}`}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                      ) : po.isReceived ? (
                        <div className="text-[#8da070]/40 flex justify-center">
                          <PackageCheck size={18} />
                        </div>
                      ) : null}
                    </td>

                    {/* PO & Eksportir */}
                    <td className={`px-4 py-5 border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      <div className="flex flex-col gap-1.5">
                        {isFirstGroup && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-[#8da070] text-[10px] italic tracking-tighter bg-[#8da070]/10 px-2 py-0.5 rounded border border-[#8da070]/20 uppercase flex items-center gap-1">
                              <Hash size={9} strokeWidth={3} /> {po.noPO}
                            </span>
                            <StatusBadge status={po.status} />
                          </div>
                        )}
                        {!isFirstGroup && (
                          <div className="flex items-center gap-2 text-gray-300 ml-2">
                            <ArrowDownRight size={13} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Same Vendor</span>
                          </div>
                        )}
                        <span className="flex items-center gap-1.5 font-black text-gray-800 text-[12px] uppercase tracking-tight">
                          <Building2 size={12} className="text-gray-300" />
                          <span className="truncate max-w-[130px]">{po.vendorName}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                          <Globe size={9} /> {po.vendorCountry}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                          <CalendarDays size={9} /> {dateCreated}
                        </span>
                      </div>
                    </td>

                    {/* Detail Sapi */}
                    <td className={`px-5 py-5 border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      <div className="flex flex-col gap-1.5">
                        <p className="font-black text-gray-900 uppercase text-[12px] tracking-tight group-hover:text-[#8da070] transition-colors truncate max-w-[160px]">
                          {breeds || 'Mixed'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {genders.map(g => (
                            <span key={g} className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                              g === 'JANTAN' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              g === 'BETINA' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                              'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {g === 'JANTAN' ? '♂ Jantan' : g === 'BETINA' ? '♀ Betina' : '± Campur'}
                            </span>
                          ))}
                        </div>
                        {po.items?.length > 1 && (
                          <span className="text-[8px] font-bold text-gray-400">{po.items.length} jenis sapi</span>
                        )}
                        {po.requestedBy && (
                          <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                            <User size={9} className="text-blue-400" /> {po.requestedBy}
                          </div>
                        )}
                        {(po.approvedBy) && (
                          <div className="flex items-center gap-1 text-[9px] text-green-600 font-bold">
                            <ShieldCheck size={9} /> {po.approvedBy}
                          </div>
                        )}
                        {!po.approvedBy && po.status === 'PENDING' && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold animate-pulse">
                            <Info size={9} /> Waiting approval
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ekor & Bobot */}
                    <td className={`px-5 py-5 text-center border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      <div className="inline-flex flex-col items-center gap-2">
                        <span className="text-[14px] font-black text-gray-900 italic tracking-tighter flex items-center gap-1">
                          {(parseInt(po.totalHeadOrdered)||0).toLocaleString('id-ID')}
                          <span className="text-[#8da070] text-[9px] not-italic font-black ml-0.5">EKOR</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                          <Scale size={10} /> {fmtQty(po.totalWeightKg)} kg
                        </span>
                        {po.totalHeadOrdered > 0 && po.totalWeightKg > 0 && (
                          <span className="text-[9px] font-bold text-gray-400">
                            ≈{(parseFloat(po.totalWeightKg)/parseInt(po.totalHeadOrdered)).toFixed(1)} kg/ekor
                          </span>
                        )}
                        {/* Arrival progress */}
                        {headArrived > 0 || po.isReceived ? (
                          <div className="w-full min-w-[90px]">
                            <HeadFulfillBar headOrdered={po.totalHeadOrdered} headArrived={headArrived} />
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Harga & HPP */}
                    <td className={`px-5 py-5 text-center border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      <div className="inline-flex flex-col items-center gap-1.5">
                        {po.items?.[0]?.pricePerKg > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign size={10} className="text-green-500" />
                            <span className="text-[10px] font-black text-gray-700">
                              Rp {fmtRp(po.items[0].pricePerKg)}/kg
                            </span>
                          </div>
                        )}
                        <div className="bg-[#8da070]/10 border border-[#8da070]/20 px-3 py-1.5 rounded-xl text-center">
                          <p className="text-[7px] font-black text-[#8da070] uppercase tracking-wider">HPP / Ekor</p>
                          <p className="text-[11px] font-black text-gray-800 italic">
                            Rp {fmtRp(po.hppPerEkor)}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">
                          Total Rp {fmtRp(po.hppTotal)}
                        </span>
                        {po.hppPerKg > 0 && (
                          <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5">
                            <TrendingUp size={9} /> Rp {fmtRp(po.hppPerKg)}/kg
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className={`px-5 py-5 text-center border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      <div className="flex flex-col items-center gap-2">
                        <StatusBadge status={po.status} />
                        {po.isReceived && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100">
                            <UserCheck size={10} />
                            <span className="text-[8px] font-black uppercase">Received</span>
                          </div>
                        )}
                        {po.batches?.length > 0 && (
                          <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {po.batches.length} batch
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className={`px-7 py-5 text-right border-b border-gray-50 ${isFirstGroup ? 'pt-7' : 'pt-4'}`}>
                      <div className="flex justify-end items-center gap-2">
                        {/* Approve / Revoke */}
                        {isAuthorized && !po.isReceived && (
                          <button
                            onClick={() => onStatusUpdate(po.id, po.status === 'APPROVED' ? 'PENDING' : 'APPROVED')}
                            className={`px-4 py-2.5 text-[10px] font-black rounded-xl transition-all shadow-sm uppercase italic active:scale-95 ${
                              po.status === 'APPROVED'
                                ? 'bg-white text-orange-600 border border-orange-100 hover:bg-orange-50'
                                : 'bg-[#8da070] text-white hover:bg-[#7a8c61] shadow-[#8da070]/20'
                            }`}>
                            {po.status === 'APPROVED' ? 'Revoke' : 'Approve'}
                          </button>
                        )}

                        {/* Delete */}
                        {isAuthorized && !po.isReceived && (
                          <button onClick={() => onDelete(po.id)}
                            className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-32 text-center text-gray-300 font-black uppercase tracking-widest italic text-[10px]">
                    Belum Ada Purchase Order Sapi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ──────────────────────────────────────────────────────── */}
        <div className="md:hidden divide-y divide-gray-50">
          {currentData.length > 0 ? currentData.map(po => {
            const breeds = [...new Set((po.items||[]).map(i => i.jenisSapi))].join(', ');
            return (
              <div key={po.id}
                className={`p-5 space-y-4 transition-all ${selectedIds.includes(po.id) ? 'bg-[#8da070]/5' : 'active:bg-gray-50'}`}>

                {/* Row 1: noPO + status + checkbox */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {isAuthorized && !po.isReceived && po.status !== 'APPROVED' && (
                      <button onClick={() => toggleSelect(po.id)} className="mt-0.5 shrink-0">
                        {selectedIds.includes(po.id)
                          ? <CheckSquare size={20} className="text-[#8da070]" />
                          : <Square size={20} className="text-gray-200" />}
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded border border-[#8da070]/20">{po.noPO}</span>
                        <StatusBadge status={po.status} />
                      </div>
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight leading-tight truncate">{po.vendorName}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                        <Globe size={9} /> {po.vendorCountry}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900 italic">
                      {(parseInt(po.totalHeadOrdered)||0).toLocaleString('id-ID')} ekor
                    </p>
                    <p className="text-[10px] font-bold text-amber-600 flex items-center justify-end gap-1 mt-0.5">
                      <Scale size={9} /> {fmtQty(po.totalWeightKg)} kg
                    </p>
                  </div>
                </div>

                {/* Row 2: breed + HPP */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Jenis Sapi</p>
                    <p className="font-black text-gray-700 uppercase truncate">{breeds || '-'}</p>
                  </div>
                  <div className="bg-[#8da070]/10 p-3 rounded-2xl border border-[#8da070]/20">
                    <p className="text-[8px] font-black text-[#8da070] uppercase mb-0.5">HPP / Ekor</p>
                    <p className="font-black text-gray-800 italic">Rp {fmtRp(po.hppPerEkor)}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">Total Rp {fmtRp(po.hppTotal)}</p>
                  </div>
                </div>

                {/* Row 3: actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => onViewDetail?.(po)}
                    className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-1.5">
                    Detail <ChevronRight size={12} />
                  </button>
                  {isAuthorized && !po.isReceived && (
                    <button
                      onClick={() => onStatusUpdate(po.id, po.status === 'APPROVED' ? 'PENDING' : 'APPROVED')}
                      className={`flex-[2] py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-lg ${
                        po.status === 'APPROVED'
                          ? 'bg-orange-50 text-orange-600 border border-orange-100'
                          : 'bg-[#8da070] text-white shadow-[#8da070]/20'
                      }`}>
                      {po.status === 'APPROVED' ? 'Revoke' : 'Approve'}
                    </button>
                  )}
                  {isAuthorized && !po.isReceived && (
                    <button onClick={() => onDelete(po.id)}
                      className="p-3 bg-gray-50 text-gray-300 rounded-2xl border border-gray-100 active:text-red-600">
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="p-20 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest italic">
              Belum Ada PO Sapi
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => { setCurrentPage(p); setSelectedIds([]); }}
        />
      </div>
    </div>
  );
};

export default memo(CattlePurchasingTable);
