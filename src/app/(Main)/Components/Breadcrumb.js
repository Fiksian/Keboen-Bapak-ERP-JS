"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

// ─── Peta path → label + parent (untuk breadcrumb hierarki) ─────────────────
// Format: { [path]: { label, parent?: path } }
const PATH_MAP = {
  '/Dashboard':    { label: 'Dashboard' },
  '/Cuaca':        { label: 'Cuaca' },
  '/Report':       { label: 'Report' },
  '/Staff':        { label: 'Staff' },
  '/Contacts':     { label: 'Contacts' },
  '/Tasks':        { label: 'Tasks' },
  '/Kandang':      { label: 'Kandang' },
  '/Produksi':     { label: 'Produksi' },
  '/Feedmill':     { label: 'Feedmill' },

  // ── Grup Pengadaan ─────────────────────────────────────────────────────────
  // Semua tiga modul di bawah ini punya parent virtual "Pengadaan"
  '/Purchasing':   { label: 'Purchase Order', parent: 'pengadaan' },
  '/Arrival':      { label: 'Arrival',         parent: 'pengadaan' },
  '/STTB':         { label: 'STTB',            parent: 'pengadaan' },

  '/Stock':        { label: 'Warehouse' },
  '/Penjualan':    { label: 'Penjualan' },
  '/Finance':      { label: 'Finance' },
  '/History':      { label: 'History' },
};

// Group virtual — tidak punya real URL, hanya label di breadcrumb
const VIRTUAL_GROUPS = {
  pengadaan: { label: 'Pengadaan' },
};

// ─── Komponen ─────────────────────────────────────────────────────────────────
const Breadcrumb = () => {
  const pathname = usePathname();

  // Bangun chain: cari entri di PATH_MAP yang cocok dengan awal pathname
  // (support sub-path misal /Purchasing/detail)
  const getMatchedEntry = () => {
    // Cari exact match dulu, lalu prefix match
    if (PATH_MAP[pathname]) return { path: pathname, ...PATH_MAP[pathname] };
    const match = Object.keys(PATH_MAP)
      .filter(p => pathname.startsWith(p) && p !== '/')
      .sort((a, b) => b.length - a.length)[0]; // longest match
    return match ? { path: match, ...PATH_MAP[match] } : null;
  };

  const entry = getMatchedEntry();

  // Jika tidak ada entri yang cocok atau sedang di root, jangan render
  if (!entry || pathname === '/') return null;

  // Susun breadcrumb items
  const crumbs = [
    { label: 'Dashboard', href: '/Dashboard', isLink: true },
  ];

  // Jika ada parent virtual (group), sisipkan
  if (entry.parent && VIRTUAL_GROUPS[entry.parent]) {
    crumbs.push({
      label: VIRTUAL_GROUPS[entry.parent].label,
      href:  null,        // parent virtual tidak punya URL
      isLink: false,
    });
  }

  // Halaman aktif
  crumbs.push({
    label:  entry.label,
    href:   entry.path,
    isLink: false, // halaman aktif tidak perlu link
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mb-4 md:mb-6 px-0.5"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={i}>
            {i === 0 ? (
              /* Dashboard selalu pakai ikon rumah */
              <Link
                href={crumb.href}
                className="flex items-center gap-1 text-gray-400 hover:text-[#8da070] transition-colors"
              >
                <Home size={13} />
                <span className="hidden sm:inline">{crumb.label}</span>
              </Link>
            ) : crumb.isLink && crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-[#8da070] transition-colors uppercase tracking-wider"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={`uppercase tracking-wider ${
                  isLast ? 'text-gray-700 font-black' : 'text-gray-400'
                }`}
              >
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight size={12} className="text-gray-300 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;