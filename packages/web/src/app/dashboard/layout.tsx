'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  // Pass a special prop to MainLayout to indicate this is the dashboard layout
  return (
    <MainLayout isDashboardLayout={true}>
      {children}
    </MainLayout>
  );

  
}
