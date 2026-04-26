'use client';
import Link from 'next/link';
import { Package, ShoppingCart, Bell, Settings, LayoutDashboard, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useStore, UserRole } from '@/store/useStore';

export default function TopNav() {
  const pathname = usePathname();
  const { alerts, userRole, setUserRole, activeUserId } = useStore();
  const unreadCount = alerts.filter(a => !a.read && (!a.recipientIds || a.recipientIds.includes(activeUserId))).length;

  // Don't show topnav on POS page, as it has its own header
  if (pathname === '/pos') return null;

  return (
    <header className="flex flex-col md:flex-row items-center justify-between mb-12 bg-white/50 p-4 rounded-3xl backdrop-blur-md shadow-sm border border-black/5">
      
      {/* Left - Navigation Links */}
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-sm transition-all ${pathname === '/dashboard' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:bg-white/50'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </Link>
        <Link 
          href="/inventory" 
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-sm transition-all ${pathname === '/inventory' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:bg-white/50'}`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory</span>
        </Link>
        <Link 
          href="/orders" 
          className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-sm transition-all ${pathname === '/orders' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:bg-white/50'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{userRole === 'Retailer' ? 'Orders' : 'Orders Received'}</span>
        </Link>
        <Link 
          href="/partners" 
          className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-sm transition-all ${pathname === '/partners' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:bg-white/50'}`}
        >
          <Users className="w-4 h-4" />
          <span>{userRole === 'Manufacturer' ? 'Subscribers' : 'Find Partners'}</span>
        </Link>
      </div>

      {/* Center - Branding */}
      <div className="flex flex-col items-center justify-center text-center px-4 mb-4 md:mb-0">
        <h1 className="text-xl font-sans font-bold text-[#1F2937]">KiranaPulse</h1>
        <div className="text-[10px] text-gray-400 font-sans tracking-widest uppercase mt-0.5">{userRole} WORKSPACE</div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        

        <Link 
          href="/alerts" 
          className="relative w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-signal-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
        
        <Link 
          href="/settings" 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </Link>

        {userRole === 'Retailer' && (
          <Link 
            href="/pos" 
            className="flex items-center gap-2 bg-[#151515] text-white px-6 py-2.5 rounded-2xl font-sans font-bold text-sm hover:bg-black transition-colors ml-2 shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            Billing (POS)
          </Link>
        )}
      </div>
      
    </header>
  );
}
