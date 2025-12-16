export interface TranslationHistoryItem {
  id: string;
  original: string;
  translated: string;
  timestamp: number;
  direction: TranslationDirection;
}

export enum TranslationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  STREAMING = 'STREAMING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type TranslationDirection = 'HI_TO_EN' | 'EN_TO_HI';

export interface Script {
  id: string;
  title: string;
  content: string; // HTML content
  lastModified: number;
}

export type ViewMode = 'TRANSLATOR' | 'EDITOR';