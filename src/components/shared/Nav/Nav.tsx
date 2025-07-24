"use client";

import Link from "next/link";
import styles from "./Nav.module.css";
import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import { MouseEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const navItems = [
  { text: "Home", href: "/" },
  { text: "About", href: "/about" },
  { text: "Work", href: "/work" },
  { text: "Services", href: "/services" },
  { text: "Contact", href: "/contact" },
];

interface Props {
  color?: string;
  hamburgerColor?: string;
}

export default function Nav({ color = "", hamburgerColor = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
    const { data: session, status } = useSession();


  useEffect(() => {
    const body = document.body;
    body.style.overflow =
      window.innerWidth <= 910 && isOpen ? "hidden" : "auto";

    const handleResize = () => setIsOpen(false);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      body.style.overflow = "auto";
    };
  }, [isOpen]);

  const openMenu = () => {
    setIsOpen(!isOpen);
  };

  const router = useRouter();

  const handleAccountClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    if (status === "loading") return; // optional: ignore until known
    router.push(session ? "/dashboard" : "/login");
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <Logo backgroundColor='backgroundColorWhite' direction='center' />
        </div>

        <div
          className={
            isOpen === false
              ? styles.navItems
              : `${styles.navItems} ${styles.active}`
          }
          onClick={openMenu}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${styles[color]}`}
            >
              {item.text}
            </Link>
          ))}

          <Link
            href={session ? "/dashboard" : "/login"}
            onClick={handleAccountClick}
            className={`${styles.navItem} ${styles[color]}`}
            prefetch={false} // avoid preloading /dashboard HTML when logged out
          >
            My Account
          </Link>
          <div className={styles.btnContainerii}>
            <Button
              href='/contact'
              text='Book a call with Chris'
              btnType='noBackgroundBlueText'
              image
            />
          </div>
        </div>

        <div className={styles.btnContainer}>
          <Button
            href='/contact'
            text='Book a call with Chris'
            btnType='noBackgroundBlueText'
            image
          />
        </div>

        <span
          className={
            isOpen === false
              ? styles.hamburger
              : `${styles.hamburger} ${styles.active}`
          }
          onClick={openMenu}
        >
          <span
            className={`${styles.whiteBar} ${styles[hamburgerColor]}`}
          ></span>
          <span
            className={`${styles.whiteBar} ${styles[hamburgerColor]}`}
          ></span>
          <span
            className={`${styles.whiteBar} ${styles[hamburgerColor]}`}
          ></span>
        </span>
      </nav>
    </header>
  );
}
