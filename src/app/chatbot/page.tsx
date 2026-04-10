// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { format } from 'date-fns';
// import { v4 as uuidv4 } from 'uuid';
// import { Send, Image, Plus, Check, AlertTriangle, XCircle, Pill, Mic, MicOff, Camera, X } from 'lucide-react';
// import { useApp } from '@/context/AppContext';
// import Card from '@/components/ui/Card/Card';
// import Button from '@/components/ui/Button/Button';
// import Alert from '@/components/ui/Alert/Alert';
// import { checkDrugInteractions, searchDrugs, createMedicationFromDrug } from '@/lib/drugDatabase';
// import { ChatMessage, Medication } from '@/types';
// import styles from './page.module.css';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// declare global {
//   interface Window {
//     SpeechRecognition: any;
//     webkitSpeechRecognition: any;
//   }
// }

// export default function Chatbot() {
//   const router = useRouter();
//   const { state, addMessage, addMedication, generateCalendarEvents } = useApp();
//   const [inputValue, setInputValue] = useState('');
//   const [isListening, setIsListening] = useState(false);
//   const [isProcessingOCR, setIsProcessingOCR] = useState(false);
//   const [showImageUpload, setShowImageUpload] = useState(false);
//   const [extractedDrugs, setExtractedDrugs] = useState<string[]>([]);
//   const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
//   const [showAddConfirmation, setShowAddConfirmation] = useState<{ name: string; dosage: string } | null>(null);
//   const [showMedicationPanel, setShowMedicationPanel] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const recognitionRef = useRef<any>(null);
//   const [drugSuggestions, setDrugSuggestions] = useState<{ name: string; category: string }[]>([]);

//   useEffect(() => {
//     if (!state.isLoading && !state.isAuthenticated) {
//       router.push('/login');
//     }
//   }, [state.isLoading, state.isAuthenticated, router]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [state.messages]);

//   useEffect(() => {
//     if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         if (recognitionRef.current) {
//           recognitionRef.current.continuous = false;
//           recognitionRef.current.interimResults = false;
//           recognitionRef.current.lang = 'en-US';

//           recognitionRef.current.onresult = (event: any) => {
//             const transcript = event.results[0][0].transcript;
//             setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
//             setIsListening(false);
//           };

//           recognitionRef.current.onerror = () => setIsListening(false);
//           recognitionRef.current.onend = () => setIsListening(false);
//         }
//       }
//     }
//   }, []);

//   const handleVoiceInput = () => {
//     if (!recognitionRef.current) return;

//     if (isListening) {
//       recognitionRef.current.stop();
//       setIsListening(false);
//       return;
//     }

//     try {
//       recognitionRef.current.start();
//       setIsListening(true);
//     } catch (e) {
//       console.error('Speech recognition error:', e);
//     }
//   };

//   const handleSearch = (value: string) => {
//     setInputValue(value);
//     if (value.length > 2) {
//       const suggestions = searchDrugs(value);
//       setDrugSuggestions(suggestions.slice(0, 5).map(d => ({ name: d.name, category: d.category })));
//     } else {
//       setDrugSuggestions([]);
//     }
//   };

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setIsProcessingOCR(true);
//     setShowImageUpload(false);

//     addMessage({
//       role: 'user',
//       content: `I'm uploading a prescription image: ${file.name}`,
//     });

//     try {
//       const reader = new FileReader();
//       reader.onload = async () => {
//         await new Promise(resolve => setTimeout(resolve, 2000));
        
//         const mockExtracted = ['Metformin', 'Lisinopril', 'Atorvastatin'];
//         setExtractedDrugs(mockExtracted);
//         setSelectedDrugs(mockExtracted);
//         setIsProcessingOCR(false);

//         addMessage({
//           role: 'bot',
//           content: `I've extracted the following medications from your prescription. Please confirm which ones you want to check:`,
//           drugs: mockExtracted,
//         });
//       };
//       reader.readAsDataURL(file);
//     } catch (err) {
//       addMessage({
//         role: 'bot',
//         content: 'Sorry, I had trouble processing that image. Could you try a clearer photo?',
//       });
//       setIsProcessingOCR(false);
//     }
//   };

//   const toggleDrugSelection = (drug: string) => {
//     setSelectedDrugs(prev =>
//       prev.includes(drug)
//         ? prev.filter(d => d !== drug)
//         : [...prev, drug]
//     );
//   };

//   const confirmExtractedDrugs = () => {
//     if (selectedDrugs.length > 0) {
//       checkInteractions(selectedDrugs);
//     }
//     setExtractedDrugs([]);
//     setSelectedDrugs([]);
//   };

//   const checkInteractions = async (drugs: string[]) => {
//     if (drugs.length === 0) {
//       addMessage({
//         role: 'bot',
//         content: 'Please enter at least one medication name to check for interactions.',
//       });
//       return;
//     }

//     addMessage({
//       role: 'user',
//       content: `Check interactions for: ${drugs.join(', ')}`,
//     });

//     addMessage({
//       role: 'bot',
//       content: `Analyzing interactions between ${drugs.join(', ')}...`,
//     });

//     await new Promise(resolve => setTimeout(resolve, 1500));

//     const result = checkDrugInteractions(drugs, state.user?.allergies || []);

//     const existingMeds = state.user?.currentMedications.map(m => m.name) || [];
//     const allDrugs = [...existingMeds, ...drugs];
//     const updatedResult = checkDrugInteractions(allDrugs, state.user?.allergies || []);

//     let responseText = '';

//     if (updatedResult.allergyAlerts.length > 0) {
//       responseText += '⚠️ **Allergy Alert!**\n\n';
//       updatedResult.allergyAlerts.forEach(alert => {
//         responseText += `${alert}\n\n`;
//       });
//     }

//     if (updatedResult.interactions.length > 0) {
//       updatedResult.interactions.forEach(interaction => {
//         if (interaction.severity === 'danger') {
//           responseText += `🚫 **DANGER: Do Not Combine!**\n`;
//           responseText += `${interaction.drug1} + ${interaction.drug2}\n`;
//           responseText += `${interaction.description}\n`;
//           responseText += `**Recommendation:** ${interaction.recommendation}\n\n`;
//         } else if (interaction.severity === 'caution') {
//           responseText += `⚠️ **Caution Required**\n`;
//           responseText += `${interaction.drug1} + ${interaction.drug2}\n`;
//           responseText += `${interaction.description}\n`;
//           responseText += `**Recommendation:** ${interaction.recommendation}\n\n`;
//         }
//       });
//     }

//     if (result.safe && updatedResult.interactions.length === 0 && updatedResult.allergyAlerts.length === 0) {
//       responseText = `✅ **All Clear!**\n\n`;
//       responseText += `I've checked ${drugs.join(', ')} against your current medications and allergies. `;
//       responseText += `No significant interactions or allergy concerns were found.\n\n`;
//       responseText += `Would you like me to add these medications to your profile and calendar?`;
      
//       setShowAddConfirmation({
//         name: drugs[0],
//         dosage: 'As prescribed',
//       });
//     }

//     addMessage({
//       role: 'bot',
//       content: responseText,
//       drugs,
//       interactionResult: {
//         safe: result.safe,
//         interactions: result.interactions,
//       },
//     });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!inputValue.trim()) return;
    
//     const drugsToCheck = inputValue
//       .split(/[,\n]+/)
//       .map(d => d.trim())
//       .filter(d => d.length > 0);

//     checkInteractions(drugsToCheck);
//     setInputValue('');
//     setDrugSuggestions([]);
//   };

//   const addToProfile = () => {
//     if (!showAddConfirmation) return;

//     const newMedication: Medication = {
//       id: uuidv4(),
//       name: showAddConfirmation.name,
//       dosage: showAddConfirmation.dosage,
//       frequency: 'daily',
//       times: ['morning'],
//       startDate: new Date().toISOString(),
//     };

//     addMedication(newMedication);
//     generateCalendarEvents(newMedication, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

//     addMessage({
//       role: 'bot',
//       content: `Great! I've added ${showAddConfirmation.name} to your medications. You'll now see it in your calendar and profile.`,
//     });

//     setShowAddConfirmation(null);
//   };

//   if (state.isLoading || !state.isAuthenticated) {
//     return null;
//   }

//   return (
//     <div className={styles.container}>
//       <div className={styles.chatContainer}>
//         <div className={styles.chatHeader}>
//           <div className={styles.headerInfo}>
//             <h1>Drug Interaction Chatbot</h1>
//             <p>Enter medication names to check for interactions</p>
//           </div>
//           <Button
//             variant={showMedicationPanel ? 'primary' : 'secondary'}
//             onClick={() => setShowMedicationPanel(!showMedicationPanel)}
//           >
//             <Pill size={20} />
//             My Medications ({state.user?.currentMedications.length || 0})
//           </Button>
//         </div>

//         {state.messages.length === 0 ? (
//           <div className={styles.welcomeState}>
//             <div className={styles.welcomeIcon}>
//               <Pill size={64} />
//             </div>
//             <h2>Welcome to Drug Interaction Checker</h2>
//             <p>Enter medication names separated by commas, or upload a prescription image to get started.</p>
            
//             <div className={styles.quickActions}>
//               <h3>Quick Examples:</h3>
//               <button onClick={() => checkInteractions(['Warfarin', 'Aspirin'])}>
//                 Check Warfarin + Aspirin
//               </button>
//               <button onClick={() => checkInteractions(['Metformin', 'Ibuprofen'])}>
//                 Check Metformin + Ibuprofen
//               </button>
//               <button onClick={() => checkInteractions(['Sertraline', 'Tramadol'])}>
//                 Check Sertraline + Tramadol
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className={styles.messagesContainer}>
//             {state.messages.map((message) => (
//               <div
//                 key={message.id}
//                 className={`${styles.message} ${styles[message.role]}`}
//               >
//                 <div className={styles.messageBubble}>
//                   <div className={styles.messageContent}>
//                     {message.content.split('\n').map((line, i) => {
//                       if (line.startsWith('**') && line.endsWith('**')) {
//                         return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
//                       }
//                       if (line.startsWith('⚠️') || line.startsWith('✅') || line.startsWith('🚫')) {
//                         return <p key={i} className={styles.emojiLine}>{line}</p>;
//                       }
//                       if (line.startsWith('-') || line.startsWith('•')) {
//                         return <li key={i}>{line.substring(1).trim()}</li>;
//                       }
//                       return <p key={i}>{line}</p>;
//                     })}
//                   </div>
                  
//                   {message.drugs && message.drugs.length > 0 && (
//                     <div className={styles.drugChips}>
//                       {message.drugs.map((drug, i) => (
//                         <span key={i} className={styles.drugChip}>{drug}</span>
//                       ))}
//                     </div>
//                   )}
                  
//                   {message.interactionResult && (
//                     <div className={styles.interactionSummary}>
//                       {message.interactionResult.interactions.map((int, i) => (
//                         <div key={i} className={`${styles.interactionBadge} ${styles[int.severity]}`}>
//                           {int.severity === 'danger' && <XCircle size={16} />}
//                           {int.severity === 'caution' && <AlertTriangle size={16} />}
//                           {int.severity === 'safe' && <Check size={16} />}
//                           <span>{int.drug1} + {int.drug2}</span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
                  
//                   <span className={styles.timestamp}>
//                     {format(new Date(message.timestamp), 'h:mm a')}
//                   </span>
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>
//         )}

//         {extractedDrugs.length > 0 && (
//           <Card className={styles.extractedPanel}>
//             <div className={styles.extractedHeader}>
//               <h3>Extracted Medications</h3>
//               <button onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}>
//                 <X size={20} />
//               </button>
//             </div>
//             <div className={styles.extractedList}>
//               {extractedDrugs.map((drug, index) => (
//                 <button
//                   key={index}
//                   className={`${styles.drugOption} ${selectedDrugs.includes(drug) ? styles.selected : ''}`}
//                   onClick={() => toggleDrugSelection(drug)}
//                 >
//                   {selectedDrugs.includes(drug) && <Check size={16} />}
//                   {drug}
//                 </button>
//               ))}
//             </div>
//             <div className={styles.extractedActions}>
//               <Button variant="secondary" onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}>
//                 Cancel
//               </Button>
//               <Button onClick={confirmExtractedDrugs} disabled={selectedDrugs.length === 0}>
//                 Check Interactions ({selectedDrugs.length})
//               </Button>
//             </div>
//           </Card>
//         )}

//         {showAddConfirmation && (
//           <Alert variant="success" title="Add to your medications?">
//             <p>Would you like to add <strong>{showAddConfirmation.name}</strong> to your medication profile?</p>
//             <div className={styles.confirmActions}>
//               <Button variant="secondary" onClick={() => setShowAddConfirmation(null)}>
//                 No, thanks
//               </Button>
//               <Button onClick={addToProfile}>
//                 <Plus size={18} />
//                 Yes, add it
//               </Button>
//             </div>
//           </Alert>
//         )}

//         <form onSubmit={handleSubmit} className={styles.inputForm}>
//           <div className={styles.inputWrapper}>
//             <div className={styles.searchContainer}>
//               <input
//                 type="text"
//                 value={inputValue}
//                 onChange={(e) => handleSearch(e.target.value)}
//                 placeholder="Enter medication names (e.g., Aspirin, Metformin)"
//                 className={styles.input}
//               />
//               {drugSuggestions.length > 0 && (
//                 <ul className={styles.suggestions}>
//                   {drugSuggestions.map((drug, index) => (
//                     <li key={index} onClick={() => {
//                       setInputValue(drug.name);
//                       setDrugSuggestions([]);
//                     }}>
//                       <strong>{drug.name}</strong>
//                       <span>{drug.category}</span>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
            
//             <button
//               type="button"
//               className={`${styles.iconButton} ${isListening ? styles.listening : ''}`}
//               onClick={handleVoiceInput}
//               aria-label="Voice input"
//             >
//               {isListening ? <MicOff size={20} /> : <Mic size={20} />}
//             </button>
            
//             <button
//               type="button"
//               className={styles.iconButton}
//               onClick={() => fileInputRef.current?.click()}
//               aria-label="Upload prescription"
//             >
//               <Camera size={20} />
//             </button>
            
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               capture="environment"
//               onChange={handleImageUpload}
//               className={styles.hiddenInput}
//             />
            
//             <Button type="submit" disabled={!inputValue.trim() || isProcessingOCR}>
//               <Send size={20} />
//             </Button>
//           </div>
          
//           {isProcessingOCR && (
//             <p className={styles.processingText}>
//               Processing prescription image...
//             </p>
//           )}
//         </form>
//       </div>

//       {showMedicationPanel && (
//         <div className={styles.medicationPanel}>
//           <div className={styles.panelHeader}>
//             <h2>Current Medications</h2>
//             <button onClick={() => setShowMedicationPanel(false)}>
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className={styles.panelContent}>
//             {state.user?.currentMedications.length === 0 ? (
//               <p className={styles.noMeds}>No medications added yet</p>
//             ) : (
//               <ul className={styles.medList}>
//                 {state.user?.currentMedications.map((med) => (
//                   <li key={med.id}>
//                     <Pill size={18} />
//                     <div>
//                       <strong>{med.name}</strong>
//                       <span>{med.dosage}</span>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
            
//             {state.user?.allergies && state.user.allergies.length > 0 && (
//               <div className={styles.allergiesSection}>
//                 <h3>Allergies</h3>
//                 <ul>
//                   {state.user.allergies.map((allergy, index) => (
//                     <li key={index}>{allergy}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


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
import { checkDrugInteractions, searchDrugs, drugDatabase } from '@/lib/drugDatabase';
import { Medication, DrugInteraction } from '@/types';
import styles from './page.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── types ────────────────────────────────────────────────────────────────────

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

// ─── helpers ──────────────────────────────────────────────────────────────────

async function ocrImage(source: HTMLImageElement | string): Promise<string> {
  const img = typeof source === 'string'
    ? await new Promise<HTMLImageElement>((resolve) => {
        const i = new Image(); i.onload = () => resolve(i); i.src = source;
      })
    : source;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext('2d')!.drawImage(img, 0, 0);

  const base64 = canvas.toDataURL('image/png').split(',')[1];
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }],
      }),
    }
  );
  const data = await response.json();
  const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
  console.log('Google Vision OCR:', text);
  return text;
}

async function pdfToImageUrls(file: File): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
  ).toString();
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const urls: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    urls.push(canvas.toDataURL('image/png'));
  }
  return urls;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

function extractDrugNamesFromText(text: string, db: { name: string; aliases: string[] }[]): string[] {
  const found = new Set<string>();
  const normalised = text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ');
  const words = normalised.split(' ').filter(w => w.length > 2);
  const candidates = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    candidates.add(words[i]);
    if (i + 1 < words.length) { candidates.add(words[i] + words[i+1]); candidates.add(words[i] + ' ' + words[i+1]); }
    if (i + 2 < words.length) candidates.add(words[i] + words[i+1] + words[i+2]);
  }
  for (const candidate of candidates) {
    if (candidate.length < 4) continue;
    for (const drug of db) {
      for (const name of [drug.name, ...drug.aliases]) {
        const nl = name.toLowerCase();
        const threshold = nl.length <= 5 ? 2 : nl.length <= 9 ? 3 : 4;
        if (levenshtein(candidate, nl) <= threshold) { found.add(drug.name); break; }
      }
    }
  }
  return Array.from(found);
}

// ─── message bubble component ─────────────────────────────────────────────────

function MessageBubble({ message }: { message: LocalMessage }) {
  const isBot = message.role === 'bot';
  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.messageBubble}>

        {isBot && <div className={styles.botLabel}>MediCare AI</div>}

        {message.text && (
          <p className={styles.messageText}>{message.text}</p>
        )}

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
                  <p className={styles.safeDesc}>
                    No significant interactions or allergy concerns found between these medications.
                  </p>
                </div>
              </div>
            )}

            {message.interactionResult.interactions.map((int, i) => (
              <div key={i} className={`${styles.interactionCard} ${styles[int.severity]}`}>
                <div className={styles.interactionCardHeader}>
                  {int.severity === 'danger'
                    ? <XCircle size={20} />
                    : <AlertTriangle size={20} />}
                  <span className={styles.severityLabel}>
                    {int.severity === 'danger' ? 'Do Not Combine' : 'Use With Caution'}
                  </span>
                  <span className={styles.drugPair}>{int.drug1} + {int.drug2}</span>
                </div>
                <div className={styles.interactionCardBody}>
                  <p className={styles.interactionDesc}>{int.description}</p>
                  <div className={styles.recommendationBox}>
                    <strong>Recommendation: </strong>{int.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.drugs && message.drugs.length > 0 && (
          <div className={styles.drugChips}>
            {message.drugs.map((drug, i) => (
              <span key={i} className={styles.drugChip}>{drug}</span>
            ))}
          </div>
        )}

        <span className={styles.timestamp}>{format(new Date(message.timestamp), 'h:mm a')}</span>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Chatbot() {
  const router = useRouter();
  const { state, addMedication, generateCalendarEvents } = useApp();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [extractedDrugs, setExtractedDrugs] = useState<string[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [showAddConfirmation, setShowAddConfirmation] = useState<{ name: string; dosage: string } | null>(null);
  const [showMedicationPanel, setShowMedicationPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [drugSuggestions, setDrugSuggestions] = useState<{ name: string; category: string }[]>([]);

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
      setDrugSuggestions(searchDrugs(value).slice(0, 5).map((d: { name: string; category: string }) => ({ name: d.name, category: d.category })));
    } else {
      setDrugSuggestions([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPDF && !isImage) {
      addMsg({ role: 'bot', text: 'Sorry, I can only read image files (JPEG, PNG) or PDF documents.' });
      return;
    }

    setIsProcessingOCR(true);
    setOcrStatusText(isPDF ? 'Reading PDF…' : 'Reading image…');
    addMsg({ role: 'user', text: `Uploading prescription: ${file.name}` });

    try {
      let rawText = '';
      if (isPDF) {
        setOcrStatusText('Converting PDF pages…');
        const urls = await pdfToImageUrls(file);
        const texts: string[] = [];
        for (let i = 0; i < urls.length; i++) {
          setOcrStatusText(`OCR page ${i + 1} of ${urls.length}…`);
          const img = new Image(); img.src = urls[i];
          await new Promise(res => { img.onload = res; });
          texts.push(await ocrImage(img));
        }
        rawText = texts.join('\n');
      } else {
        setOcrStatusText('Running OCR…');
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const img = new Image(); img.src = dataUrl;
        await new Promise(res => { img.onload = res; });
        rawText = await ocrImage(img);
      }

      setOcrStatusText('Identifying medications…');
      const drugs = extractDrugNamesFromText(rawText, drugDatabase);

      if (drugs.length === 0) {
        addMsg({ role: 'bot', text: "I processed the file but couldn't identify any medication names. Please try a clearer image or type the names manually." });
      } else {
        setExtractedDrugs(drugs);
        setSelectedDrugs(drugs);
        addMsg({ role: 'bot', text: "I've extracted the following medications. Please confirm which ones to check:", drugs });
      }
    } catch (err) {
      console.error('OCR error:', err);
      addMsg({ role: 'bot', text: 'Sorry, I had trouble processing that file. Please try a clearer image or a different PDF.' });
    } finally {
      setIsProcessingOCR(false);
      setOcrStatusText('');
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

    addMsg({ role: 'user', text: `Check interactions for: ${drugs.join(', ')}` });
    addMsg({ role: 'bot', text: `Analyzing interactions between ${drugs.join(', ')}…` });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const existingMeds = state.user?.currentMedications.map((m: Medication) => m.name) || [];
    const result = checkDrugInteractions([...existingMeds, ...drugs], state.user?.allergies || []);

    if (result.safe && result.interactions.length === 0 && result.allergyAlerts.length === 0) {
      setShowAddConfirmation({ name: drugs[0], dosage: 'As prescribed' });
    }

    addMsg({
      role: 'bot',
      drugs,
      interactionResult: {
        safe: result.safe,
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
    if (!showAddConfirmation) return;
    const med: Medication = {
      id: uuidv4(),
      name: showAddConfirmation.name,
      dosage: showAddConfirmation.dosage,
      frequency: 'daily',
      times: ['morning'],
      startDate: new Date().toISOString(),
    };
    addMedication(med);
    generateCalendarEvents(med, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    addMsg({ role: 'bot', text: `Done! ${showAddConfirmation.name} has been added to your medications and calendar.` });
    setShowAddConfirmation(null);
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
          <Button
            variant={showMedicationPanel ? 'primary' : 'secondary'}
            onClick={() => setShowMedicationPanel(!showMedicationPanel)}
          >
            <Pill size={20} />
            My Medications ({state.user?.currentMedications.length || 0})
          </Button>
        </div>

        {messages.length === 0 ? (
          <div className={styles.welcomeState}>
            <div className={styles.welcomeIcon}><Pill size={64} /></div>
            <h2>Welcome to Drug Interaction Checker</h2>
            <p>Enter medication names separated by commas, or upload a prescription image or PDF to get started.</p>
            <div className={styles.quickActions}>
              <h3>Quick Examples:</h3>
              <button onClick={() => checkInteractions(['Warfarin', 'Aspirin'])}>Check Warfarin + Aspirin</button>
              <button onClick={() => checkInteractions(['Metformin', 'Ibuprofen'])}>Check Metformin + Ibuprofen</button>
              <button onClick={() => checkInteractions(['Sertraline', 'Tramadol'])}>Check Sertraline + Tramadol</button>
            </div>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={messagesEndRef} />
          </div>
        )}

        {extractedDrugs.length > 0 && (
          <Card className={styles.extractedPanel}>
            <div className={styles.extractedHeader}>
              <h3>Extracted Medications</h3>
              <button onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}><X size={20} /></button>
            </div>
            <div className={styles.extractedList}>
              {extractedDrugs.map((drug, i) => (
                <button
                  key={i}
                  className={`${styles.drugOption} ${selectedDrugs.includes(drug) ? styles.selected : ''}`}
                  onClick={() => toggleDrugSelection(drug)}
                >
                  {selectedDrugs.includes(drug) && <Check size={16} />}
                  {drug}
                </button>
              ))}
            </div>
            <div className={styles.extractedActions}>
              <Button variant="secondary" onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}>Cancel</Button>
              <Button onClick={confirmExtractedDrugs} disabled={selectedDrugs.length === 0}>
                Check Interactions ({selectedDrugs.length})
              </Button>
            </div>
          </Card>
        )}

        {showAddConfirmation && (
          <Alert variant="success" title="Add to your medications?">
            <p>Would you like to add <strong>{showAddConfirmation.name}</strong> to your medication profile?</p>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setShowAddConfirmation(null)}>No, thanks</Button>
              <Button onClick={addToProfile}><Plus size={18} />Yes, add it</Button>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <div className={styles.inputWrapper}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Enter medication names (e.g., Aspirin, Metformin)"
                className={styles.input}
              />
              {drugSuggestions.length > 0 && (
                <ul className={styles.suggestions}>
                  {drugSuggestions.map((drug, i) => (
                    <li key={i} onClick={() => { setInputValue(drug.name); setDrugSuggestions([]); }}>
                      <strong>{drug.name}</strong>
                      <span>{drug.category}</span>
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
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf" onChange={handleFileUpload} className={styles.hiddenInput} />
            <Button type="submit" disabled={!inputValue.trim() || isProcessingOCR}><Send size={20} /></Button>
          </div>
          {isProcessingOCR && <p className={styles.processingText}>{ocrStatusText || 'Processing file…'}</p>}
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
                {state.user.currentMedications.map((med: Medication) => (
                  <li key={med.id}>
                    <Pill size={18} />
                    <div><strong>{med.name}</strong><span>{med.dosage}</span></div>
                  </li>
                ))}
              </ul>
            )}
            {state.user?.allergies && state.user.allergies.length > 0 && (
              <div className={styles.allergiesSection}>
                <h3>Allergies</h3>
                <ul>{state.user.allergies.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
