'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Star, Users, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Builders',
    href: '/admin/builders',
    icon: Building2,
  },
  {
    name: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        
        const data = await response.json();
        if (data.user.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        setUser(data.user);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-800 transition-colors',
                pathname === item.href && 'bg-gray-800'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
