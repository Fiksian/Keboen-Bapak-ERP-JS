'use client';

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
  PDFDownloadLink, PDFViewer
} from '@react-pdf/renderer';

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    padding: 40, fontSize: 9, fontFamily: 'Helvetica',
    backgroundColor: '#fff', flexDirection: 'column',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderBottomWidth: 3, borderBottomColor: '#000',
    paddingBottom: 12, marginBottom: 16,
  },
  docTitle:  { fontSize: 20, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  docSub:    { fontSize: 7, backgroundColor: '#000', color: '#fff', padding: '2 5', marginTop: 4, alignSelf: 'flex-start' },
  orgName:   { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  orgSub:    { fontSize: 7, color: '#888', textAlign: 'right', marginTop: 2 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  label:    { fontSize: 7, color: '#999', marginBottom: 2, textTransform: 'uppercase' },
  boldText: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f5f5f5',
    borderTopWidth: 2, borderTopColor: '#000',
    borderBottomWidth: 2, borderBottomColor: '#000',
    padding: '7 8', marginTop: 8,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', padding: '8 8', alignItems: 'center' },
  col1: { width: '45%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '25%', textAlign: 'center' },
  weightBox: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff8f0', padding: 12,
    marginVertical: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#f0a050',
  },
  weightItem: { alignItems: 'center' },
  nettoVal:   { fontSize: 16, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', color: '#c04000' },
  // Stamps section — 4 kolom untuk 4 tahap
  stampsSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  stampsTitle:   { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#666', marginBottom: 8 },
  stampsRow:     { flexDirection: 'row', gap: 6 },
  stampDone: {
    flex: 1, borderWidth: 1.5, borderColor: '#22c55e', borderRadius: 6,
    padding: '6 8', alignItems: 'center', backgroundColor: '#f0fdf4',
  },
  stampPending: {
    flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6,
    padding: '6 8', alignItems: 'center', backgroundColor: '#f9fafb',
  },
  checkmark:   { fontSize: 12, color: '#22c55e', marginBottom: 3 },
  stampRole:   { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#374151', textAlign: 'center' },
  stampName:   { fontSize: 7, fontFamily: 'Helvetica-Bold', marginTop: 3, textAlign: 'center' },
  stampDate:   { fontSize: 5.5, color: '#888', marginTop: 2, textAlign: 'center' },
  pendingTxt:  { fontSize: 6, color: '#9ca3af', textAlign: 'center', marginTop: 2 },
  footer: { marginTop: 'auto', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  warehouseBox: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 6, padding: '6 10' },
});

const fmt     = (dt) => dt ? new Date(dt).toLocaleString('id-ID',  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

// ─── PDF Document ─────────────────────────────────────────────────────────────
const STTBDocument = ({ data }) => {
  const qtyVal = data.netWeight || data.receivedQty || data.qty || 0;

  // 4 tahap approval — urutan baru: QC → Admin → Supervisor → Manager
  const stages = [
    { role: 'QC Penerimaan', by: data.qcApprovedBy,         at: data.qcApprovedAt,         auto: true  },
    { role: 'Admin',          by: data.adminApprovedBy,       at: data.adminApprovedAt,       auto: false },
    { role: 'Supervisor',     by: data.supervisorApprovedBy,  at: data.supervisorApprovedAt,  auto: false },
    { role: 'Manager',        by: data.managerApprovedBy,     at: data.managerApprovedAt,     auto: false },
  ];

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.docTitle}>Surat Tanda Terima Barang</Text>
            <View style={S.docSub}><Text>STTB · INBOUND VERIFICATION · 4-STAGE</Text></View>
            <Text style={{ marginTop: 6, fontSize: 9 }}>No. STTB: {data.sttbNo || '-'}</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>Ref PO: {data.noPO || '-'}</Text>
          </View>
          <View>
            <Text style={S.orgName}>KEBOEN BAPAK ERP</Text>
            <Text style={S.orgSub}>Warehouse & Logistics Department</Text>
            <Text style={[S.orgSub, { marginTop: 4 }]}>Tanggal: {fmtDate(data.receivedAt)}</Text>
          </View>
        </View>

        {/* Info pengiriman */}
        <View style={S.infoRow}>
          <View style={{ width: '60%' }}>
            <Text style={S.label}>Dikirim oleh (Vendor):</Text>
            <Text style={S.boldText}>{data.supplier || 'Supplier Umum'}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 20 }}>
              <View>
                <Text style={S.label}>No. Surat Jalan:</Text>
                <Text style={{ fontSize: 9 }}>{data.suratJalan || '-'}</Text>
              </View>
              <View>
                <Text style={S.label}>No. Kendaraan:</Text>
                <Text style={{ fontSize: 9 }}>{data.vehicleNo || '-'}</Text>
              </View>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={S.label}>Diterima oleh:</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{data.receivedBy || '-'}</Text>
            <Text style={S.label}>Tanggal & Waktu:</Text>
            <Text style={{ fontSize: 8 }}>{fmt(data.receivedAt) || '-'}</Text>
          </View>
        </View>

        {/* Tabel item */}
        <View style={S.tableHeader}>
          <Text style={[S.col1, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>DESKRIPSI BARANG</Text>
          <Text style={[S.col2, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>QTY</Text>
          <Text style={[S.col3, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>UNIT</Text>
          <Text style={[S.col4, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>KONDISI FISIK</Text>
        </View>
        <View style={S.tableRow}>
          <Text style={[S.col1, { fontSize: 10 }]}>{data.item || '-'}</Text>
          <Text style={[S.col2, { fontSize: 14, fontFamily: 'Helvetica-Bold' }]}>{parseFloat(qtyVal).toFixed(2)}</Text>
          <Text style={[S.col3, { fontSize: 9 }]}>{data.unit || 'Unit'}</Text>
          <Text style={[S.col4, { fontSize: 9 }]}>{data.condition || 'GOOD'}</Text>
        </View>

        {/* Data timbangan */}
        <View style={S.weightBox}>
          {[
            { label: 'Gross Weight', val: data.grossWeight, unit: 'KG' },
            { label: 'Tare Weight',  val: data.tareWeight,  unit: 'KG' },
            { 
              label: 'Refraksi',     
              val: data.refraksi,    
              unit: '%' // Ubah satuan menjadi persen
            },
            { label: 'Netto',        val: data.netWeight,   unit: 'KG', netto: true },
          ].map(w => (
            <View key={w.label} style={S.weightItem}>
              <Text style={{ ...S.label, color: w.netto ? '#c04000' : '#999' }}>{w.label}</Text>
              <Text style={w.netto ? S.nettoVal : { fontSize: 12, fontFamily: 'Helvetica-Bold' }}>
                {parseFloat(w.val || 0).toFixed(2)} {w.unit}
              </Text>
            </View>
          ))}
        </View>

        {/* Catatan */}
        {data.notes && (
          <View style={{ marginBottom: 10 }}>
            <Text style={S.label}>Catatan Penerimaan:</Text>
            <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#555' }}>{data.notes}</Text>
          </View>
        )}

        {/* ── 4-Stage Approval Stamps ─────────────────────────────────────── */}
        <View style={S.stampsSection}>
          <Text style={S.stampsTitle}>Tanda Tangan Digital — 4-Stage Approval (QC → Admin → Supervisor → Manager)</Text>
          <View style={S.stampsRow}>
            {stages.map((stage, i) => {
              const done = !!stage.by;
              return (
                <View key={i} style={done ? S.stampDone : S.stampPending}>
                  {done ? (
                    <>
                      <Text style={S.checkmark}>✓</Text>
                      <Text style={[S.stampRole, { color: '#15803d' }]}>{stage.role}</Text>
                      <Text style={S.stampName}>{stage.by}</Text>
                      <Text style={S.stampDate}>{fmt(stage.at)}</Text>
                      {stage.auto && <Text style={{ ...S.stampDate, color: '#16a34a' }}>Auto-QC System</Text>}
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 10, color: '#d1d5db', marginBottom: 3 }}>○</Text>
                      <Text style={[S.stampRole, { color: '#9ca3af' }]}>{stage.role}</Text>
                      <Text style={S.pendingTxt}>Menunggu</Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Footer: gudang & status */}
        <View style={S.footer}>
          <View>
            <Text style={S.label}>Status Dokumen:</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: data.status === 'APPROVED' ? '#16a34a' : '#d97706' }}>
              {data.status || 'PENDING'}
            </Text>
          </View>
          {data.warehouseName ? (
            <View style={S.warehouseBox}>
              <Text style={[S.label, { color: '#1d4ed8' }]}>Gudang Penyimpanan</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e40af' }}>{data.warehouseName}</Text>
            </View>
          ) : (
            <View style={[S.warehouseBox, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
              <Text style={[S.label, { color: '#d97706' }]}>Gudang Penyimpanan</Text>
              <Text style={{ fontSize: 9, color: '#92400e', fontStyle: 'italic' }}>Belum ditetapkan — menunggu Manager</Text>
            </View>
          )}
        </View>

        {/* DRAFT watermark */}
        {data.status !== 'APPROVED' && (
          <Text style={{
            position: 'absolute', top: '45%', left: '8%',
            fontSize: 60, color: '#f5f5f5', fontFamily: 'Helvetica-Bold',
            transform: 'rotate(-35deg)', opacity: 0.5,
          }}>
            DRAFT
          </Text>
        )}

      </Page>
    </Document>
  );
};

// ─── React viewer ─────────────────────────────────────────────────────────────
const PrintSTTB = ({ data }) => {
  if (!data) return null;

  const statusColor = data.status === 'APPROVED' ? 'text-green-600' :
                      data.status === 'REJECTED'  ? 'text-red-500'   : 'text-orange-500';

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-hidden rounded-xl">
      <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center shrink-0">
        <div>
          <p className="font-black text-[11px] uppercase tracking-tighter text-slate-800">Pratinjau STTB</p>
          <p className="text-[8px] text-slate-400 uppercase font-bold italic">
            {data.sttbNo || '-'} · {data.noPO}
            <span className={`ml-2 font-black ${statusColor}`}>{data.status}</span>
          </p>
        </div>
        <PDFDownloadLink
          document={<STTBDocument data={data} />}
          fileName={`${data.sttbNo || 'STTB'}.pdf`}
          className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
        >
          {({ loading }) => loading ? 'Memproses...' : 'Download PDF'}
        </PDFDownloadLink>
      </div>
      <div className="flex-1 w-full bg-slate-200">
        <PDFViewer width="100%" height="100%" className="border-0">
          <STTBDocument data={data} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PrintSTTB;