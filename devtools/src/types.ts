export interface AirportEvent {
  type: 'check-in' | 'check-out' | 'update' | 'plugin-execute';
  timestamp: number;
  deskId: string;
  childId?: string;
  pluginName?: string;
  duration?: number;
  data?: Record<string, unknown>;
}

export interface RegistryNode {
  id: string;
  label: string;
  type: 'desk' | 'child';
  children?: RegistryNode[];
  tags?: Array<{ label: string; textColor: number; backgroundColor: number }>;
}

export interface InspectorState {
  id: string;
  type: string;
  metadata?: Record<string, unknown>;
  plugins?: string[];
  state?: Record<string, unknown>;
  performance?: {
    checkInTime?: number;
    checkOutTime?: number;
    updateCount?: number;
  };
}
