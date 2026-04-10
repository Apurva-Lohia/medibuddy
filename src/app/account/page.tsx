'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { User, Mail, Calendar, Heart, Pill, AlertCircle, Edit2, Save, X, Plus, Trash2, Camera, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import Alert from '@/components/ui/Alert/Alert';
import { Medication } from '@/types';
import styles from './page.module.css';

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ethnicities = [
  'Caucasian', 'African American', 'Hispanic/Latino', 'Asian', 
  'South Asian', 'Middle Eastern', 'Pacific Islander', 'Native American', 'Other'
];

export default function Account() {
  const router = useRouter();
  const { state, updateUser, addMedication, removeMedication, logout } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: 'daily', times: ['morning'] as ('morning' | 'afternoon' | 'evening' | 'night')[] });
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: '' as 'male' | 'female' | 'other' | '',
    height: '',
    weight: '',
    ethnicity: '',
  });

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/login');
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  useEffect(() => {
    if (state.user) {
      setFormData({
        name: state.user.name,
        age: state.user.age.toString(),
        sex: state.user.sex,
        height: state.user.height?.toString() || '',
        weight: state.user.weight?.toString() || '',
        ethnicity: state.user.ethnicity || '',
      });
    }
  }, [state.user]);

  if (state.isLoading || !state.isAuthenticated || !state.user) {
    return null;
  }

  const handleSaveProfile = () => {
    updateUser({
      name: formData.name,
      age: parseInt(formData.age),
      sex: formData.sex || undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      ethnicity: formData.ethnicity || undefined,
    });
    setEditSection(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAddCondition = (type: 'current' | 'past') => {
    if (newItem.trim()) {
      updateUser({
        [type === 'current' ? 'currentConditions' : 'pastConditions']: [
          ...state.user![type === 'current' ? 'currentConditions' : 'pastConditions'],
          newItem.trim()
        ]
      });
      setNewItem('');
      setShowAddCondition(false);
      setShowAddAllergy(false);
    }
  };

  const handleRemoveCondition = (type: 'current' | 'past', index: number) => {
    updateUser({
      [type === 'current' ? 'currentConditions' : 'pastConditions']: 
        state.user![type === 'current' ? 'currentConditions' : 'pastConditions'].filter((_, i) => i !== index)
    });
  };

  const handleAddAllergy = () => {
    if (newItem.trim()) {
      updateUser({
        allergies: [...state.user!.allergies, newItem.trim()]
      });
      setNewItem('');
      setShowAddAllergy(false);
    }
  };

  const handleRemoveAllergy = (index: number) => {
    updateUser({
      allergies: state.user!.allergies.filter((_, i) => i !== index)
    });
  };

  const handleAddMedication = () => {
    if (newMedication.name.trim() && newMedication.dosage.trim()) {
      const medication: Medication = {
        id: uuidv4(),
        name: newMedication.name.trim(),
        dosage: newMedication.dosage.trim(),
        frequency: newMedication.frequency as Medication['frequency'],
        times: newMedication.times,
        startDate: new Date().toISOString(),
      };
      addMedication(medication);
      setNewMedication({ name: '', dosage: '', frequency: 'daily', times: ['morning'] });
      setShowAddMedication(false);
    }
  };

  const handleRemoveMedication = (id: string) => {
    removeMedication(id);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className={styles.container}>
      {showSuccess && (
        <Alert variant="success" className={styles.successAlert}>
          <Check size={20} />
          Profile updated successfully!
        </Alert>
      )}

      <div className={styles.header}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {state.user.avatar ? (
              <img src={state.user.avatar} alt={state.user.name} />
            ) : (
              <span>{state.user.name.charAt(0).toUpperCase()}</span>
            )}
            <button className={styles.avatarEdit}>
              <Camera size={16} />
            </button>
          </div>
          <div className={styles.profileInfo}>
            <h1>{state.user.name}</h1>
            <p>Member since {format(new Date(state.user.createdAt), 'MMMM yyyy')}</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <Card className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <User size={20} />
                <h2>Personal Information</h2>
              </div>
              {editSection !== 'personal' ? (
                <Button variant="ghost" onClick={() => setEditSection('personal')}>
                  <Edit2 size={18} />
                  Edit
                </Button>
              ) : (
                <div className={styles.editActions}>
                  <Button variant="ghost" onClick={() => setEditSection(null)}>
                    <X size={18} />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    <Save size={18} />
                    Save
                  </Button>
                </div>
              )}
            </div>

            {editSection === 'personal' ? (
              <div className={styles.editForm}>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="number"
                  label="Age"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                />
                <Select
                  label="Biological Sex"
                  options={sexOptions}
                  value={formData.sex}
                  onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value as 'male' | 'female' | 'other' }))}
                />
                <Input
                  type="number"
                  label="Height (cm)"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                />
                <Input
                  type="number"
                  label="Weight (kg)"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                />
                <Select
                  label="Ethnicity"
                  options={ethnicities.map(e => ({ value: e, label: e }))}
                  value={formData.ethnicity}
                  onChange={(e) => setFormData(prev => ({ ...prev, ethnicity: e.target.value }))}
                />
              </div>
            ) : (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{state.user.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Age</span>
                  <span className={styles.infoValue}>{state.user.age} years</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Sex</span>
                  <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>{state.user.sex}</span>
                </div>
                {state.user.height && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Height</span>
                    <span className={styles.infoValue}>{state.user.height} cm</span>
                  </div>
                )}
                {state.user.weight && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Weight</span>
                    <span className={styles.infoValue}>{state.user.weight} kg</span>
                  </div>
                )}
                {state.user.ethnicity && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Ethnicity</span>
                    <span className={styles.infoValue}>{state.user.ethnicity}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Heart size={20} />
                <h2>Health Conditions</h2>
              </div>
              <Button variant="ghost" onClick={() => setShowAddCondition(true)}>
                <Plus size={18} />
                Add
              </Button>
            </div>

            <div className={styles.tagSection}>
              <h3>Current Conditions</h3>
              {state.user.currentConditions.length === 0 ? (
                <p className={styles.emptyText}>No conditions listed</p>
              ) : (
                <div className={styles.tagList}>
                  {state.user.currentConditions.map((condition, index) => (
                    <span key={index} className={styles.tag}>
                      {condition}
                      <button onClick={() => handleRemoveCondition('current', index)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.tagSection}>
              <h3>
                <AlertCircle size={16} />
                Allergies
              </h3>
              {state.user.allergies.length === 0 ? (
                <p className={styles.emptyText}>No allergies listed</p>
              ) : (
                <div className={styles.tagList}>
                  {state.user.allergies.map((allergy, index) => (
                    <span key={index} className={`${styles.tag} ${styles.dangerTag}`}>
                      {allergy}
                      <button onClick={() => handleRemoveAllergy(index)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Pill size={20} />
                <h2>Current Medications</h2>
              </div>
              <Button variant="ghost" onClick={() => setShowAddMedication(true)}>
                <Plus size={18} />
                Add
              </Button>
            </div>

            {state.user.currentMedications.length === 0 ? (
              <div className={styles.emptyState}>
                <Pill size={48} />
                <p>No medications added yet</p>
                <Button onClick={() => router.push('/chatbot')}>
                  Check Drug Interactions
                </Button>
              </div>
            ) : (
              <div className={styles.medicationList}>
                {state.user.currentMedications.map((med) => (
                  <div key={med.id} className={styles.medicationItem}>
                    <div className={styles.medicationInfo}>
                      <h4>{med.name}</h4>
                      <p>{med.dosage} - {med.frequency.replace('_', ' ')}</p>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveMedication(med.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className={styles.sideColumn}>
          <Card className={styles.dangerCard}>
            <h3>Account Actions</h3>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </Card>

          <Card className={styles.helpCard}>
            <h3>Need Help?</h3>
            <p>Contact our support team for assistance with your account or medications.</p>
            <Button variant="secondary">
              Contact Support
            </Button>
          </Card>
        </div>
      </div>

      {showAddCondition && (
        <div className={styles.modalOverlay} onClick={() => setShowAddCondition(false)}>
          <Card className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Health Condition</h3>
              <button onClick={() => setShowAddCondition(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <Input
                label="Condition Name"
                placeholder="e.g., Type 2 Diabetes"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <div className={styles.modalActions}>
                <Button variant="secondary" onClick={() => setShowAddCondition(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleAddCondition('current')}>
                  Add Condition
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showAddAllergy && (
        <div className={styles.modalOverlay} onClick={() => setShowAddAllergy(false)}>
          <Card className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Allergy</h3>
              <button onClick={() => setShowAddAllergy(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <Input
                label="Allergy"
                placeholder="e.g., Penicillin"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
              <div className={styles.modalActions}>
                <Button variant="secondary" onClick={() => setShowAddAllergy(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAllergy}>
                  Add Allergy
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showAddMedication && (
        <div className={styles.modalOverlay} onClick={() => setShowAddMedication(false)}>
          <Card className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Medication</h3>
              <button onClick={() => setShowAddMedication(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <Input
                label="Medication Name"
                placeholder="e.g., Metformin"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="Dosage"
                placeholder="e.g., 500mg"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
              />
              <Select
                label="Frequency"
                options={[
                  { value: 'daily', label: 'Once daily' },
                  { value: 'twice_daily', label: 'Twice daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'as_needed', label: 'As needed' },
                ]}
                value={newMedication.frequency}
                onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value as Medication['frequency'] }))}
              />
              <div className={styles.modalActions}>
                <Button variant="secondary" onClick={() => setShowAddMedication(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMedication}>
                  Add Medication
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
