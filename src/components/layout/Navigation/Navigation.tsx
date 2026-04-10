'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Calendar, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import styles from './Navigation.module.css';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chatbot', label: 'Chatbot', icon: MessageCircle },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/account', label: 'Account', icon: User },
];

export default function Navigation() {
  const pathname = usePathname();
  const { state, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!state.isAuthenticated) return null;

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="currentColor"/>
            <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM20 12C24.418 12 28 15.582 28 20C28 24.418 24.418 28 20 28C15.582 28 12 24.418 12 20C12 15.582 15.582 12 20 12ZM20 14L20 20L24.5 22.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="20" r="2" fill="white"/>
          </svg>
          <span className={styles.logoText}>MediLoop</span>
        </Link>

        <div className={styles.desktopNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={logout} className={styles.logoutButton}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileNavItem} ${isActive ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            className={styles.mobileNavItem}
          >
            <LogOut size={24} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
