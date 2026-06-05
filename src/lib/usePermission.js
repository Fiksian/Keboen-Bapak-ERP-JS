// lib/usePermission.js
//
// Custom hook untuk cek permission user secara client-side.
//
// CARA PAKAI:
//   const { isSuperAdmin, hasPermission, loading } = usePermission();
//
//   isSuperAdmin       → true jika role === 'SuperAdmin'
//   hasPermission(id)  → true jika role punya akses modul tersebut
//   loading            → true selama fetch permissions berlangsung
//
// Contoh penggunaan di komponen:
//   const { isSuperAdmin } = usePermission();
//   {isSuperAdmin && <button>Add Item</button>}
//
//   const { hasPermission } = usePermission();
//   {hasPermission('warehouse') && <button>Add Item</button>}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function usePermission() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading]         = useState(true);

  const isSuperAdmin = session?.user?.role === 'SuperAdmin';

  useEffect(() => {
    if (status === 'loading') return;

    // SuperAdmin tidak perlu fetch — langsung wildcard
    if (isSuperAdmin) {
      setPermissions(['*']);
      setLoading(false);
      return;
    }

    if (!session?.user?.role) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const res  = await fetch('/api/auth/roles');
        const data = await res.json();
        setPermissions(data[session.user.role] || []);
      } catch {
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [session, status, isSuperAdmin]);

  const hasPermission = (moduleId) => {
    if (isSuperAdmin) return true;
    return permissions.includes('*') || permissions.includes(moduleId);
  };

  return {
    isSuperAdmin,
    hasPermission,
    permissions,
    loading,
    userRole: session?.user?.role ?? null,
  };
}
