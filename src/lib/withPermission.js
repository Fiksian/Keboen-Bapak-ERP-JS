// ────────────────────────────────────────────────────────────────────────────
// lib/withPermission.js
//
// Higher-Order Component (HOC) untuk proteksi halaman berbasis permissions.
//
// CARA PAKAI di setiap halaman modul:
//
//   import withPermission from '@/lib/withPermission';
//
//   const PurchasingPage = () => { ... };
//   export default withPermission(PurchasingPage, 'purchasing');
//
// Halaman hanya bisa dibuka jika:
//   - User memiliki role 'SuperAdmin', ATAU
//   - RolePermission milik role user mengandung ID modul tersebut, ATAU
//   - RolePermission mengandung '*' (wildcard = akses penuh)
// ────────────────────────────────────────────────────────────────────────────

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2, Lock } from 'lucide-react';

// ─── Komponen UI: Akses Ditolak ──────────────────────────────────────────────
const AccessDenied = ({ moduleId }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
    <div className="relative">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
        <ShieldAlert size={40} className="text-red-400" />
      </div>
      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1.5">
        <Lock size={12} />
      </div>
    </div>
    <div>
      <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">
        Akses Ditolak
      </h2>
      <p className="text-sm text-gray-500 font-bold uppercase tracking-widest max-w-sm">
        Anda tidak memiliki izin untuk mengakses modul{' '}
        <span className="text-red-500">
          {moduleId}
        </span>
        .
      </p>
      <p className="text-xs text-gray-400 mt-3 italic">
        Hubungi Administrator untuk mendapatkan akses.
      </p>
    </div>
  </div>
);

// ─── HOC: withPermission ─────────────────────────────────────────────────────
const withPermission = (WrappedComponent, moduleId) => {
  const ProtectedPage = (props) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [allowed, setAllowed]   = useState(null); // null = loading
    const [checked, setChecked]   = useState(false);

    useEffect(() => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      // SuperAdmin: akses penuh tanpa cek API
      if (session?.user?.role === 'SuperAdmin') {
        setAllowed(true);
        setChecked(true);
        return;
      }

      // Cek permissions dari RolePermission
      const checkPermission = async () => {
        try {
          const res  = await fetch('/api/auth/roles');
          const data = await res.json();
          const userPerms = data[session.user.role] || [];
          const hasAccess = userPerms.includes('*') || userPerms.includes(moduleId);
          setAllowed(hasAccess);
        } catch {
          setAllowed(false);
        } finally {
          setChecked(true);
        }
      };

      checkPermission();
    }, [session, status, router]);

    // ── Loading state ───────────────────────────────────────────────────────
    if (!checked || status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      );
    }

    // ── Access denied ───────────────────────────────────────────────────────
    if (!allowed) {
      return <AccessDenied moduleId={moduleId} />;
    }

    // ── Render halaman ──────────────────────────────────────────────────────
    return <WrappedComponent {...props} />;
  };

  ProtectedPage.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return ProtectedPage;
};

export default withPermission;
