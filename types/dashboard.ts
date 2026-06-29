export interface SessionMetadata {
  browser: string;
  language: string;
  os: string;
}

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text?: string;
  timestamp: string;
}

export interface SessionRecord {
  sessionId: string;
  duration: number; // in seconds
  transcripts: TranscriptEntry[];
  metadata: SessionMetadata;
  timestamp?: string; // from backend
}
