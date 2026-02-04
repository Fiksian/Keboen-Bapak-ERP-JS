'use client';

import React from 'react';
import { X, Receipt, Calendar, User, Tag, CreditCard, Info } from 'lucide-react';

const FinanceDetail = ({ isOpen, onClose, trx }) => {
    if (!isOpen || !trx) return null;

    const details = [
        { label: 'Kategori', value: trx.category, icon: Tag },
        { label: 'Tanggal', value: new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), icon: Calendar },
        { label: 'Metode', value: trx.method || 'CASH', icon: CreditCard },
        { label: 'Operator', value: trx.createdBy || 'System', icon: User },
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${trx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Detail Transaksi</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{trx.trxNo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Nominal</p>
                        <p className={`text-3xl font-black ${trx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {trx.type === 'INCOME' ? '+' : '-'} Rp {Math.abs(trx.amount).toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex items-start gap-3">
                                <Info size={18} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Keterangan</p>
                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{trx.description || 'Tidak ada keterangan'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {details.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="text-gray-300">
                                        <item.icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{item.label}</p>
                                        <p className="text-[11px] font-bold text-gray-700 uppercase">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button 
                        onClick={() => { window.print(); }}
                        className="w-full bg-[#8da070] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#8da070]/20 hover:bg-[#7a8c61] active:scale-95 transition-all"
                    >
                        Cetak Bukti Transaksi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinanceDetail;