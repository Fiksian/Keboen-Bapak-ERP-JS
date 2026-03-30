'use client'

import React, { useState, useEffect } from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink, 
  PDFViewer 
} from '@react-pdf/renderer';

import { Leaf } from 'lucide-react';

// --- STYLES ---
const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontSize: 10, 
    fontFamily: 'Helvetica', 
    backgroundColor: '#fff' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderBottomWidth: 3, 
    borderBottomColor: '#8da070', 
    paddingBottom: 15, 
    marginBottom: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    color: '#1a1c18' 
  },
  sectionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25, 
    paddingBottom: 10 
  },
  label: { 
    fontSize: 8, 
    color: '#71717a', 
    marginBottom: 4, 
    textTransform: 'uppercase', 
    fontWeight: 'bold' 
  },
  boldText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    color: '#1a1c18' 
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f8faf7', 
    borderBottomWidth: 1, 
    borderBottomColor: '#8da070', 
    padding: 8, 
    marginTop: 10 
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    padding: 10, 
    alignItems: 'center' 
  },
  col1: { width: '40%', fontSize: 9 },
  col2: { width: '15%', textAlign: 'center', fontWeight: 'bold' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '30%', textAlign: 'right', fontWeight: 'bold' },
  summaryContainer: { 
    marginTop: 20, 
    flexDirection: 'row', 
    justifyContent: 'flex-end' 
  },
  totalBox: { 
    width: '40%', 
    backgroundColor: '#1a1c18', 
    padding: 15, 
    borderRadius: 8, 
    color: '#fff' 
  },
  footer: { 
    marginTop: 'auto', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingTop: 40, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0' 
  },
  signatureArea: { 
    textAlign: 'center', 
    width: '30%' 
  },
  watermark: { 
    position: 'absolute', 
    top: '45%', 
    left: '25%', 
    fontSize: 60, 
    color: '#f0f0f0', 
    transform: 'rotate(-45deg)', 
    zIndex: -1, 
    fontWeight: 'bold' 
  }
});

// --- DUMMY DATA UNTUK PREVIEW ---
const dummyData = {
  invoiceId: "INV/2026/03/0042",
  createdAt: new Date().toISOString(),
  customer: {
    name: "PT. Maju Terus Farm",
    address: "Jl. Raya Ciparay No. 123, Kabupaten Bandung, Jawa Barat",
    phone: "+62 812-3456-7890"
  },
  status: "PAID",
  items: [
    { productName: "Sapi Brahman Cross (Grade A)", quantity: 2, unit: "Ekor", price: 25000000 },
    { productName: "Pakan Konsentrat Hijau", quantity: 10, unit: "Sak", price: 150000 },
    { productName: "Biaya Pengiriman (L01)", quantity: 1, unit: "Trip", price: 500000 }
  ],
  totalAmount: 51500000,
  notes: "Pembayaran telah diverifikasi. Sapi dalam kondisi sehat dan siap kirim."
};

const SalesNoteDocument = ({ data }) => {
  const activeData = data || dummyData;
  const dateStr = new Date(activeData.createdAt).toLocaleDateString('id-ID', {
    day: '2-digit', 
    month: 'long', 
    year: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>KEBOEN BAPAK</Text>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nota Penjualan</Text>
            <Text style={{ marginTop: 4, fontSize: 10, color: '#8da070', fontWeight: 'bold' }}>
              Inv No: {activeData.invoiceId}
            </Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>KEBOEN BAPAK</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>Sales Document</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={{ width: '60%' }}>
            <Text style={styles.label}>Ditujukan Kepada:</Text>
            <Text style={styles.boldText}>{activeData.customer?.name}</Text>
            <Text style={{ fontSize: 9, color: '#52525b', marginTop: 4 }}>{activeData.customer?.address}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.label}>Tanggal:</Text>
            <Text style={styles.boldText}>{dateStr}</Text>
            <Text style={{ fontSize: 8, color: '#8da070', fontWeight: 'bold', marginTop: 5 }}>{activeData.status}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.col1}>DESKRIPSI PRODUK</Text>
          <Text style={styles.col2}>QTY</Text>
          <Text style={styles.col3}>UNIT</Text>
          <Text style={styles.col4}>SUBTOTAL</Text>
        </View>

        {activeData.items?.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col1}>{item.productName}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>{item.unit}</Text>
            <Text style={styles.col4}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
          </View>
        ))}

        <View style={styles.summaryContainer}>
          <View style={styles.totalBox}>
            <Text style={{ fontSize: 8, color: '#8da070', fontWeight: 'bold' }}>TOTAL AKHIR</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5 }}>
              Rp {activeData.totalAmount.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureArea}>
            <Text style={styles.label}>Penerima,</Text>
            <View style={{ height: 40 }} />
            <Text style={styles.boldText}>( ________________ )</Text>
          </View>
          <View style={styles.signatureArea}>
            <Text style={styles.label}>Hormat Kami,</Text>
            <View style={{ height: 40 }} />
            <Text style={styles.boldText}>KEBOEN BAPAK</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const PrintSalesNote = ({ data }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const activeData = data || dummyData;

  return (
    <div className="flex flex-col w-full h-[850px] bg-white overflow-hidden shadow-2xl">
      <div className="bg-[#1a1c18] p-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#8da070] rounded-xl text-white">
             <Leaf size={22} />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-sm uppercase tracking-tighter text-[#8da070] italic">
              Invoice Preview
            </h2>
            <p className="text-[14px] text-slate-400 uppercase font-bold tracking-[0.2em]">
              {!data ? "Demo Mode - Data Contoh" : ` ${activeData.invoiceId}`}
            </p>
          </div>
        </div>
        
        <PDFDownloadLink 
          document={<SalesNoteDocument data={activeData} />} 
          fileName={`Nota-${activeData.invoiceId}.pdf`}
          className="bg-[#8da070] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7a8c60] transition-all flex items-center gap-2 shadow-lg shadow-[#8da070]/20 active:scale-95"
        >
          {({ loading }) => (loading ? 'Generating...' : 'Download Invoice')}
        </PDFDownloadLink>
      </div>

      <div className="flex-1 bg-slate-800 p-4">
        <PDFViewer width="100%" height="100%" showToolbar={false} className="border-0 rounded-2xl shadow-inner">
          <SalesNoteDocument data={activeData} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PrintSalesNote;