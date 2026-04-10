'use client';

import { InputHTMLAttributes, forwardRef, useState, useRef, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import styles from './Input.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  showVoiceInput?: boolean;
  onVoiceInput?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, showVoiceInput, onVoiceInput, className, id, ...props }, ref) => {
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          if (recognitionRef.current) {
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              if (onVoiceInput) {
                onVoiceInput(transcript);
              }
              setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
              setIsListening(false);
            };

            recognitionRef.current.onend = () => {
              setIsListening(false);
            };
          }
        }
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      };
    }, [onVoiceInput]);

    const toggleVoiceInput = () => {
      if (!recognitionRef.current) return;

      if (isListening) {
        recognitionRef.current.stop();
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Speech recognition error:', e);
        }
      }
    };

    return (
      <div className={`${styles.container} ${className || ''}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${isListening ? styles.listening : ''}`}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`${styles.input} ${leftIcon ? styles.hasLeftIcon : ''} ${showVoiceInput ? styles.hasVoiceInput : ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {showVoiceInput && (
            <button
              type="button"
              className={`${styles.voiceButton} ${isListening ? styles.active : ''}`}
              onClick={toggleVoiceInput}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className={styles.error} role="alert">
            <AlertCircle size={16} />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
        {isListening && (
          <p className={styles.listeningIndicator}>
            <span className={styles.wave}>
              <span></span>
              <span></span>
              <span></span>
            </span>
            Listening...
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
