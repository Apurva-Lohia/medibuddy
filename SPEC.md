# MediCare Companion - Application Specification

## 1. Concept & Vision

A warm, trustworthy healthcare companion designed specifically for elderly users and their carers. The app feels like a gentle conversation with a knowledgeable pharmacist friend — never clinical or intimidating. Every interaction prioritizes clarity, accessibility, and reassurance. The design evokes the calm reassurance of a well-organized medicine cabinet combined with modern technology that truly understands the needs of aging users.

---

## 2. Design Language

### Aesthetic Direction
**"Calm Clinical Warmth"** — Inspired by Scandinavian healthcare design. Clean, spacious interfaces with soft organic shapes that feel approachable rather than sterile. Think of a modern pharmacy with natural wood accents and warm lighting, translated into digital form.

### Color Palette
```css
/* Primary - Healing Teal */
--color-primary: oklch(65% 0.12 185);        /* Main brand color */
--color-primary-light: oklch(78% 0.08 185);   /* Hover states */
--color-primary-dark: oklch(52% 0.14 185);    /* Active states */

/* Accent - Warm Amber */
--color-accent: oklch(72% 0.15 70);          /* CTAs, highlights */
--color-accent-light: oklch(85% 0.10 70);     /* Subtle accents */

/* Semantic */
--color-success: oklch(65% 0.15 145);        /* Safe/OK */
--color-warning: oklch(75% 0.15 85);          /* Caution */
--color-danger: oklch(60% 0.18 25);          /* Alert/Error */

/* Neutrals - Warm tinted */
--gray-50: oklch(98% 0.005 60);
--gray-100: oklch(95% 0.008 60);
--gray-200: oklch(90% 0.012 60);
--gray-300: oklch(82% 0.018 60);
--gray-400: oklch(65% 0.025 60);
--gray-500: oklch(45% 0.030 60);
--gray-600: oklch(35% 0.025 60);
--gray-700: oklch(25% 0.020 60);
--gray-800: oklch(18% 0.015 60);
--gray-900: oklch(12% 0.010 60);

/* Surfaces */
--surface-primary: var(--gray-50);
--surface-secondary: white;
--surface-elevated: white;
```

### Typography
- **Display/Headlines**: `Fraunces` — A warm, organic serif with optical sizing. Conveys trustworthiness and heritage.
- **Body/UI**: `Source Sans 3` — Highly readable, clean sans-serif. Excellent for longer text and accessibility.
- **Fallbacks**: Georgia, system-ui, sans-serif

```css
/* Type Scale - Base 18px for elderly readability */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
--text-lg: clamp(1.125rem, 1rem + 0.6vw, 1.375rem);
--text-xl: clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem);
--text-2xl: clamp(1.75rem, 1.5rem + 1.2vw, 2.25rem);
--text-3xl: clamp(2.25rem, 1.8rem + 2vw, 3rem);

/* Line heights optimized for readability */
--leading-tight: 1.25;
--leading-normal: 1.6;
--leading-relaxed: 1.8;
```

### Spatial System
```css
/* 8px base unit, generous spacing for touch targets */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.5rem;     /* 24px */
--space-6: 2rem;       /* 32px */
--space-8: 3rem;       /* 48px */
--space-10: 4rem;      /* 64px */
--space-12: 6rem;      /* 96px */

/* Minimum touch target: 48px for accessibility */
--touch-target-min: 48px;
```

### Motion Philosophy
- **Entrance animations**: Gentle fade-up (opacity + translateY), 300ms ease-out-quart
- **Transitions**: 200ms for micro-interactions, 400ms for page transitions
- **Loading states**: Subtle pulse animation, never jarring
- **Focus states**: Clear outline with 2px offset, gentle scale on hover
- **Respect reduced motion**: All animations respect `prefers-reduced-motion`

### Visual Assets
- **Icons**: Lucide React — rounded, friendly aesthetic with 2px stroke weight
- **Illustrations**: Simple line art with rounded corners, teal/amber palette
- **Decorative elements**: Soft organic shapes, subtle gradients, no harsh shadows
- **Photography style**: Warm, natural lighting, diverse elderly representation

---

## 3. Layout & Structure

### Information Architecture
```
/                     → Dashboard (home)
/signup               → Registration with health profile
/login                → Authentication
/account              → User profile management
/chatbot              → Drug interaction chatbot
/calendar             → Medicine calendar
/calendar/sync        → External calendar integration
```

### Page Structure

#### Dashboard (/)
- Hero greeting with user's name and today's date
- Quick action cards: "Add Medicine", "Check Interactions", "View Calendar"
- Today's medication schedule preview
- Recent chatbot interactions summary
- Upcoming appointments/reminders

#### Signup (/signup)
- Multi-step wizard with progress indicator
- Step 1: Basic info (name, email, password, age, sex)
- Step 2: Physical profile (height, weight, ethnicity)
- Step 3: Medical history (current conditions, past conditions)
- Step 4: Medication profile (current drugs, past drugs)
- Step 5: Prescription upload (optional) with OCR processing
- Voice input available on all fields

#### Drug Interaction Chatbot (/chatbot)
- Chat interface with clear message bubbles
- Message input with voice recording option
- Image upload for prescriptions
- Side panel showing current medications
- Results displayed as clear cards with severity indicators

#### Medicine Calendar (/calendar)
- Monthly view with medication indicators
- Daily detail view on date selection
- Integration settings panel (Google Calendar, Apple Calendar, Outlook)
- Reminder configuration

#### Account (/account)
- Profile summary card
- Editable sections: Personal, Medical, Medications
- Change password
- Notification preferences
- Data export option

### Responsive Strategy
- **Mobile-first**: All interactions work on 375px+
- **Tablet**: 768px+ allows side-by-side panels
- **Desktop**: 1024px+ full dashboard layout
- **Large screens**: 1440px+ max-width container at 1280px

---

## 4. Features & Interactions

### 4.1 Drug Interaction Chatbot

#### Core Functionality
1. **Text Input**: User enters drug/medicine name(s)
2. **Image Upload**: User uploads prescription image
   - OCR extracts medication names
   - Extracted names auto-populate the input
   - User can edit/confirm extracted list
3. **Interaction Check**:
   - Drug-drug interactions
   - Ingredient allergies (based on user profile)
   - Duplicate therapy warnings

#### Interaction Results
| Severity | Visual Treatment | Action |
|----------|-----------------|--------|
| **Safe** | Green checkmark, calming message | "These medications can be taken together" |
| **Caution** | Amber warning, detailed explanation | "Take these 2 hours apart" |
| **Danger** | Red alert, prominent display | "Do not combine - consult doctor" |

#### Success Flow
- If all clear: Show confirmation card
- "Add to my medications?" button
- On confirm: Add to medicine calendar and user profile
- Show success toast with medication added

#### Error Handling
- Drug not recognized: "I couldn't find 'X' in my database. Please check the spelling or try the generic name."
- Partial recognition: Show suggestions for similar drugs
- Image too blurry: "I couldn't read the prescription clearly. Could you try a clearer photo?"

### 4.2 Medicine Calendar

#### Views
- **Month View**: Grid with medication indicators
- **Week View**: Horizontal timeline
- **Day View**: Detailed schedule with times

#### Medication Display
- Pill icon with medication name
- Time (morning/afternoon/evening/night)
- Dosage and instructions
- Take/miss/skip buttons

#### External Calendar Integration
- **Google Calendar**: OAuth2 flow
- **Apple Calendar (iCal)**: ICS feed URL
- **Microsoft Outlook**: OAuth2 flow
- Sync medication events as all-day or timed events

#### Reminder Configuration
- Push notifications (in-app)
- Email reminders
- SMS reminders (future)
- Customizable reminder times

### 4.3 Voice Input

#### Supported Fields
- All text inputs in signup/account
- Chatbot message input
- Drug name search

#### Interaction
- Microphone icon next to input
- Tap to start recording
- Visual waveform during recording
- Tap again to stop
- Playback preview before confirming

#### Accessibility
- Voice feedback on successful input
- Clear error messages for unrecognized speech

### 4.4 Prescription Image Upload

#### Supported Formats
- JPEG, PNG, WebP
- Max 10MB
- Camera or gallery upload

#### OCR Processing
1. Image uploaded → show processing spinner
2. OCR extracts text → display extracted content
3. Drug names highlighted → user confirms/edits
4. Confirmed drugs added to input field

#### Error States
- No text detected: "I couldn't find any text in this image"
- Low confidence: "Some words weren't clear, please check"

---

## 5. Component Inventory

### Button
- **Variants**: primary, secondary, ghost, danger
- **Sizes**: sm (40px), md (48px), lg (56px)
- **States**: default, hover (+2% lightness, subtle scale), active (-2% lightness), disabled (50% opacity), loading (spinner)

### Input Field
- **Types**: text, email, password, number, date, tel
- **Height**: 56px minimum (touch-friendly)
- **States**: default, focus (teal ring), error (red ring + message), disabled
- **Features**: label above, helper text below, optional icon left/right

### Card
- **Variants**: default (white), elevated (shadow), outlined
- **Padding**: 24px default, 32px for feature cards
- **Border radius**: 16px

### Chat Bubble
- **User**: Right-aligned, primary color background, white text
- **Bot**: Left-aligned, gray background, dark text
- **System**: Centered, italic, muted color

### Alert Banner
- **Variants**: info (teal), success (green), warning (amber), error (red)
- **Structure**: Icon + message + optional action
- **Animation**: Slide down from top, 300ms

### Modal
- **Overlay**: 50% black with backdrop blur
- **Content**: Centered, max-width 500px, padding 32px
- **Close**: X button top-right, click outside to close

### Progress Indicator (Signup)
- Horizontal stepper with numbered circles
- Completed steps: teal fill + checkmark
- Current step: teal ring
- Future steps: gray ring

### Calendar Day Cell
- **Default**: Light background, date number
- **Today**: Teal ring
- **Has medication**: Colored dot below date
- **Selected**: Teal background, white text

### Medication Card
- Pill icon
- Name (bold), dosage (regular)
- Time badge
- Take/Skip/Miss action buttons

---

## 6. Technical Approach

### Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + CSS Variables
- **State**: React Context + useReducer
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Calendar**: Custom implementation with date-fns
- **OCR**: Tesseract.js (client-side)
- **Voice**: Web Speech API

### Data Models

#### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: "male" | "female" | "other";
  height?: number;
  weight?: number;
  ethnicity?: string;
  currentConditions: string[];
  pastConditions: string[];
  currentMedications: Medication[];
  pastMedications: Medication[];
  allergies: string[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Medication
```typescript
interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: "daily" | "twice_daily" | "weekly" | "as_needed";
  times: ("morning" | "afternoon" | "evening" | "night")[];
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  pharmacy?: string;
  refillDate?: Date;
}
```

#### Drug Interaction
```typescript
interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "safe" | "caution" | "danger";
  description: string;
  recommendation: string;
}
```

---

## 7. Accessibility Requirements

- **WCAG 2.1 AA compliance minimum**
- **Font size**: Minimum 16px body, scalable up to 200%
- **Color contrast**: 4.5:1 minimum for body text
- **Focus indicators**: Visible 2px outline
- **Touch targets**: Minimum 48x48px
- **Screen reader**: Semantic HTML, ARIA labels
- **Keyboard navigation**: Full functionality without mouse
- **Reduced motion**: Respect prefers-reduced-motion
- **Error identification**: Clear text, not just color

---

## 8. Future Features (Not in MVP)

- Virtual Pharmacist chat with AI
- Medication delivery integration
- Pill reminder device sync
- Carer accounts with permissions
- Health trend analytics
- Insurance integration
- Telehealth appointments
