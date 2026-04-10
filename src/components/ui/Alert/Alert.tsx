'use client';

import { ReactNode } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import styles from './Alert.module.css';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
};

export default function Alert({ variant = 'info', title, children, onDismiss, className }: AlertProps) {
  const Icon = icons[variant];

  return (
    <div className={`${styles.alert} ${styles[variant]} ${className || ''}`} role="alert">
      <Icon className={styles.icon} size={24} />
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.message}>{children}</div>
      </div>
      {onDismiss && (
        <button className={styles.dismissButton} onClick={onDismiss} aria-label="Dismiss alert">
          <X size={20} />
        </button>
      )}
    </div>
  );
}
