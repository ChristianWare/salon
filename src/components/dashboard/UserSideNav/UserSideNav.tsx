"use client";

import styles from "./UserSideNav.module.css";
import Link from "next/link";
import Calendar from "@/components/icons/Calendar/Calendar";
import House from "@/components/icons/House/House";
import Cog from "@/components/icons/Cog/Cog";
import Users from "@/components/icons/Users/Users";
import Report from "@/components/icons/Report/Report";
import Listing from "@/components/icons/Listing/Listing";
import UserButton from "@/components/dashboard/UserButton/UserButton";
import Button from "@/components/shared/Button/Button";
import { useState } from "react";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import { useSession } from "next-auth/react";


const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: <House /> },
  { title: "Book Appointment", href: "/booking", icon: <Calendar /> },
  { title: "My Bookings", href: "/dashboard/my-bookings", icon: <Listing /> }, // or anchor within /dashboard
  { title: "Profile", href: "/dashboard/profile", icon: <Users /> },
  { title: "Settings", href: "/dashboard/settings", icon: <Cog /> },
  {
    title: "Billing & Receipts",
    href: "/dashboard/billing-and-receipts",
    icon: <Report />,
  }, // if you have this route
];

export default function UserSideNav() {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => {
    setIsOpen((o) => !o);
  };

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const isGroomer = !!session?.user?.isGroomer;

  return (
    <aside className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.hamburgerContainer}>
          <button
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            className={
              isOpen ? `${styles.hamburger} ${styles.active}` : styles.hamburger
            }
            onClick={openMenu}
            type='button'
          >
            <span className={styles.whiteBar} />
            <span className={styles.whiteBar} />
            <span className={styles.whiteBar} />
          </button>
        </div>

        {/* overlay */}
        {isOpen && (
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
        )}

        <ul
          className={
            isOpen ? `${styles.navLinks} ${styles.open}` : styles.navLinks
          }
        >
          <div className={styles.closeWrapper}>
            <FalseButton
              text='Close'
              btnType='blue'
              onClick={() => setIsOpen(false)}
            />
          </div>

          <div className={styles.linksWrapper}>
            {NAV_ITEMS.map(({ title, href, icon }) => (
              <li key={title}>
                <Link
                  href={href}
                  className={styles.navLink}
                  onClick={() => setIsOpen(false)}
                >
                  {icon}
                  {title}
                </Link>
              </li>
            ))}
          </div>

          <div className={styles.btnContainerii}>
            <UserButton />
            <Button btnType='blue' text='Go Home' href='/' />
            {isAdmin && (
              <Button
                btnType='blueOutline'
                text='Admin Dashboard'
                href='/admin'
              />
            )}
            {isGroomer && (
              <Button
                btnType='orangeOutline'
                text='Groomer Dashboard'
                href='/groomer'
              />
            )}
          </div>
        </ul>

        <div className={styles.btnContainer}>
          <UserButton />
          <Button btnType='blue' text='Go Home' href='/' />
          {isAdmin && (
            <Button
              btnType='blueOutline'
              text='Admin Dashboard'
              href='/admin'
            />
          )}
          {isGroomer && (
            <Button
              btnType='orangeOutline'
              text='Groomer Dashboard'
              href='/groomer'
            />
          )}
        </div>
      </nav>
    </aside>
  );
}
