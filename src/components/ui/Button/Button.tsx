'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className={styles.spinner} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        ) : icon ? (
          <span className={styles.icon}>{icon}</span>
        ) : null}
        <span className={styles.label}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
