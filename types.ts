export enum AppMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  BENGALI = 'Bengali',
  MARATHI = 'Marathi'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface LegalTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
}