'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Pill, MessageCircle, Calendar, AlertCircle, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();
  const { state } = useApp();

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/login');
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  if (state.isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  const todayEvents = state.calendarEvents.filter(
    (event) => event.date === format(new Date(), 'yyyy-MM-dd')
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.greeting}>
            {greeting()}, {state.user.name.split(' ')[0]}
          </h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className={styles.heroDecoration}>
          <svg viewBox="0 0 200 200" className={styles.heroSvg}>
            <circle cx="100" cy="100" r="80" fill="oklch(65% 0.12 185 / 0.1)" />
            <circle cx="100" cy="100" r="50" fill="oklch(65% 0.12 185 / 0.15)" />
            <circle cx="100" cy="100" r="25" fill="var(--color-primary)" />
          </svg>
        </div>
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link href="/chatbot" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <MessageCircle size={28} />
            </div>
            <div className={styles.actionContent}>
              <h3>Drug Interaction Check</h3>
              <p>Check for interactions between medications</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>

          <Link href="/chatbot" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <Plus size={28} />
            </div>
            <div className={styles.actionContent}>
              <h3>Add New Medicine</h3>
              <p>Upload prescription or enter manually</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>

          <Link href="/calendar" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <Calendar size={28} />
            </div>
            <div className={styles.actionContent}>
              <h3>View Calendar</h3>
              <p>See your medication schedule</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>

          <Link href="/account" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <Pill size={28} />
            </div>
            <div className={styles.actionContent}>
              <h3>My Medications</h3>
              <p>View and manage your current medications</p>
            </div>
            <ChevronRight size={20} className={styles.actionArrow} />
          </Link>
        </div>
      </section>

      <div className={styles.twoColumn}>
        <section className={styles.todaySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Today&apos;s Medications</h2>
            <Link href="/calendar" className={styles.viewAllLink}>
              View all
            </Link>
          </div>

          {todayEvents.length === 0 ? (
            <Card variant="outlined" className={styles.emptyState}>
              <Pill size={48} className={styles.emptyIcon} />
              <h3>No medications scheduled for today</h3>
              <p>Add medications to see them here</p>
              <Button onClick={() => router.push('/chatbot')}>
                Add Medication
              </Button>
            </Card>
          ) : (
            <div className={styles.eventList}>
              {todayEvents.map((event) => (
                <Card key={event.id} className={styles.eventCard}>
                  <div className={styles.eventTime}>
                    <span className={styles.timeBadge}>{event.time}</span>
                  </div>
                  <div className={styles.eventDetails}>
                    <h4 className={styles.eventName}>{event.medication.name}</h4>
                    <p className={styles.eventDosage}>{event.medication.dosage}</p>
                  </div>
                  <div className={`${styles.eventStatus} ${styles[event.status]}`}>
                    {event.status === 'pending' && <span>Pending</span>}
                    {event.status === 'taken' && <span>Taken</span>}
                    {event.status === 'missed' && <span>Missed</span>}
                    {event.status === 'skipped' && <span>Skipped</span>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className={styles.summarySection}>
          <h2 className={styles.sectionTitle}>Health Summary</h2>
          
          <Card className={styles.summaryCard}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Current Medications</span>
              <span className={styles.summaryValue}>{state.user.currentMedications.length}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Health Conditions</span>
              <span className={styles.summaryValue}>{state.user.currentConditions.length}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Known Allergies</span>
              <span className={styles.summaryValue}>{state.user.allergies.length}</span>
            </div>
          </Card>

          {state.user.allergies.length > 0 && (
            <Card className={styles.allergiesCard}>
              <div className={styles.allergiesHeader}>
                <AlertCircle size={20} className={styles.allergyIcon} />
                <h3>Allergies</h3>
              </div>
              <ul className={styles.allergyList}>
                {state.user.allergies.map((allergy, index) => (
                  <li key={index}>{allergy}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className={styles.conditionsCard}>
            <h3>Current Conditions</h3>
            {state.user.currentConditions.length === 0 ? (
              <p className={styles.noData}>No conditions listed</p>
            ) : (
              <ul className={styles.conditionList}>
                {state.user.currentConditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
