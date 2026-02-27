'use client'

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image, 
  PDFDownloadLink, 
  PDFViewer 
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 8,
    backgroundColor: '#000',
    color: '#fff',
    padding: '2 5',
    marginTop: 5,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  label: {
    fontSize: 8,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  boldText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderTopWidth: 2,
    borderTopColor: '#000',
    padding: 8,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
    alignItems: 'center',
  },
  col1: { width: '45%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '25%', textAlign: 'center' },
  
  weightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  weightBox: {
    alignItems: 'center',
  },
  nettoText: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  signatureArea: {
    textAlign: 'center',
    width: '40%',
  },
  attachmentContainer: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    minHeight: 400,
  },
  image: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  }
});

const STTBDocument = ({ data }) => {
  const mainReceipt = data.receipts?.[0] || {};
  const displayImage = data.imageUrl || mainReceipt.imageUrl || null;
  
  const qtyVal = data.netWeight || data.qty || '0';
  const unitVal = data.unit || 'Unit';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Surat Tanda Terima Barang</Text>
            <View style={styles.subTitle}><Text>STTB-INBOUND</Text></View>
            <Text style={{ marginTop: 5, fontSize: 10 }}>No. PO: {data.noPO}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>KEBOEN BAPAK ERP</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>Warehouse & Logistics Department</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={{ width: '60%' }}>
            <Text style={styles.label}>Dikirim Oleh (Vendor):</Text>
            <Text style={styles.boldText}>{data.supplier || "Supplier Umum"}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 15 }}>
              <View>
                <Text style={styles.label}>No. Surat Jalan:</Text>
                <Text style={{ fontSize: 9 }}>{data.suratJalan || mainReceipt.suratJalan || "-"}</Text>
              </View>
              <View>
                <Text style={styles.label}>No. Kendaraan:</Text>
                <Text style={{ fontSize: 9 }}>{data.vehicleNo || mainReceipt.vehicleNo || "-"}</Text>
              </View>
            </View>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.label}>Tanggal & Waktu Terima:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
              {new Date(data.receivedAt || mainReceipt.receivedAt).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col1}>DESKRIPSI BARANG</Text>
          <Text style={styles.col2}>QTY</Text>
          <Text style={styles.col3}>UNIT</Text>
          <Text style={styles.col4}>KONDISI</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>{data.item}</Text>
          <Text style={[styles.col2, { fontSize: 14, fontWeight: 'bold' }]}>{qtyVal}</Text>
          <Text style={styles.col3}>{unitVal}</Text>
          <Text style={styles.col4}>{data.condition || mainReceipt.condition || "GOOD"}</Text>
        </View>

        <View style={styles.weightContainer}>
          <View style={styles.weightBox}>
            <Text style={styles.label}>Gross</Text>
            <Text>{parseFloat(data.grossWeight || 0).toFixed(2)} KG</Text>
          </View>
          <View style={styles.weightBox}>
            <Text style={styles.label}>Tare</Text>
            <Text>{parseFloat(data.tareWeight || 0).toFixed(2)} KG</Text>
          </View>
          <View style={styles.weightBox}>
            <Text style={[styles.label, { color: '#000', fontWeight: 'bold' }]}>Netto</Text>
            <Text style={styles.nettoText}>{parseFloat(data.netWeight || 0).toFixed(2)} KG</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>Catatan Pemeriksaan:</Text>
            <Text style={{ fontSize: 9, fontStyle: 'italic' }}>{data.notes || mainReceipt.notes || "-"}</Text>
          </View>
          <View style={styles.signatureArea}>
            <Text style={{ fontSize: 8, marginBottom: 40 }}>RECEIVER PIC,</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', borderBottomWidth: 1 }}>{data.receivedBy || "System"}</Text>
            <Text style={{ fontSize: 7, color: '#999', marginTop: 2 }}>Digital Signature Verified</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomWidth: 1 }]}>
          <Text style={styles.title}>Lampiran Bukti Fisik</Text>
          <Text style={{ fontSize: 9 }}>Ref PO: {data.noPO}</Text>
        </View>

        <View style={styles.attachmentContainer}>
          {displayImage ? (
            <Image 
              src={{ uri: displayImage, method: 'GET', headers: {}, cache: true }} 
              style={styles.image} 
            />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 60, height: 60, border: '1px dashed #ccc', borderRadius: 30, marginBottom: 15, justifyContent: 'center', alignItems: 'center' }}>
                 <Text style={{ color: '#ccc', fontSize: 20 }}>+</Text>
              </View>
              <Text style={{ color: '#999', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Area Lampiran Fisik</Text>
              <Text style={{ color: '#ddd', fontSize: 8, marginTop: 5, textAlign: 'center' }}>
                Tempelkan Surat Jalan atau Dokumentasi fisik di sini{"\n"}
                (Bukti digital tidak tersedia)
              </Text>
            </View>
          )}
        </View>

        <Text style={{ textAlign: 'center', color: '#eee', fontSize: 8, marginTop: 20 }}>
          -- Batas Akhir Dokumen Lampiran --
        </Text>
      </Page>
    </Document>
  );
};

const PrintSTTB = ({ data }) => {
  if (!data) return null;

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-hidden rounded-xl shadow-inner">
      <div className="bg-slate-50 border-b p-3 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <h2 className="font-black text-[10px] uppercase tracking-tighter text-slate-800">Pratinjau Dokumen</h2>
          <p className="text-[8px] text-slate-400 uppercase font-bold italic">STTB-INBOUND | {data.noPO}</p>
        </div>
        
        <div className="flex gap-2">
          <PDFDownloadLink 
            document={<STTBDocument data={data} />} 
            fileName={`STTB-${data.noPO}.pdf`}
            className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
          >
            {({ loading }) => (loading ? 'Memproses...' : 'Download PDF')}
          </PDFDownloadLink>
        </div>
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