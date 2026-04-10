'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Link as LinkIcon, Check, X, Clock, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import { CalendarView, ExternalCalendar } from '@/types';
import styles from './page.module.css';

export default function Calendar() {
  const router = useRouter();
  const { state, updateCalendarEvent, connectCalendar, disconnectCalendar } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const [showSyncModal, setShowSyncModal] = useState(false);

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/login');
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  if (state.isLoading || !state.isAuthenticated) {
    return null;
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return state.calendarEvents.filter(event => event.date === format(date, 'yyyy-MM-dd'));
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleStatusChange = (eventId: string, status: 'taken' | 'missed' | 'skipped') => {
    const event = state.calendarEvents.find(e => e.id === eventId);
    if (event) {
      updateCalendarEvent({ ...event, status });
    }
  };

  const handleConnectCalendar = async (provider: ExternalCalendar['provider']) => {
    await connectCalendar(provider);
    setShowSyncModal(false);
  };

  const timeOrder = { morning: 0, afternoon: 1, evening: 2, night: 3 };

  return (
    <div className={styles.container}>
      <div className={styles.calendarSection}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthNavigation}>
            <button onClick={handlePrevMonth} className={styles.navButton}>
              <ChevronLeft size={24} />
            </button>
            <h2 className={styles.monthTitle}>
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={handleNextMonth} className={styles.navButton}>
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button onClick={() => router.push('/chatbot')}>
              <Plus size={20} />
              Add Medicine
            </Button>
            <Button variant="secondary" onClick={() => setShowSyncModal(true)}>
              <LinkIcon size={20} />
              Sync Calendar
            </Button>
          </div>
        </div>

        <Card className={styles.calendarCard}>
          <div className={styles.calendarGrid}>
            <div className={styles.weekdays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={styles.weekday}>{day}</div>
              ))}
            </div>
            
            <div className={styles.days}>
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={index}
                    className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonth : ''} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <span className={styles.dayNumber}>{format(day, 'd')}</span>
                    {dayEvents.length > 0 && (
                      <div className={styles.eventDots}>
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <span
                            key={i}
                            className={`${styles.eventDot} ${styles[event.status]}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.pending}`} />
            <span>Pending</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.taken}`} />
            <span>Taken</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.missed}`} />
            <span>Missed</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.skipped}`} />
            <span>Skipped</span>
          </div>
        </div>
      </div>

      <div className={styles.detailSection}>
        {selectedDate ? (
          <>
            <div className={styles.detailHeader}>
              <h3>{format(selectedDate, 'EEEE, MMMM d')}</h3>
              <span className={styles.eventCount}>
                {getEventsForDate(selectedDate).length} medications
              </span>
            </div>

            <div className={styles.eventList}>
              {getEventsForDate(selectedDate).length === 0 ? (
                <div className={styles.noEvents}>
                  <CalendarIcon size={48} />
                  <p>No medications scheduled for this day</p>
                  <Button variant="secondary" onClick={() => router.push('/chatbot')}>
                    Add Medication
                  </Button>
                </div>
              ) : (
                getEventsForDate(selectedDate)
                  .sort((a, b) => timeOrder[a.time] - timeOrder[b.time])
                  .map(event => (
                    <Card key={event.id} className={`${styles.eventCard} ${styles[event.status]}`}>
                      <div className={styles.eventTime}>
                        <Clock size={16} />
                        <span className={styles.timeLabel}>{event.time}</span>
                      </div>
                      
                      <div className={styles.eventInfo}>
                        <h4>{event.medication.name}</h4>
                        <p>{event.medication.dosage}</p>
                        {event.medication.instructions && (
                          <span className={styles.instructions}>{event.medication.instructions}</span>
                        )}
                      </div>
                      
                      <div className={styles.eventActions}>
                        {event.status === 'pending' && (
                          <>
                            <button
                              className={`${styles.actionButton} ${styles.taken}`}
                              onClick={() => handleStatusChange(event.id, 'taken')}
                              title="Mark as taken"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.skipped}`}
                              onClick={() => handleStatusChange(event.id, 'skipped')}
                              title="Skip this dose"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {event.status === 'taken' && (
                          <span className={styles.statusBadge}>
                            <Check size={14} />
                            Taken
                          </span>
                        )}
                        {event.status === 'skipped' && (
                          <span className={`${styles.statusBadge} ${styles.skippedBadge}`}>
                            <X size={14} />
                            Skipped
                          </span>
                        )}
                        {event.status === 'missed' && (
                          <span className={`${styles.statusBadge} ${styles.missedBadge}`}>
                            Missed
                          </span>
                        )}
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </>
        ) : (
          <div className={styles.noSelection}>
            <CalendarIcon size={64} />
            <h3>Select a day</h3>
            <p>Click on a date to view medication details</p>
          </div>
        )}

        {state.externalCalendars.filter(c => c.connected).length > 0 && (
          <div className={styles.connectedCalendars}>
            <h4>Connected Calendars</h4>
            <ul>
              {state.externalCalendars.filter(c => c.connected).map(cal => (
                <li key={cal.provider}>
                  <span className={styles.calendarProvider}>{cal.provider}</span>
                  <span className={styles.lastSync}>
                    Last synced: {cal.lastSync ? format(new Date(cal.lastSync), 'MMM d, h:mm a') : 'Never'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showSyncModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSyncModal(false)}>
          <Card className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Sync External Calendar</h3>
              <button onClick={() => setShowSyncModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <p>Connect your calendar app to sync medication reminders</p>
              
              <div className={styles.calendarOptions}>
                <button
                  className={styles.calendarOption}
                  onClick={() => handleConnectCalendar('google')}
                  disabled={state.externalCalendars.some(c => c.provider === 'google' && c.connected)}
                >
                  <svg viewBox="0 0 24 24" className={styles.calendarIcon}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google Calendar</span>
                  {state.externalCalendars.some(c => c.provider === 'google' && c.connected) && <Check size={18} />}
                </button>

                <button
                  className={styles.calendarOption}
                  onClick={() => handleConnectCalendar('apple')}
                  disabled={state.externalCalendars.some(c => c.provider === 'apple' && c.connected)}
                >
                  <svg viewBox="0 0 24 24" className={styles.calendarIcon}>
                    <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span>Apple Calendar (iCal)</span>
                  {state.externalCalendars.some(c => c.provider === 'apple' && c.connected) && <Check size={18} />}
                </button>

                <button
                  className={styles.calendarOption}
                  onClick={() => handleConnectCalendar('outlook')}
                  disabled={state.externalCalendars.some(c => c.provider === 'outlook' && c.connected)}
                >
                  <svg viewBox="0 0 24 24" className={styles.calendarIcon}>
                    <path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.52-.22-.34-.31-.74-.1-.42-.1-.87t.1-.87q.1-.42.32-.75.22-.33.57-.53.35-.2.85-.2t.87.2q.33.22.55.53.22.34.31.75.1.42.1 .87zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18h-2V9q0-.46.33-.8.33-.33.8-.33h13.75q.46 0 .8.33.32.33.32.8v3zM7.13 15.24V9q0-.46.33-.8.32-.33.8-.33h13.75q.46 0 .8.33.33.33.33.8v6.24H7.13zM1 6.75q0 .46-.33.8-.32.32-.8.32H.5V3.25h5.12q.46 0 .8.33.32.33.32.8v2.37H1z"/>
                  </svg>
                  <span>Microsoft Outlook</span>
                  {state.externalCalendars.some(c => c.provider === 'outlook' && c.connected) && <Check size={18} />}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
