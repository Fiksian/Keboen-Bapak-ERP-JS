'use client';

import React from 'react';
import { 
    X, User, Calendar, Package, CheckCircle, AlertCircle, Tag 
} from 'lucide-react';

const SaleDetail = ({ isOpen, sale, onClose, onStatusUpdate }) => {
    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-4xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Detail Transaksi</h2>
                        <p className="text-xs font-bold text-[#8da070] tracking-widest uppercase">{sale.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-3xl flex items-center gap-4">
                            <div className="p-2 bg-white rounded-xl text-gray-400"><User size={20}/></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Pelanggan</p>
                                <p className="text-sm font-bold text-gray-900">{sale.customer}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl flex items-center gap-4">
                            <div className="p-2 bg-white rounded-xl text-gray-400"><Calendar size={20}/></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Tanggal</p>
                                <p className="text-sm font-bold text-gray-900">
                                    {new Date(sale.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Package size={14}/> Daftar Barang & Satuan
                        </h3>
                        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Produk</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Qty</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Satuan</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Harga</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sale.items?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-bold text-gray-700">{item.productName}</td>
                                            <td className="px-4 py-3 text-sm font-black text-gray-900 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-500 uppercase rounded-md">
                                                    <Tag size={10} />
                                                    {item.unit || 'Unit'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-black text-gray-900 text-right">
                                                Rp {item.price.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center p-6 bg-[#8da070] rounded-3xl text-white shadow-lg shadow-[#8da070]/20">
                            <span className="text-xs font-black uppercase tracking-widest">Total Bayar</span>
                            <span className="text-2xl font-black italic">Rp {sale.total.toLocaleString('id-ID')}</span>
                        </div>

                        {sale.status === 'PENDING' && (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => onStatusUpdate(sale.id, 'COMPLETED')}
                                    className="flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                >
                                    <CheckCircle size={18}/> Selesaikan Pesanan
                                </button>
                                <button 
                                    onClick={() => onStatusUpdate(sale.id, 'CANCELLED')}
                                    className="flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
                                >
                                    <AlertCircle size={18}/> Batalkan & Restock
                                </button>
                            </div>
                        )}

                        {sale.status === 'COMPLETED' && (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
                                <CheckCircle size={20} className="shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-tight">Transaksi ini telah selesai dan stok telah diperbarui.</p>
                            </div>
                        )}

                        {sale.status === 'CANCELLED' && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-tight">Transaksi dibatalkan. Stok telah dikembalikan ke gudang.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaleDetail;