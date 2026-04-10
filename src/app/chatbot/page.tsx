'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Send, Plus, Check, AlertTriangle, XCircle, Pill, Mic, MicOff, Camera, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import Alert from '@/components/ui/Alert/Alert';
import { checkDrugInteractions, searchDrugs, findDrug } from '@/lib/drugDatabase';
import { Medication } from '@/types';
import styles from './page.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chatbot() {
  const router = useRouter();
  const { state, addMessage, addMedication, generateCalendarEvents } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [extractedDrugs, setExtractedDrugs] = useState<string[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [showAddConfirmation, setShowAddConfirmation] = useState<{ name: string; dosage: string } | null>(null);
  const [showMedicationPanel, setShowMedicationPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [drugSuggestions, setDrugSuggestions] = useState<{ name: string; category: string; aliases: string }[]>([]);

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/login');
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

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
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
          };

          recognitionRef.current.onerror = () => setIsListening(false);
          recognitionRef.current.onend = () => setIsListening(false);
        }
      }
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error('Speech recognition error:', e);
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      addMessage({
        role: 'bot',
        content: 'Sorry, I can only process images (JPG, PNG, GIF, WebP) and PDF files. Please upload a valid file.',
      });
      return;
    }

    const isPdf = file.type === 'application/pdf';
    const fileType = isPdf ? 'PDF document' : 'image';

    setIsProcessingOCR(true);
    setShowImageUpload(false);

    addMessage({
      role: 'user',
      content: `I'm uploading a prescription ${fileType}: ${file.name}`,
    });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockExtracted = ['Metformin', 'Lisinopril', 'Atorvastatin'];
        setExtractedDrugs(mockExtracted);
        setSelectedDrugs(mockExtracted);
        setIsProcessingOCR(false);

        addMessage({
          role: 'bot',
          content: `I've extracted the following medications from your prescription. Please confirm which ones you want to check:`,
          drugs: mockExtracted,
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      addMessage({
        role: 'bot',
        content: 'Sorry, I had trouble processing that file. Could you try a clearer version?',
      });
      setIsProcessingOCR(false);
    }
  };

  const toggleDrugSelection = (drug: string) => {
    setSelectedDrugs(prev =>
      prev.includes(drug)
        ? prev.filter(d => d !== drug)
        : [...prev, drug]
    );
  };

  const confirmExtractedDrugs = () => {
    if (selectedDrugs.length > 0) {
      checkInteractions(selectedDrugs);
    }
    setExtractedDrugs([]);
    setSelectedDrugs([]);
  };

  const checkInteractions = async (drugs: string[]) => {
    if (drugs.length === 0) {
      addMessage({
        role: 'bot',
        content: 'Please enter at least one medication name to check for interactions.',
      });
      return;
    }

    const resolvedDrugs = drugs.map(d => {
      const found = findDrug(d);
      return found ? found.name : d;
    });

    const unknownDrugs = drugs.filter(d => !findDrug(d));
    const knownDrugs = drugs.filter(d => findDrug(d));

    addMessage({
      role: 'user',
      content: `Check interactions for: ${resolvedDrugs.join(', ')}`,
    });

    if (unknownDrugs.length > 0) {
      addMessage({
        role: 'bot',
        content: `Looking up ${unknownDrugs.join(', ')} in the database...`,
      });
    } else {
      addMessage({
        role: 'bot',
        content: `Analyzing interactions between ${resolvedDrugs.join(', ')}...`,
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const existingMeds = state.user?.currentMedications.map(m => {
      const found = findDrug(m.name);
      return found ? found.name : m.name;
    }) || [];
    const allDrugs = [...existingMeds, ...resolvedDrugs];
    const result = checkDrugInteractions(allDrugs, state.user?.allergies || []);

    let responseText = '';

    if (unknownDrugs.length > 0) {
      responseText += `ℹ️ **Drugs not in database:** ${unknownDrugs.join(', ')}\n`;
      responseText += `These medications couldn't be verified. Please consult your pharmacist for interaction warnings.\n\n`;
    }

    if (result.allergyAlerts.length > 0) {
      responseText += '⚠️ **Allergy Alert!**\n\n';
      result.allergyAlerts.forEach(alert => {
        responseText += `${alert}\n\n`;
      });
    }

    const dangerInteractions = result.interactions.filter(i => i.severity === 'danger');
    const cautionInteractions = result.interactions.filter(i => i.severity === 'caution');

    if (dangerInteractions.length > 0) {
      responseText += `🚫 **DANGER: Do Not Combine!**\n\n`;
      dangerInteractions.forEach(interaction => {
        responseText += `**${interaction.drug1} + ${interaction.drug2}**\n`;
        responseText += `${interaction.description}\n`;
        responseText += `→ ${interaction.recommendation}\n\n`;
      });
    }

    if (cautionInteractions.length > 0) {
      responseText += `⚠️ **Caution Required**\n\n`;
      cautionInteractions.forEach(interaction => {
        responseText += `**${interaction.drug1} + ${interaction.drug2}**\n`;
        responseText += `${interaction.description}\n`;
        responseText += `→ ${interaction.recommendation}\n\n`;
      });
    }

    const newInteractions = result.interactions.filter(i => {
      const drug1Known = findDrug(i.drug1);
      const drug2Known = findDrug(i.drug2);
      const drug1InUserMeds = existingMeds.some(d => findDrug(d)?.name === i.drug1);
      const drug2InUserMeds = existingMeds.some(d => findDrug(d)?.name === i.drug2);
      return (drug1Known && knownDrugs.includes(drug1Known.name)) || 
             (drug2Known && knownDrugs.includes(drug2Known.name));
    });

    if (result.safe || (dangerInteractions.length === 0 && cautionInteractions.length === 0 && result.allergyAlerts.length === 0)) {
      responseText = `✅ **All Clear!**\n\n`;
      if (knownDrugs.length > 0) {
        responseText += `I've checked ${knownDrugs.map(d => findDrug(d)?.name || d).join(', ')} against your current medications and allergies. `;
      } else {
        responseText += `No known interactions found in the database. `;
      }
      responseText += `No significant interactions or allergy concerns were found.\n\n`;
      
      if (knownDrugs.length > 0) {
        responseText += `Would you like me to add these medications to your profile and calendar?`;
        setShowAddConfirmation({
          name: findDrug(knownDrugs[0])?.name || knownDrugs[0],
          dosage: 'As prescribed',
        });
      }
    }

    addMessage({
      role: 'bot',
      content: responseText,
      drugs: resolvedDrugs,
      interactionResult: {
        safe: dangerInteractions.length === 0 && cautionInteractions.length === 0 && result.allergyAlerts.length === 0,
        interactions: newInteractions.length > 0 ? newInteractions : result.interactions,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const drugsToCheck = inputValue
      .split(/[,\n]+/)
      .map(d => d.trim())
      .filter(d => d.length > 0);

    checkInteractions(drugsToCheck);
    setInputValue('');
    setDrugSuggestions([]);
  };

  const addToProfile = () => {
    if (!showAddConfirmation) return;

    const newMedication: Medication = {
      id: uuidv4(),
      name: showAddConfirmation.name,
      dosage: showAddConfirmation.dosage,
      frequency: 'daily',
      times: ['morning'],
      startDate: new Date().toISOString(),
    };

    addMedication(newMedication);
    generateCalendarEvents(newMedication, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    addMessage({
      role: 'bot',
      content: `Great! I've added ${showAddConfirmation.name} to your medications. You'll now see it in your calendar and profile.`,
    });

    setShowAddConfirmation(null);
  };

  if (state.isLoading || !state.isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <h1>Drug Interaction Chatbot</h1>
            <p>Enter medication names to check for interactions</p>
          </div>
          <Button
            variant={showMedicationPanel ? 'primary' : 'secondary'}
            onClick={() => setShowMedicationPanel(!showMedicationPanel)}
          >
            <Pill size={20} />
            My Medications ({state.user?.currentMedications.length || 0})
          </Button>
        </div>

        {state.messages.length === 0 ? (
          <div className={styles.welcomeState}>
            <div className={styles.welcomeIcon}>
              <Pill size={64} />
            </div>
            <h2>Welcome to Drug Interaction Checker</h2>
            <p>Enter medication names separated by commas, or upload a prescription (image or PDF) to get started.</p>
            
            <div className={styles.quickActions}>
              <h3>Quick Examples:</h3>
              <button onClick={() => checkInteractions(['Warfarin', 'Aspirin'])}>
                Check Warfarin + Aspirin
              </button>
              <button onClick={() => checkInteractions(['Metformin', 'Ibuprofen'])}>
                Check Metformin + Ibuprofen
              </button>
              <button onClick={() => checkInteractions(['Sertraline', 'Tramadol'])}>
                Check Sertraline + Tramadol
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {state.messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.role]}`}
              >
                <div className={styles.messageBubble}>
                  <div className={styles.messageContent}>
                    {message.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                      }
                      if (line.startsWith('⚠️') || line.startsWith('✅') || line.startsWith('🚫')) {
                        return <p key={i} className={styles.emojiLine}>{line}</p>;
                      }
                      if (line.startsWith('-') || line.startsWith('•')) {
                        return <li key={i}>{line.substring(1).trim()}</li>;
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                  
                  {message.drugs && message.drugs.length > 0 && (
                    <div className={styles.drugChips}>
                      {message.drugs.map((drug, i) => (
                        <span key={i} className={styles.drugChip}>{drug}</span>
                      ))}
                    </div>
                  )}
                  
                  {message.interactionResult && (
                    <div className={styles.interactionSummary}>
                      {message.interactionResult.interactions.map((int, i) => (
                        <div key={i} className={`${styles.interactionBadge} ${styles[int.severity]}`}>
                          {int.severity === 'danger' && <XCircle size={16} />}
                          {int.severity === 'caution' && <AlertTriangle size={16} />}
                          {int.severity === 'safe' && <Check size={16} />}
                          <span>{int.drug1} + {int.drug2}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <span className={styles.timestamp}>
                    {format(new Date(message.timestamp), 'h:mm a')}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {extractedDrugs.length > 0 && (
          <Card className={styles.extractedPanel}>
            <div className={styles.extractedHeader}>
              <h3>Extracted Medications</h3>
              <button onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.extractedList}>
              {extractedDrugs.map((drug, index) => (
                <button
                  key={index}
                  className={`${styles.drugOption} ${selectedDrugs.includes(drug) ? styles.selected : ''}`}
                  onClick={() => toggleDrugSelection(drug)}
                >
                  {selectedDrugs.includes(drug) && <Check size={16} />}
                  {drug}
                </button>
              ))}
            </div>
            <div className={styles.extractedActions}>
              <Button variant="secondary" onClick={() => { setExtractedDrugs([]); setSelectedDrugs([]); }}>
                Cancel
              </Button>
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
              <Button variant="secondary" onClick={() => setShowAddConfirmation(null)}>
                No, thanks
              </Button>
              <Button onClick={addToProfile}>
                <Plus size={18} />
                Yes, add it
              </Button>
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
                  {drugSuggestions.map((drug, index) => (
                    <li key={index} onClick={() => {
                      setInputValue(drug.name);
                      setDrugSuggestions([]);
                    }}>
                      <strong>{drug.name}</strong>
                      <span>{drug.category} {drug.aliases}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <button
              type="button"
              className={`${styles.iconButton} ${isListening ? styles.listening : ''}`}
              onClick={handleVoiceInput}
              aria-label="Voice input"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload prescription"
            >
              <Camera size={20} />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              capture="environment"
              onChange={handleImageUpload}
              className={styles.hiddenInput}
            />
            
            <Button type="submit" disabled={!inputValue.trim() || isProcessingOCR}>
              <Send size={20} />
            </Button>
          </div>
          
          {isProcessingOCR && (
            <p className={styles.processingText}>
              Processing prescription...
            </p>
          )}
        </form>
      </div>

      {showMedicationPanel && (
        <div className={styles.medicationPanel}>
          <div className={styles.panelHeader}>
            <h2>Current Medications</h2>
            <button onClick={() => setShowMedicationPanel(false)}>
              <X size={24} />
            </button>
          </div>
          
          <div className={styles.panelContent}>
            {state.user?.currentMedications.length === 0 ? (
              <p className={styles.noMeds}>No medications added yet</p>
            ) : (
              <ul className={styles.medList}>
                {state.user?.currentMedications.map((med) => (
                  <li key={med.id}>
                    <Pill size={18} />
                    <div>
                      <strong>{med.name}</strong>
                      <span>{med.dosage}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {state.user?.allergies && state.user.allergies.length > 0 && (
              <div className={styles.allergiesSection}>
                <h3>Allergies</h3>
                <ul>
                  {state.user.allergies.map((allergy, index) => (
                    <li key={index}>{allergy}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
