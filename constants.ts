import { Language, LegalTopic } from "./types";

export const SYSTEM_INSTRUCTION_TEXT = `You are NyayaSetu, an empathetic and knowledgeable AI legal assistant for India. 
Your goal is to help underserved users understand their legal rights, explain complex procedures in simple language, and evaluate basic eligibility for schemes like Legal Aid.

KEY GUIDELINES:
1.  **Simplicity**: Use simple, non-legalistic language (ELI5). Avoid Latin maxims unless explained immediately.
2.  **Safety & Disclaimer**: ALWAYS imply you are an AI, not a lawyer. For serious matters, advise consulting a human advocate or visiting a DLSA (District Legal Services Authority).
3.  **Context**: Be aware of Indian laws (BNS - Bharatiya Nyaya Sanhita, BNSS, IPC, etc.).
4.  **Empathy**: Many users may be distressed. Be supportive and patient.
5.  **Structure**: Break down answers into steps. Use bullet points.
6.  **Language**: If the user speaks a specific Indian language, reply in that language. 

SPECIFIC KNOWLEDGE:
- **Legal Aid**: Explain eligibility under Section 12 of the Legal Services Authorities Act, 1987 (women, children, SC/ST, low income).
- **FIR**: Explain how to file a Zero FIR or e-FIR.
- **Domestic Violence**: Explain protection orders under PWDVA 2005.
- **Consumer Rights**: Consumer Protection Act 2019.

When using the 'evaluate_eligibility' tool or flow, ask simple Yes/No questions to determine if they qualify for free legal aid.`;

export const TOPICS: LegalTopic[] = [
  {
    id: 'fir',
    title: 'File a Complaint',
    description: 'Learn how to file an FIR or Police Complaint.',
    icon: 'FileText',
    prompt: 'How do I file a police complaint or FIR in India? keep it simple.'
  },
  {
    id: 'divorce',
    title: 'Family & Marriage',
    description: 'Divorce, maintenance, and child custody.',
    icon: 'HeartHandshake',
    prompt: 'What are the basic rights in a divorce or maintenance case in India?'
  },
  {
    id: 'property',
    title: 'Property Disputes',
    description: 'Land issues, rent, and inheritance.',
    icon: 'Home',
    prompt: 'How can I resolve a property dispute with my family?'
  },
  {
    id: 'consumer',
    title: 'Consumer Rights',
    description: 'Defective products and service issues.',
    icon: 'ShoppingBag',
    prompt: 'I bought a defective product. How do I file a consumer court case?'
  },
  {
    id: 'legalaid',
    title: 'Free Legal Aid',
    description: 'Check if you qualify for free government lawyers.',
    icon: 'Scale',
    prompt: 'Who is eligible for free legal aid in India under the NALSA act?'
  }
];

export const LANGUAGES = [
  { value: Language.ENGLISH, label: 'English' },
  { value: Language.HINDI, label: 'हिंदी (Hindi)' },
  { value: Language.TAMIL, label: 'தமிழ் (Tamil)' },
  { value: Language.TELUGU, label: 'తెలుగు (Telugu)' },
  { value: Language.BENGALI, label: 'বাংলা (Bengali)' },
  { value: Language.MARATHI, label: 'मराठी (Marathi)' },
];