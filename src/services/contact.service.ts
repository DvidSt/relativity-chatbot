import { ContactInfo } from '../types';
import { logContactToSheet } from './sheets.service';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateContactInfo(info: Partial<ContactInfo>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!info.name || info.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!info.email || !validateEmail(info.email)) {
    errors.push('Valid email address is required');
  }

  if (!info.organization || info.organization.trim().length < 2) {
    errors.push('Organization must be at least 2 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function collectContactInfo(question: string): Promise<ContactInfo> {
  // This will be handled by the chat flow in the frontend
  // Returns validated contact info
  return {
    name: '',
    email: '',
    organization: '',
    question,
    timestamp: new Date().toISOString()
  };
}

export async function submitContactInfo(contact: ContactInfo): Promise<void> {
  const validation = validateContactInfo(contact);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  await logContactToSheet(contact);
}