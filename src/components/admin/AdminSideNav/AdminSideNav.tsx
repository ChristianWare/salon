"use client";

import styles from "./AdminSideNav.module.css";
import Link from "next/link";
// import { usePathname } from "next/navigation";
import Calendar from "@/components/icons/Calendar/Calendar";
import House from "@/components/icons/House/House";
import Employee from "@/components/icons/Employee/Employee";
import Cog from "@/components/icons/Cog/Cog";
import Users from "@/components/icons/Users/Users";
import Report from "@/components/icons/Report/Report";
import Listing from "@/components/icons/Listing/Listing";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/admin", icon: <House /> },
  { title: "Bookings", href: "/admin/bookings", icon: <Calendar /> },
  { title: "Groomers", href: "/admin/groomers", icon: <Employee /> },
  { title: "Services", href: "/admin/services", icon: <Listing /> },
  { title: "Customers", href: "/admin/customers", icon: <Users /> },
  { title: "Reports", href: "/admin/reports", icon: <Report /> },
  { title: "Settings", href: "/admin/settings", icon: <Cog /> },
];

export default function AdminSideNav() {
  return (
    <aside className={styles.container}>
      <nav>
        <ul className={styles.navLinks}>
          {NAV_ITEMS.map(({ title, href, icon }) => {
            return (
              <li key={href}>
                <Link href={href} className={styles.navLink}>
                 {icon}
                  {title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
