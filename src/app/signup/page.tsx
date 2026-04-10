'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Mail, Lock, User, Calendar, Ruler, Heart, AlertCircle, Check, Upload, X, Camera, Mic, MicOff, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import Alert from '@/components/ui/Alert/Alert';
import { searchDrugs } from '@/lib/drugDatabase';
import { Medication } from '@/types';
import styles from './page.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const steps = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Physical Profile', icon: Ruler },
  { id: 3, title: 'Medical History', icon: Heart },
  { id: 4, title: 'Medications', icon: Calendar },
];

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ethnicities = [
  'Caucasian', 'African American', 'Hispanic/Latino', 'Asian', 
  'South Asian', 'Middle Eastern', 'Pacific Islander', 'Native American', 'Other'
];

export default function Signup() {
  const router = useRouter();
  const { state, signup } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [detectedMedications, setDetectedMedications] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    sex: '' as 'male' | 'female' | 'other' | '',
    height: '',
    weight: '',
    ethnicity: '',
    currentConditions: [] as string[],
    pastConditions: [] as string[],
    allergies: [] as string[],
    currentMedications: [] as Medication[],
    pastMedications: [] as Medication[],
  });

  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '' });
  const [drugSuggestions, setDrugSuggestions] = useState<{ name: string; category: string }[]>([]);
  const [pendingExtractedMeds, setPendingExtractedMeds] = useState<{ name: string; dosage: string }[]>([]);

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/');
    }
  }, [state.isAuthenticated, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const handleVoiceInput = (field: string) => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (field === 'condition') {
          setNewCondition(transcript);
        } else if (field === 'allergy') {
          setNewAllergy(transcript);
        } else if (field === 'medication') {
          setNewMedication(prev => ({ ...prev, name: transcript }));
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error('Speech recognition error:', e);
    }
  };

  const addCondition = (type: 'current' | 'past') => {
    const value = type === 'current' ? newCondition : newAllergy;
    if (value.trim()) {
      if (type === 'current') {
        setFormData(prev => ({
          ...prev,
          currentConditions: [...prev.currentConditions, value.trim()]
        }));
        setNewCondition('');
      } else {
        setFormData(prev => ({
          ...prev,
          allergies: [...prev.allergies, value.trim()]
        }));
        setNewAllergy('');
      }
    }
  };

  const removeCondition = (type: 'current' | 'past', index: number) => {
    if (type === 'current') {
      setFormData(prev => ({
        ...prev,
        currentConditions: prev.currentConditions.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allergies: prev.allergies.filter((_, i) => i !== index)
      }));
    }
  };

  const handleMedicationNameChange = (value: string) => {
    setNewMedication(prev => ({ ...prev, name: value }));
    if (value.length > 2) {
      const suggestions = searchDrugs(value);
      setDrugSuggestions(suggestions.slice(0, 5).map(d => ({ name: d.name, category: d.category })));
    } else {
      setDrugSuggestions([]);
    }
  };

  const addMedication = (toCurrent: boolean) => {
    if (newMedication.name.trim() && newMedication.dosage.trim()) {
      const medication: Medication = {
        id: uuidv4(),
        name: newMedication.name.trim(),
        dosage: newMedication.dosage.trim(),
        frequency: 'daily',
        times: ['morning'],
        startDate: new Date().toISOString(),
      };
      
      setFormData(prev => ({
        ...prev,
        [toCurrent ? 'currentMedications' : 'pastMedications']: [
          ...prev[toCurrent ? 'currentMedications' : 'pastMedications'],
          medication
        ]
      }));
      setNewMedication({ name: '', dosage: '' });
      setDrugSuggestions([]);
    }
  };

  const removeMedication = (type: 'current' | 'past', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type === 'current' ? 'currentMedications' : 'pastMedications']: 
        prev[type === 'current' ? 'currentMedications' : 'pastMedications'].filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOCR(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const mockExtractedText = "Amoxicillin 500mg - Take one capsule three times daily\nMetformin 1000mg - Take with breakfast and dinner\nLisinopril 10mg - Take once daily in the morning";
          setExtractedText(mockExtractedText);
          
          const meds: string[] = [];
          const lines = mockExtractedText.split('\n');
          lines.forEach(line => {
            const match = line.match(/^([A-Za-z]+)\s/);
            if (match) {
              meds.push(match[1]);
            }
          });
          setDetectedMedications(meds);
          setIsProcessingOCR(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      setIsProcessingOCR(false);
    }
  };

  const confirmExtractedMedications = () => {
    const extracted = detectedMedications.map(name => ({
      name,
      dosage: 'As prescribed',
    }));
    
    setPendingExtractedMeds(extracted);
    
    setExtractedText('');
    setDetectedMedications([]);
  };

  const addPendingMedication = (index: number) => {
    const med = pendingExtractedMeds[index];
    if (med.name && med.dosage) {
      const medication: Medication = {
        id: uuidv4(),
        name: med.name,
        dosage: med.dosage,
        frequency: 'daily',
        times: ['morning'],
        startDate: new Date().toISOString(),
      };
      
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, medication]
      }));
      
      setPendingExtractedMeds(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addAllPendingMedications = () => {
    const newMeds: Medication[] = pendingExtractedMeds
      .filter(med => med.name && med.dosage)
      .map(med => ({
        id: uuidv4(),
        name: med.name,
        dosage: med.dosage,
        frequency: 'daily',
        times: ['morning'],
        startDate: new Date().toISOString(),
      }));
    
    if (newMeds.length > 0) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, ...newMeds]
      }));
    }
    
    setPendingExtractedMeds([]);
  };

  const updatePendingMedDosage = (index: number, dosage: string) => {
    setPendingExtractedMeds(prev => prev.map((med, i) => 
      i === index ? { ...med, dosage } : med
    ));
  };

  const removePendingMedication = (index: number) => {
    setPendingExtractedMeds(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.name || !formData.age || !formData.sex) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        return true;
      
      case 2:
        return true;
      
      case 3:
        return true;
      
      case 4:
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await signup({
        ...formData,
        age: parseInt(formData.age),
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      } as Parameters<typeof signup>[0]);

      router.push('/');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Let&apos;s get started</h2>
            <p className={styles.stepDescription}>Create your account to access your health dashboard</p>
            
            <div className={styles.formGrid}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                leftIcon={<User size={20} />}
                showVoiceInput
                onVoiceInput={(v) => setFormData(prev => ({ ...prev, name: v }))}
                required
              />
              
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                leftIcon={<Mail size={20} />}
                autoComplete="email"
                required
              />
              
              <Input
                type="number"
                label="Age"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                min="1"
                max="150"
                required
              />
              
              <Select
                label="Biological Sex"
                options={sexOptions}
                placeholder="Select sex"
                value={formData.sex}
                onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value as 'male' | 'female' | 'other' }))}
                required
              />
              
              <Input
                type="password"
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                leftIcon={<Lock size={20} />}
                helperText="At least 8 characters"
                required
              />
              
              <Input
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                leftIcon={<Lock size={20} />}
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Physical Information</h2>
            <p className={styles.stepDescription}>This helps us provide personalized health recommendations</p>
            
            <div className={styles.formGrid}>
              <Input
                type="number"
                label="Height (cm)"
                placeholder="Enter your height"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                min="50"
                max="300"
              />
              
              <Input
                type="number"
                label="Weight (kg)"
                placeholder="Enter your weight"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                min="20"
                max="500"
              />
              
              <Select
                label="Ethnicity"
                options={ethnicities.map(e => ({ value: e, label: e }))}
                placeholder="Select ethnicity"
                value={formData.ethnicity}
                onChange={(e) => setFormData(prev => ({ ...prev, ethnicity: e.target.value }))}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Medical History</h2>
            <p className={styles.stepDescription}>Help us understand your health background</p>
            
            <div className={styles.listSection}>
              <h3 className={styles.listTitle}>Current Health Conditions</h3>
              <div className={styles.inputWithAction}>
                <Input
                  placeholder="e.g., Type 2 Diabetes, Hypertension"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onVoiceInput={(v) => setNewCondition(v)}
                />
                <Button type="button" variant="secondary" onClick={() => addCondition('current')}>
                  <Plus size={20} />
                </Button>
              </div>
              <div className={styles.tagList}>
                {formData.currentConditions.map((condition, index) => (
                  <span key={index} className={styles.tag}>
                    {condition}
                    <button onClick={() => removeCondition('current', index)}><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
            
            <div className={styles.listSection}>
              <h3 className={styles.listTitle}>
                <AlertCircle size={18} />
                Known Allergies
              </h3>
              <div className={styles.inputWithAction}>
                <Input
                  placeholder="e.g., Penicillin, Sulfa drugs"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onVoiceInput={(v) => setNewAllergy(v)}
                />
                <Button type="button" variant="secondary" onClick={() => addCondition('past')}>
                  <Plus size={20} />
                </Button>
              </div>
              <div className={styles.tagList}>
                {formData.allergies.map((allergy, index) => (
                  <span key={index} className={`${styles.tag} ${styles.dangerTag}`}>
                    {allergy}
                    <button onClick={() => removeCondition('past', index)}><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Medications</h2>
            <p className={styles.stepDescription}>Upload a prescription or add medications manually</p>
            
            <div className={styles.uploadSection}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className={styles.fileInput}
              />
              
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingOCR}
              >
                {isProcessingOCR ? (
                  <>
                    <div className={styles.spinner}></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera size={32} />
                    <span>Take Photo</span>
                  </>
                )}
              </button>
              
              <span className={styles.orDivider}>or</span>
              
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingOCR}
              >
                <Upload size={32} />
                <span>Upload from Gallery</span>
              </button>
            </div>
            
            {extractedText && (
              <Card className={styles.extractedCard}>
                <h3>Extracted Prescription Data</h3>
                <pre className={styles.extractedText}>{extractedText}</pre>
                
                <div className={styles.detectedMeds}>
                  <h4>Detected Medications:</h4>
                  <ul>
                    {detectedMedications.map((med, index) => (
                      <li key={index}>{med}</li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.extractedActions}>
                  <Button variant="secondary" onClick={() => {
                    setExtractedText('');
                    setDetectedMedications([]);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={confirmExtractedMedications}>
                    <Check size={20} />
                    Add to My Medications
                  </Button>
                </div>
              </Card>
            )}
            
            {pendingExtractedMeds.length > 0 && (
              <div className={styles.pendingMedsSection}>
                <h3 className={styles.sectionSubtitle}>
                  <span className={styles.autoFilledBadge}>Auto-filled from prescription</span>
                </h3>
                <p className={styles.editHint}>Review and edit dosages below, then add each medication</p>
                {pendingExtractedMeds.map((med, index) => (
                  <Card key={index} className={styles.pendingMedCard}>
                    <div className={styles.pendingMedInfo}>
                      <strong>{med.name}</strong>
                    </div>
                    <Input
                      placeholder="Dosage (e.g., 500mg)"
                      value={med.dosage}
                      onChange={(e) => updatePendingMedDosage(index, e.target.value)}
                      className={styles.pendingDosageInput}
                    />
                    <div className={styles.pendingMedActions}>
                      <Button size="sm" onClick={() => addPendingMedication(index)}>
                        <Check size={16} />
                        Add
                      </Button>
                      <button 
                        className={styles.removeButton} 
                        onClick={() => removePendingMedication(index)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </Card>
                ))}
                <Button 
                  variant="secondary" 
                  onClick={addAllPendingMedications}
                  className={styles.addAllButton}
                >
                  Add All Medications
                </Button>
              </div>
            )}
            
            <div className={styles.manualAddSection}>
              <h3 className={styles.manualAddTitle}>Or add manually</h3>
              <div className={styles.medicationForm}>
                <div className={styles.medicationInputGroup}>
                  <Input
                    label="Medication Name"
                    placeholder="Start typing to search..."
                    value={newMedication.name}
                    onChange={(e) => handleMedicationNameChange(e.target.value)}
                  />
                  {drugSuggestions.length > 0 && (
                    <ul className={styles.suggestions}>
                      {drugSuggestions.map((drug, index) => (
                        <li key={index} onClick={() => {
                          setNewMedication(prev => ({ ...prev, name: drug.name }));
                          setDrugSuggestions([]);
                        }}>
                          <strong>{drug.name}</strong>
                          <span>{drug.category}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <Input
                  label="Dosage"
                  placeholder="e.g., 500mg, 10ml"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                />
                
                <Button type="button" variant="secondary" onClick={() => addMedication(true)}>
                  <Plus size={20} />
                  Add Medication
                </Button>
              </div>
            </div>
            
            {formData.currentMedications.length > 0 && (
              <div className={styles.medicationList}>
                <h3>Current Medications</h3>
                {formData.currentMedications.map((med, index) => (
                  <Card key={med.id} className={styles.medicationCard}>
                    <div className={styles.medicationInfo}>
                      <strong>{med.name}</strong>
                      <span>{med.dosage}</span>
                    </div>
                    <button className={styles.removeButton} onClick={() => removeMedication('current', index)}>
                      <X size={18} />
                    </button>
                  </Card>
                ))}
              </div>
            )}
            
            {formData.currentMedications.length === 0 && pendingExtractedMeds.length === 0 && (
              <div className={styles.skipNotice}>
                <p>No medications? You can skip this step and add medications later.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/login" className={styles.backLink}>
          Already have an account? Sign in
        </Link>
      </div>

      <div className={styles.wizardContainer}>
        <div className={styles.progressBar}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div
                key={step.id}
                className={`${styles.stepIndicator} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
              >
                <div className={styles.stepCircle}>
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={styles.stepLabel}>{step.title}</span>
              </div>
            );
          })}
          <div className={styles.progressLine}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <Card className={styles.formCard}>
          {error && (
            <Alert variant="danger" onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}

          {renderStep()}

          <div className={styles.actions}>
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading}>
                Create Account
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
