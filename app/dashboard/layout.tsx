'use client';

import { usePathname } from 'next/navigation';


export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <div className="flex min-h-screen">
     

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
