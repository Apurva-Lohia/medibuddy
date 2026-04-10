'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import Alert from '@/components/ui/Alert/Alert';
import styles from './page.module.css';

export default function Login() {
  const router = useRouter();
  const { state, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/');
    }
  }, [state.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const success = await login(email, password);
    
    if (success) {
      router.push('/');
    } else {
      setError('Invalid email or password. If you haven\'t signed up yet, please create an account.');
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg className={styles.logoIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="currentColor"/>
              <path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM20 12C24.418 12 28 15.582 28 20C28 24.418 24.418 28 20 28C15.582 28 12 24.418 12 20C12 15.582 15.582 12 20 12ZM20 14L20 20L24.5 22.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="20" r="2" fill="white"/>
            </svg>
            <span className={styles.logoText}>MediCare</span>
          </div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to your health dashboard</p>
        </div>

        {error && (
          <Alert variant="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={20} />}
            autoComplete="email"
          />

          <div className={styles.passwordField}>
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button type="submit" size="lg" loading={loading} className={styles.submitButton}>
            Sign In
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={styles.link}>
              Create one here
            </Link>
          </p>
        </div>
      </div>

      <div className={styles.decoration}>
        <svg viewBox="0 0 400 400" className={styles.decorativeSvg}>
          <circle cx="200" cy="200" r="180" fill="oklch(65% 0.12 185 / 0.05)" />
          <circle cx="200" cy="200" r="120" fill="oklch(65% 0.12 185 / 0.08)" />
          <circle cx="200" cy="200" r="60" fill="var(--color-primary)" />
        </svg>
      </div>
    </div>
  );
}
