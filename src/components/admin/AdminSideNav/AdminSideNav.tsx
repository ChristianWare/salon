'use client';

// import styles from './AdminSideNav.module.css'
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  Tag,
//   PresentationChartLine,
  Settings,
  ClipboardList,
} from "lucide-react";
import Link from 'next/link';

const NAV_ITEMS = [
  { title: "Dashboard", href: "/admin", icon: Home },
  { title: "Bookings", href: "/admin/bookings", icon: Calendar },
  { title: "Groomers", href: "/admin/groomers", icon: Users },
  { title: "Services", href: "/admin/services", icon: Tag },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Coupons", href: "/admin/coupons", icon: Tag },
  { title: "Reports", href: "/admin/reports", icon: Tag },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Audit Log", href: "/admin/audit", icon: ClipboardList },
];


export default function AdminSideNav() {
      const pathname = usePathname();

  return (
    <aside className='w-60 h-screen bg-white border-r'>
      <div className='px-6 py-4 text-2xl font-bold'>Admin</div>
      <nav className='px-4'>
        <ul>
          {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center px-4 py-2 my-1 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className='w-5 h-5 mr-3' />
                  <span>{title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}