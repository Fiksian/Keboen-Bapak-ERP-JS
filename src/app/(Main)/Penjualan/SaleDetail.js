'use client';

import React from 'react';
import { 
    X, User, Calendar, Package, CheckCircle, AlertCircle, Tag 
} from 'lucide-react';

const SaleDetail = ({ isOpen, sale, onClose, onStatusUpdate }) => {
    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-300 max-h-[92vh] flex flex-col">
                
                <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase italic tracking-tight">Detail Transaksi</h2>
                        <p className="text-[10px] font-bold text-[#8da070] tracking-[0.2em] uppercase">{sale.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 active:scale-90 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 md:p-8 overflow-y-auto space-y-6 md:space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-gray-50 p-4 rounded-[24px] flex items-center gap-4 border border-gray-100">
                            <div className="p-2.5 bg-white rounded-xl text-blue-500 shadow-sm"><User size={20}/></div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pelanggan</p>
                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{sale.customer}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-[24px] flex items-center gap-4 border border-gray-100">
                            <div className="p-2.5 bg-white rounded-xl text-orange-500 shadow-sm"><Calendar size={20}/></div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tanggal</p>
                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                    {new Date(sale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ml-1">
                            <Package size={14} className="text-[#8da070]"/> Rincian Pesanan
                        </h3>
                        
                        <div className="bg-white sm:border sm:border-gray-100 sm:rounded-[28px] overflow-hidden">
                            <table className="w-full text-left hidden sm:table">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase italic">Produk</th>
                                        <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase text-center italic">Qty</th>
                                        <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase text-center italic">Satuan</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right italic">Harga</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sale.items?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{item.productName}</td>
                                            <td className="px-4 py-4 text-sm font-black text-gray-900 text-center">{item.quantity}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-[10px] font-black text-gray-500 uppercase rounded-lg">
                                                    <Tag size={10} /> {item.unit || 'Unit'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-900 text-right">
                                                Rp {item.price.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="sm:hidden space-y-3">
                                {sale.items?.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50/50 border border-gray-100 p-4 rounded-[20px] flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.productName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-gray-400">{item.quantity} {item.unit || 'Unit'}</span>
                                                <span className="text-gray-200">|</span>
                                                <span className="text-[10px] font-bold text-gray-400">@ Rp {item.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-gray-900 italic">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center p-6 bg-gray-900 rounded-[28px] text-white shadow-xl shadow-gray-200">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Akhir</span>
                            <span className="text-2xl font-black italic tracking-tighter">
                                <span className="text-xs not-italic font-medium text-gray-500 mr-2">Rp</span>
                                {sale.total.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {sale.status === 'PENDING' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button 
                                    onClick={() => onStatusUpdate(sale.id, 'COMPLETED')}
                                    className="flex items-center justify-center gap-3 py-4.5 md:py-4 bg-[#8da070] hover:bg-[#7a8c61] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-[#8da070]/20 active:scale-95 order-1 sm:order-none"
                                >
                                    <CheckCircle size={18}/> Selesaikan
                                </button>
                                <button 
                                    onClick={() => onStatusUpdate(sale.id, 'CANCELLED')}
                                    className="flex items-center justify-center gap-3 py-4.5 md:py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 order-2 sm:order-none"
                                >
                                    <AlertCircle size={18}/> Batalkan
                                </button>
                            </div>
                        ) : (
                            <div className={`p-5 rounded-[24px] border flex items-start gap-4 ${
                                sale.status === 'COMPLETED' 
                                ? 'bg-green-50 border-green-100 text-green-700' 
                                : 'bg-red-50 border-red-100 text-red-700'
                            }`}>
                                {sale.status === 'COMPLETED' ? <CheckCircle size={24} className="shrink-0" /> : <AlertCircle size={24} className="shrink-0" />}
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status Transaksi: {sale.status}</p>
                                    <p className="text-[11px] font-bold leading-relaxed opacity-80">
                                        {sale.status === 'COMPLETED' 
                                            ? 'Pesanan sudah diselesaikan. Invoice telah divalidasi dan stok telah terpotong secara otomatis.' 
                                            : 'Pesanan telah dibatalkan. Sistem telah mengembalikan kuantitas stok barang ke gudang.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaleDetail;