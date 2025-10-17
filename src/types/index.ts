export interface ReleaseNote {
  version: string;
  date: string;
  feature: string;
  description: string;
  category: string;
}

export interface ChatResponse {
  answer: string;
  needsContact: boolean;
  confidence: number;
}

export interface ContactInfo {
  name: string;
  email: string;
  organization: string;
  question: string;
  timestamp: string;
}

export interface ChatSession {
  context: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  lastActivity: Date;
}