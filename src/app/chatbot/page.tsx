'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Send, Plus, Check, AlertTriangle, XCircle, Pill, Mic, MicOff, Camera, X, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import Alert from '@/components/ui/Alert/Alert';
import { checkDrugInteractions, searchDrugs, findDrug, drugDatabase, findExtendedDrug, analyzeScheduleInteractions, getFoodInteractions, FoodInteraction, ScheduleEntry, foodCategories } from '@/lib/drugDatabase';
import { Medication, DrugInteraction } from '@/types';
import Tesseract from 'tesseract.js';
import styles from './page.module.css';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface LocalMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  timestamp: string;
  text?: string;
  drugs?: string[];
  interactionResult?: {
    safe: boolean;
    interactions: DrugInteraction[];
    allergyAlerts: string[];
  };
}

function MessageBubble({ message }: { message: LocalMessage }) {
  const isBot = message.role === 'bot';
  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.messageBubble}>
        {isBot && <div className={styles.botLabel}>MediBuddy AI</div>}
        {message.text && <p className={styles.messageText}>{message.text}</p>}
        {message.interactionResult && (
          <div className={styles.interactionResults}>
            {message.interactionResult.allergyAlerts.map((alert, i) => (
              <div key={i} className={styles.allergyAlert}>
                <AlertTriangle size={18} />
                <p>{alert}</p>
              </div>
            ))}
            {message.interactionResult.safe
              && message.interactionResult.interactions.length === 0
              && message.interactionResult.allergyAlerts.length === 0 && (
              <div className={styles.safeCard}>
                <ShieldCheck size={22} color="var(--color-success)" />
                <div>
                  <p className={styles.safeTitle}>All Clear</p>
                  <p className={styles.safeDesc}>No significant interactions or allergy concerns found.</p>
                </div>
              </div>
            )}
            {message.interactionResult.interactions.map((int, i) => (
              <div key={i} className={`${styles.interactionCard} ${styles[int.severity]}`}>
                <div className={styles.interactionCardHeader}>
                  {int.severity === 'danger' ? <XCircle size={20} /> : <AlertTriangle size={20} />}
                  <span className={styles.severityLabel}>{int.severity === 'danger' ? 'Do Not Combine' : 'Use With Caution'}</span>
                  <span className={styles.drugPair}>{int.drug1} + {int.drug2}</span>
                </div>
                <div className={styles.interactionCardBody}>
                  <p className={styles.interactionDesc}>{int.description}</p>
                  <div className={styles.recommendationBox}><strong>What to do: </strong>{int.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {message.drugs && message.drugs.length > 0 && (
          <div className={styles.drugChips}>
            {message.drugs.map((drug, i) => <span key={i} className={styles.drugChip}>{drug}</span>)}
          </div>
        )}
        <span className={styles.timestamp}>{format(new Date(message.timestamp), 'h:mm a')}</span>
      </div>
    </div>
  );
}

interface ScheduleBuilderProps {
  weeklySchedule: ScheduleEntry[];
  setWeeklySchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  selectedDayForDrug: string;
  setSelectedDayForDrug: (day: string) => void;
  scheduleDrugInput: string;
  setScheduleDrugInput: (value: string) => void;
  scheduleDrugSuggestions: { name: string; category: string; aliases: string }[];
  setScheduleDrugSuggestions: (suggestions: { name: string; category: string; aliases: string }[]) => void;
  selectedFoods: { [drugName: string]: string[] };
  setSelectedFoods: React.Dispatch<React.SetStateAction<{ [drugName: string]: string[] }>>;
  onAnalyze: () => void;
}

function ScheduleBuilder({
  weeklySchedule,
  setWeeklySchedule,
  selectedDayForDrug,
  setSelectedDayForDrug,
  scheduleDrugInput,
  setScheduleDrugInput,
  scheduleDrugSuggestions,
  setScheduleDrugSuggestions,
  selectedFoods,
  setSelectedFoods,
  onAnalyze,
}: ScheduleBuilderProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const handleDrugSearch = (value: string) => {
    setScheduleDrugInput(value);
    if (value.length > 2) {
      const suggestions = searchDrugs(value);
      setScheduleDrugSuggestions(suggestions.slice(0, 5).map(d => ({
        name: d.name,
        category: d.category,
        aliases: d.aliases.length > 0 ? `aka ${d.aliases[0]}` : ''
      })));
    } else {
      setScheduleDrugSuggestions([]);
    }
  };

  const addDrugToDay = (drugName: string) => {
    setWeeklySchedule(prev => prev.map(day => {
      if (day.day === selectedDayForDrug) {
        if (!day.drugs.some(d => d.name === drugName)) {
          return { ...day, drugs: [...day.drugs, { name: drugName, dosage: 'As directed', times: ['morning'], withFood: '' }] };
        }
      }
      return day;
    }));
    setScheduleDrugInput('');
    setScheduleDrugSuggestions([]);
  };

  const removeDrugFromDay = (day: string, drugName: string) => {
    setWeeklySchedule(prev => prev.map(d => {
      if (d.day === day) {
        return { ...d, drugs: d.drugs.filter(drug => drug.name !== drugName) };
      }
      return d;
    }));
  };

  const hasAnyDrugs = weeklySchedule.some(day => day.drugs.length > 0);

  return (
    <Card className={styles.scheduleBuilder}>
      <div className={styles.scheduleHeader}>
        <h3>Weekly Medication Schedule</h3>
        <p>Build your weekly schedule to check interactions across days</p>
      </div>
      
      <div className={styles.scheduleGrid}>
        {days.map(day => {
          const dayData = weeklySchedule.find(d => d.day === day);
          return (
            <div key={day} className={`${styles.scheduleDay} ${day === selectedDayForDrug ? styles.selectedDay : ''}`}>
              <button 
                className={styles.dayHeader}
                onClick={() => setSelectedDayForDrug(day)}
              >
                {day}
                {dayData && dayData.drugs.length > 0 && (
                  <span className={styles.drugCount}>{dayData.drugs.length}</span>
                )}
              </button>
              <div className={styles.dayDrugs}>
                {dayData?.drugs.map((drug, i) => (
                  <div key={i} className={styles.dayDrugChip}>
                    <span>{drug.name}</span>
                    <button onClick={() => removeDrugFromDay(day, drug.name)}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.scheduleInput}>
        <div className={styles.daySelector}>
          <label>Add to:</label>
          <select value={selectedDayForDrug} onChange={(e) => setSelectedDayForDrug(e.target.value)}>
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        <div className={styles.drugSearchWrapper}>
          <input
            type="text"
            value={scheduleDrugInput}
            onChange={(e) => handleDrugSearch(e.target.value)}
            placeholder="Type medication name..."
            className={styles.drugSearchInput}
          />
          {scheduleDrugSuggestions.length > 0 && (
            <ul className={styles.drugSearchSuggestions}>
              {scheduleDrugSuggestions.map((drug, i) => (
                <li key={i} onClick={() => addDrugToDay(drug.name)}>
                  <strong>{drug.name}</strong>
                  <span>{drug.category}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button 
          onClick={() => addDrugToDay(scheduleDrugInput)} 
          disabled={!scheduleDrugInput.trim()}
        >
          <Plus size={18} />Add
        </Button>
      </div>

      {hasAnyDrugs && (
        <div className={styles.scheduleAnalyze}>
          <Button onClick={onAnalyze} variant="primary" size="lg">
            <ShieldCheck size={20} />Analyze Weekly Schedule
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function Chatbot() {
  const router = useRouter();
  const { state, addMedication, generateCalendarEvents } = useApp();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [extractedDrugs, setExtractedDrugs] = useState<string[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [showAddConfirmation, setShowAddConfirmation] = useState<{ name: string; dosage: string }[] | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
  const [showMedicationPanel, setShowMedicationPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [drugSuggestions, setDrugSuggestions] = useState<{ name: string; category: string; aliases: string }[]>([]);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  // Weekly schedule builder state
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleEntry[]>([
    { day: 'Monday', drugs: [] },
    { day: 'Tuesday', drugs: [] },
    { day: 'Wednesday', drugs: [] },
    { day: 'Thursday', drugs: [] },
    { day: 'Friday', drugs: [] },
    { day: 'Saturday', drugs: [] },
    { day: 'Sunday', drugs: [] },
  ]);
  const [selectedDayForDrug, setSelectedDayForDrug] = useState<string>('Monday');
  const [scheduleDrugInput, setScheduleDrugInput] = useState('');
  const [scheduleDrugSuggestions, setScheduleDrugSuggestions] = useState<{ name: string; category: string; aliases: string }[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<{ [drugName: string]: string[] }>({});

  const addMsg = (msg: Omit<LocalMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: uuidv4(), timestamp: new Date().toISOString() }]);
  };

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) router.push('/login');
  }, [state.isLoading, state.isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (e: any) => {
      setInputValue(prev => prev ? `${prev} ${e.results[0][0].transcript}` : e.results[0][0].transcript);
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); return; }
    try { recognitionRef.current.start(); setIsListening(true); } catch (e) { console.error(e); }
  };

  const handleSearch = (value: string) => {
    setInputValue(value);
    if (value.length > 2) {
      const suggestions = searchDrugs(value);
      setDrugSuggestions(suggestions.slice(0, 5).map(d => ({
        name: d.name,
        category: d.category,
        aliases: d.aliases.length > 0 ? `aka ${d.aliases[0]}` : ''
      })));
    } else {
      setDrugSuggestions([]);
    }
  };

  const extractDrugsFromText = (text: string): string[] => {
    const foundDrugs: Set<string> = new Set();
    const normalizedText = text.toLowerCase();
    
    drugDatabase.forEach(drug => {
      if (normalizedText.includes(drug.name.toLowerCase())) {
        foundDrugs.add(drug.name);
      }
      drug.aliases.forEach(alias => {
        if (normalizedText.includes(alias.toLowerCase())) {
          foundDrugs.add(drug.name);
        }
      });
    });
    
    return Array.from(foundDrugs);
  };

  const renderPdfPageToCanvas = async (file: File, pageNum: number, scale: number = 2): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    } as any).promise;
    
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setOcrProgress(prev => Math.min(prev + Math.round(m.progress * 30), 90));
        }
      },
    });
    return result.data.text;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      addMsg({ role: 'bot', text: 'Sorry, I can only read image files (JPEG, PNG, GIF, WebP) or PDF documents.' });
      return;
    }

    setIsProcessingOCR(true);
    setOcrProgress(0);
    addMsg({ role: 'user', text: `Uploading prescription: ${file.name}` });

    const isPdf = file.type === 'application/pdf';
    let imageUrl: string | null = null;

    try {
      let extractedText = '';

      if (isPdf) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        imageUrl = URL.createObjectURL(file);
        setUploadedImageUrl(imageUrl);
        
        addMsg({ role: 'bot', text: `Processing ${numPages} page${numPages > 1 ? 's' : ''}...` });

        for (let i = 1; i <= numPages; i++) {
          setOcrProgress(Math.round((i / numPages) * 30));
          const pageImage = await renderPdfPageToCanvas(file, i);
          const pageText = await extractTextFromImage(pageImage);
          extractedText += pageText + '\n';
        }
      } else {
        imageUrl = URL.createObjectURL(file);
        setUploadedImageUrl(imageUrl);
        
        const result = await Tesseract.recognize(imageUrl, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 90));
            }
          },
        });
        extractedText = result.data.text;
      }

      const foundDrugs = extractDrugsFromText(extractedText);

      if (foundDrugs.length > 0) {
        setExtractedDrugs(foundDrugs);
        setSelectedDrugs(foundDrugs);
        addMsg({ role: 'bot', text: `I've extracted the following medications from your prescription. Please confirm which ones to check:`, drugs: foundDrugs });
      } else {
        addMsg({ role: 'bot', text: `I scanned your prescription but couldn't find any recognized medications. The image may be unclear, or the text may not match our database. You can also type medication names manually above.` });
      }
    } catch (err) {
      console.error('OCR Error:', err);
      addMsg({ role: 'bot', text: 'Sorry, I had trouble processing that file. Please try a clearer image or type the medication names manually.' });
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setUploadedImageUrl(null);
    }
  };

  const toggleDrugSelection = (drug: string) => {
    setSelectedDrugs(prev => prev.includes(drug) ? prev.filter(d => d !== drug) : [...prev, drug]);
  };

  const confirmExtractedDrugs = () => {
    if (selectedDrugs.length > 0) checkInteractions(selectedDrugs);
    setExtractedDrugs([]); setSelectedDrugs([]);
  };

  const checkInteractions = async (drugs: string[]) => {
    if (drugs.length === 0) {
      addMsg({ role: 'bot', text: 'Please enter at least one medication name.' });
      return;
    }

    const resolvedDrugs = [...drugs];

    addMsg({ role: 'user', text: `Check interactions for: ${resolvedDrugs.join(', ')}` });
    addMsg({ role: 'bot', text: `Let me check these medications against our database...` });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const existingMeds = state.user?.currentMedications.map(m => m.name) || [];
    const allDrugs = [...existingMeds, ...resolvedDrugs];
    const result = checkDrugInteractions(allDrugs, state.user?.allergies || []);

    const knownDrugs = resolvedDrugs.filter(d => findDrug(d));
    const hasExistingMeds = existingMeds.length > 0;
    let responseText = '';

    if (result.drugNotFound.length > 0) {
      responseText += `I couldn't find these medications in my database: ${result.drugNotFound.join(', ')}\n\n`;
      responseText += `Please ask your doctor or pharmacist about these medicines for personalized advice.\n\n`;
    }

    if (result.allergyAlerts.length > 0) {
      responseText += `IMPORTANT: ALLERGY WARNING!\n\n`;
      result.allergyAlerts.forEach(alert => {
        responseText += `${alert.replace(/\*\*/g, '')}\n\n`;
      });
    }

    const dangerInteractions = result.interactions.filter(i => i.severity === 'danger');
    const cautionInteractions = result.interactions.filter(i => i.severity === 'caution');

    if (dangerInteractions.length > 0) {
      let checkContext = '';
      if (knownDrugs.length > 0 && hasExistingMeds) {
        checkContext = ` (including interactions between the new medications and your current medications)`;
      }
      responseText += `STOP! These medications should NOT be taken together${checkContext}:\n\n`;
      dangerInteractions.forEach(interaction => {
        responseText += `${interaction.drug1} + ${interaction.drug2}\n`;
        responseText += `Why: ${interaction.description}\n`;
        responseText += `What to do: ${interaction.recommendation}\n\n`;
      });
      responseText += `Please talk to your doctor or pharmacist before taking these together!\n\n`;
    }

    if (cautionInteractions.length > 0) {
      let checkContext = '';
      if (knownDrugs.length > 0 && hasExistingMeds) {
        checkContext = ` (including interactions between the new medications and your current medications)`;
      }
      responseText += `CAUTION - Be careful with these together${checkContext}:\n\n`;
      cautionInteractions.forEach(interaction => {
        responseText += `${interaction.drug1} + ${interaction.drug2}\n`;
        responseText += `What to know: ${interaction.description}\n`;
        responseText += `What to do: ${interaction.recommendation}\n\n`;
      });
    }

    const safe = dangerInteractions.length === 0 && cautionInteractions.length === 0 && result.allergyAlerts.length === 0;

    if (safe) {
      if (knownDrugs.length > 0) {
        let checkSummary = `I've checked the new medications (${knownDrugs.join(', ')})`;
        if (hasExistingMeds) {
          checkSummary += ` against each other AND against your current medications (${existingMeds.join(', ')})`;
        }
        checkSummary += `.\n\n`;
        responseText = `Good news! ${checkSummary}I didn't find any major interactions or allergy concerns.\n\n`;
        responseText += `Would you like me to add these medications to your profile so we can track them?`;
        const medsToConfirm = knownDrugs.map(d => ({
          name: d,
          dosage: 'As prescribed',
        }));
        setShowAddConfirmation(medsToConfirm);
        setSelectedToAdd(medsToConfirm.map((_, i) => i));
      } else {
        responseText = `I checked the medications you mentioned but couldn't find them in my database.\n\n`;
        responseText += `For safety, please ask your doctor or pharmacist to review your medications.`;
      }
    }

    addMsg({
      role: 'bot',
      text: safe && knownDrugs.length > 0 ? responseText : undefined,
      drugs: resolvedDrugs,
      interactionResult: {
        safe,
        interactions: result.interactions,
        allergyAlerts: result.allergyAlerts,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const drugs = inputValue.split(/[,\n]+/).map(d => d.trim()).filter(d => d.length > 0);
    checkInteractions(drugs);
    setInputValue('');
    setDrugSuggestions([]);
  };

  const addToProfile = () => {
    if (!showAddConfirmation || showAddConfirmation.length === 0) return;
    
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const addedNames: string[] = [];
    
    showAddConfirmation.forEach(med => {
      const newMed: Medication = {
        id: uuidv4(),
        name: med.name,
        dosage: med.dosage,
        frequency: 'daily',
        times: ['morning'],
        startDate: new Date().toISOString(),
      };
      addMedication(newMed);
      generateCalendarEvents(newMed, new Date(), endDate);
      addedNames.push(med.name);
    });
    
    const message = addedNames.length === 1 
      ? `Done! ${addedNames[0]} has been added to your medications and calendar.`
      : `Done! ${addedNames.join(', ')} have been added to your medications and calendar.`;
    addMsg({ role: 'bot', text: message });
    setShowAddConfirmation(null);
  };

  const analyzeSchedule = () => {
    const analysis = analyzeScheduleInteractions(weeklySchedule);
    
    addMsg({ role: 'user', text: `Analyze weekly schedule for interactions` });
    addMsg({ role: 'bot', text: `Analyzing your weekly medication schedule across all days and considering drug half-lives...` });

    const allDrugs = weeklySchedule.flatMap(d => d.drugs.map(drug => drug.name));
    const existingMeds = state.user?.currentMedications.map(m => m.name) || [];
    const allDrugsWithExisting = [...new Set([...existingMeds, ...allDrugs])];
    
    const existingInteractionResult = checkDrugInteractions(allDrugsWithExisting, state.user?.allergies || []);
    
    let responseText = '';
    
    // Food interactions
    if (analysis.foodInteractions.length > 0) {
      responseText += '**FOOD INTERACTIONS:**\n\n';
      analysis.foodInteractions.forEach(({ drug, interactions }) => {
        responseText += `${drug}:\n`;
        interactions.forEach(fi => {
          const effectIcon = fi.effect === 'danger' || fi.effect === 'block' ? '🚫' : 
                            fi.effect === 'increase' ? '⚠️' : '📉';
          responseText += `  ${effectIcon} ${fi.food}: ${fi.description}\n`;
          responseText += `     ${fi.recommendation}\n\n`;
        });
      });
      responseText += '\n';
    }
    
    // Half-life warnings
    if (analysis.halfLifeWarnings.length > 0) {
      responseText += '**HALF-LIFE WARNINGS:**\n\n';
      analysis.halfLifeWarnings.forEach(({ drug, warning }) => {
        responseText += `⏱️ ${warning}\n\n`;
      });
      responseText += '\n';
    }
    
    // Same-day interactions
    if (analysis.sameDayInteractions.length > 0) {
      const dangers = analysis.sameDayInteractions.filter(i => i.severity === 'danger');
      const cautions = analysis.sameDayInteractions.filter(i => i.severity === 'caution');
      
      if (dangers.length > 0) {
        responseText += '**SAME-DAY INTERACTIONS (DO NOT COMBINE):**\n\n';
        dangers.forEach(int => {
          responseText += `🚫 ${int.drug1} + ${int.drug2}\n`;
          responseText += `   ${int.description}\n`;
          responseText += `   ${int.recommendation}\n\n`;
        });
      }
      
      if (cautions.length > 0) {
        responseText += '**SAME-DAY INTERACTIONS (USE CAUTION):**\n\n';
        cautions.forEach(int => {
          responseText += `⚠️ ${int.drug1} + ${int.drug2}\n`;
          responseText += `   ${int.description}\n`;
          responseText += `   ${int.recommendation}\n\n`;
        });
      }
    }
    
    // Temporal (cross-day) interactions
    if (analysis.temporalInteractions.length > 0) {
      responseText += '**CROSS-DAY INTERACTIONS (Drug from previous days still in system):**\n\n';
      analysis.temporalInteractions.forEach(int => {
        const icon = int.severity === 'danger' ? '🚫' : '⚠️';
        responseText += `${icon} ${int.drug1} + ${int.drug2} (due to half-life)\n`;
        responseText += `   ${int.description}\n`;
        responseText += `   ${int.recommendation}\n\n`;
      });
    }
    
    // Check against existing medications
    if (existingInteractionResult.interactions.length > 0) {
      responseText += '**INTERACTIONS WITH YOUR CURRENT MEDICATIONS:**\n\n';
      existingInteractionResult.interactions.forEach(int => {
        const icon = int.severity === 'danger' ? '🚫' : '⚠️';
        responseText += `${icon} ${int.drug1} + ${int.drug2}\n`;
        responseText += `   ${int.description}\n`;
        responseText += `   ${int.recommendation}\n\n`;
      });
    }
    
    // Allergy alerts
    if (existingInteractionResult.allergyAlerts.length > 0) {
      responseText += '**ALLERGY ALERTS:**\n\n';
      existingInteractionResult.allergyAlerts.forEach(alert => {
        responseText += `⚠️ ${alert}\n\n`;
      });
    }
    
    // Summary
    const totalIssues = analysis.sameDayInteractions.length + 
                        analysis.temporalInteractions.length + 
                        existingInteractionResult.interactions.length +
                        analysis.foodInteractions.length;
    
    if (totalIssues === 0 && existingInteractionResult.allergyAlerts.length === 0) {
      responseText = '✅ **All Clear!**\n\nNo significant drug-drug, food-drug, or cross-day interactions found in your weekly schedule.\n\n';
      responseText += 'Medications checked: ' + allDrugsWithExisting.join(', ');
    } else {
      responseText = `📋 **Analysis Complete**\n\nFound ${totalIssues} interaction issue${totalIssues !== 1 ? 's' : ''} (plus ${existingInteractionResult.allergyAlerts.length} allergy alerts).\n\n`;
      responseText += 'Please review the warnings above and consult your doctor or pharmacist.\n\n';
      responseText += 'Medications checked: ' + allDrugsWithExisting.join(', ');
    }
    
    addMsg({ role: 'bot', text: responseText });
    setShowScheduleBuilder(false);
  };

  if (state.isLoading || !state.isAuthenticated) return null;

  return (
    <div className={styles.container}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <h1>Drug Interaction Checker</h1>
            <p>Enter medication names or upload a prescription (image or PDF)</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant={showScheduleBuilder ? 'primary' : 'secondary'} onClick={() => setShowScheduleBuilder(!showScheduleBuilder)}>
              Calendar
            </Button>
            <Button variant={showMedicationPanel ? 'primary' : 'secondary'} onClick={() => setShowMedicationPanel(!showMedicationPanel)}>
              <Pill size={20} />
              My Medications ({state.user?.currentMedications.length || 0})
            </Button>
          </div>
        </div>

        {showScheduleBuilder && (
          <ScheduleBuilder
            weeklySchedule={weeklySchedule}
            setWeeklySchedule={setWeeklySchedule}
            selectedDayForDrug={selectedDayForDrug}
            setSelectedDayForDrug={setSelectedDayForDrug}
            scheduleDrugInput={scheduleDrugInput}
            setScheduleDrugInput={setScheduleDrugInput}
            scheduleDrugSuggestions={scheduleDrugSuggestions}
            setScheduleDrugSuggestions={setScheduleDrugSuggestions}
            selectedFoods={selectedFoods}
            setSelectedFoods={setSelectedFoods}
            onAnalyze={analyzeSchedule}
          />
        )}

        {messages.length === 0 && !showScheduleBuilder ? (
          <div className={styles.welcomeState}>
            <div className={styles.welcomeIcon}><Pill size={64} /></div>
            <h2>Welcome to Drug Interaction Checker</h2>
            <p>Enter medication names separated by commas, or upload a prescription (image or PDF) to get started.</p>
            <div className={styles.quickActions}>
              <h3>Quick Examples:</h3>
              <button onClick={() => checkInteractions(['Warfarin', 'Aspirin'])}>Check Warfarin + Aspirin</button>
              <button onClick={() => checkInteractions(['Metformin', 'Ibuprofen'])}>Check Metformin + Ibuprofen</button>
              <button onClick={() => checkInteractions(['Sertraline', 'Tramadol'])}>Check Sertraline + Tramadol</button>
            </div>
            <Button onClick={() => setShowScheduleBuilder(true)} className={styles.scheduleButton}>
              <Plus size={18} />Build Weekly Schedule
            </Button>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={messagesEndRef} />
          </div>
        )}

        {messages.length > 0 && (
          <Button 
            variant={showScheduleBuilder ? 'primary' : 'secondary'} 
            onClick={() => setShowScheduleBuilder(!showScheduleBuilder)}
            className={styles.scheduleToggleBtn}
          >
            <Plus size={18} />
            {showScheduleBuilder ? 'Close Weekly Schedule' : 'Build Weekly Schedule'}
          </Button>
        )}

        {extractedDrugs.length > 0 && (
          <Card className={styles.extractedPanel}>
            <div className={styles.extractedHeader}>
              <h3>Extracted Medications</h3>
              <button onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}><X size={20} /></button>
            </div>
            <div className={styles.extractedList}>
              {extractedDrugs.map((drug, i) => (
                <button key={i} className={`${styles.drugOption} ${selectedDrugs.includes(drug) ? styles.selected : ''}`} onClick={() => toggleDrugSelection(drug)}>
                  {selectedDrugs.includes(drug) && <Check size={16} />}
                  {drug}
                </button>
              ))}
            </div>
            <div className={styles.extractedActions}>
              <Button variant="secondary" onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}>Cancel</Button>
              <Button onClick={confirmExtractedDrugs} disabled={selectedDrugs.length === 0}>Check Interactions ({selectedDrugs.length})</Button>
            </div>
          </Card>
        )}

        {showAddConfirmation && showAddConfirmation.length > 0 && (
          <Card className={styles.addConfirmationPanel}>
            <div className={styles.addConfirmationHeader}>
              <h3>Add to your medications?</h3>
              <button onClick={() => { setShowAddConfirmation(null); setSelectedToAdd([]); }}><X size={20} /></button>
            </div>
            <div className={styles.addConfirmationList}>
              {showAddConfirmation.map((med, i) => (
                <button 
                  key={i} 
                  className={`${styles.addOption} ${selectedToAdd.includes(i) ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedToAdd(prev => 
                      prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                    );
                  }}
                >
                  {selectedToAdd.includes(i) ? <Check size={16} /> : <div className={styles.emptyCheck} />}
                  <span>{med.name}</span>
                </button>
              ))}
            </div>
            <div className={styles.addConfirmationActions}>
              <Button variant="secondary" onClick={() => { setShowAddConfirmation(null); setSelectedToAdd([]); }}>Cancel</Button>
              <Button onClick={() => {
                const medsToAdd = selectedToAdd.map(i => showAddConfirmation[i]);
                const med: Medication = {
                  id: uuidv4(),
                  name: medsToAdd[0].name,
                  dosage: medsToAdd[0].dosage,
                  frequency: 'daily',
                  times: ['morning'],
                  startDate: new Date().toISOString(),
                };
                addMedication(med);
                generateCalendarEvents(med, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                const message = medsToAdd.length === 1 
                  ? `Done! ${medsToAdd[0].name} has been added to your medications and calendar.`
                  : `Done! ${medsToAdd.map(m => m.name).join(', ')} have been added to your medications and calendar.`;
                addMsg({ role: 'bot', text: message });
                setShowAddConfirmation(null);
                setSelectedToAdd([]);
              }} disabled={selectedToAdd.length === 0}>
                <Plus size={18} />Add {selectedToAdd.length === 0 ? '' : selectedToAdd.length === 1 ? '1 medication' : `${selectedToAdd.length} medications`}
              </Button>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <div className={styles.inputWrapper}>
            <div className={styles.searchContainer}>
              <input type="text" value={inputValue} onChange={(e) => handleSearch(e.target.value)} placeholder="Enter medication names (e.g., Aspirin, Metformin)" className={styles.input} />
              {drugSuggestions.length > 0 && (
                <ul className={styles.suggestions}>
                  {drugSuggestions.map((drug, i) => (
                    <li key={i} onClick={() => { setInputValue(drug.name); setDrugSuggestions([]); }}>
                      <strong>{drug.name}</strong>
                      <span>{drug.category} {drug.aliases}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" className={`${styles.iconButton} ${isListening ? styles.listening : ''}`} onClick={handleVoiceInput} aria-label="Voice input">
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button type="button" className={styles.iconButton} onClick={() => fileInputRef.current?.click()} aria-label="Upload prescription" disabled={isProcessingOCR}>
              <Camera size={20} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileUpload} className={styles.hiddenInput} />
            <Button type="submit" disabled={!inputValue.trim() || isProcessingOCR}><Send size={20} /></Button>
          </div>
          {isProcessingOCR && (
            <div className={styles.ocrProgress}>
              <p className={styles.processingText}>Scanning prescription... {ocrProgress}%</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${ocrProgress}%` }} />
              </div>
              {uploadedImageUrl && <img src={uploadedImageUrl} alt="Uploaded prescription" className={styles.uploadedPreview} />}
            </div>
          )}
        </form>
      </div>

      {showMedicationPanel && (
        <div className={styles.medicationPanel}>
          <div className={styles.panelHeader}>
            <h2>Current Medications</h2>
            <button onClick={() => setShowMedicationPanel(false)}><X size={24} /></button>
          </div>
          <div className={styles.panelContent}>
            {!state.user?.currentMedications.length ? (
              <p className={styles.noMeds}>No medications added yet</p>
            ) : (
              <ul className={styles.medList}>
                {state.user.currentMedications.map((med) => (
                  <li key={med.id}><Pill size={18} /><div><strong>{med.name}</strong><span>{med.dosage}</span></div></li>
                ))}
              </ul>
            )}
            {state.user?.allergies && state.user.allergies.length > 0 && (
              <div className={styles.allergiesSection}>
                <h3>Allergies</h3>
                <ul>{state.user.allergies.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
