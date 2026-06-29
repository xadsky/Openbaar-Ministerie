export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface DropOffLocation {
  id: string;
  name: string;
  district: string;
  address?: string;
}

export const LOCATIONS: DropOffLocation[] = [
  { id: '1', name: 'Politiepost Noord', district: 'Noord' },
  { id: '2', name: 'Hoofdbureau Oranjestad', district: 'Oranjestad' },
  { id: '3', name: 'Politiepost Santa Cruz', district: 'Santa Cruz' },
  { id: '4', name: 'Politiepost Dakota', district: 'Dakota' },
  { id: '5', name: 'Politiepost Savaneta', district: 'Savaneta' },
];
