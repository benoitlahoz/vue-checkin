export interface AirportEvent {
  type: 'check-in' | 'check-out' | 'update' | 'plugin-execute' | 'clear';
  timestamp: number;
  deskId: string;
  childId?: string | number;
  pluginName?: string;
  duration?: number;
  data?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  registrySize?: number;
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
    lastOperationTime?: number;
  };
  lifecycle?: {
    createdAt: string;
    lastCheckIn?: string;
    lastCheckOut?: string;
    lastUpdate?: string;
  };
  stats?: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalUpdates: number;
    activePlugins: number;
  };
}
