/**
 * H.O.L.M.E.V Core Shared Type Definitions
 */

// --- Voice Subsystem Types ---
export type VoiceState =
  | 'IDLE'
  | 'MIC_INITIALIZING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'DEACTIVATED'
  | 'ERROR';

export type VoiceStyle =
  | 'NORMAL'
  | 'FRIENDLY'
  | 'HAPPY'
  | 'EXCITED'
  | 'SERIOUS'
  | 'CONCERNED'
  | 'CALM'
  | 'PLAYFUL';

export interface VoiceProfile {
  id: string;
  name: string;
  pitch: number; // 0.5 - 1.5
  speakingRate: number; // 0.5 - 2.0
  expressiveness: number; // 0 - 1
  style: VoiceStyle;
  language: string;
  isCustom: boolean;
}

// --- Face & Mood Perception Types ---
export type UserMood = 'HAPPY' | 'SAD' | 'ANGRY' | 'NEUTRAL' | 'TIRED' | 'SURPRISED';

export interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  mood: UserMood;
  moodConfidence: number;
  landmarksCount: number;
  timestamp: number;
}

// --- Hand Gesture Types ---
export type GestureType =
  | 'NONE'
  | 'OPEN_PALM'
  | 'POINT'
  | 'PINCH'
  | 'GRAB'
  | 'ROTATE'
  | 'SCALE'
  | 'RELEASE';

export interface GestureEvent {
  gesture: GestureType;
  x: number; // 0.0 - 1.0 normalized
  y: number;
  z?: number;
  confidence: number;
  hand: 'left' | 'right' | 'both';
  timestamp: number;
}

// --- Tool & Permission Matrix ---
export enum PermissionLevel {
  LEVEL_0_READONLY = 0,
  LEVEL_1_LOW_LOCAL = 1,
  LEVEL_2_DEVICE_NET = 2,
  LEVEL_3_SYSTEM_DESTRUCTIVE = 3,
  LEVEL_4_BLOCKED = 4,
}

export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  permissionLevel: PermissionLevel;
  parametersSchema: Record<string, any>;
  execute: (params: TParams, context?: any) => Promise<TResult>;
}

export interface ToolAuditLog {
  id: string;
  timestamp: number;
  toolName: string;
  arguments: Record<string, any>;
  permissionLevel: PermissionLevel;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  result?: any;
  error?: string;
  durationMs: number;
}

// --- Agent Planner Types ---
export type PlanStepStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface PlanStep {
  stepId: string;
  description: string;
  toolName: string;
  arguments: Record<string, any>;
  status: PlanStepStatus;
  result?: any;
  error?: string;
}

export interface ExecutionPlan {
  planId: string;
  goal: string;
  steps: PlanStep[];
  createdAt: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

// --- 3D Scene & Circuit System Types ---
export type Object3DType = 'cube' | 'sphere' | 'cylinder' | 'plane' | 'model' | 'circuit_component';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SceneObject3D {
  id: string;
  name: string;
  type: Object3DType;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  color?: string;
  metadata?: Record<string, any>;
}

export type CircuitComponentType =
  | 'battery'
  | 'resistor'
  | 'led'
  | 'switch'
  | 'capacitor'
  | 'diode'
  | 'transistor'
  | 'microcontroller';

export interface CircuitPort {
  id: string;
  name: string; // e.g. "V+", "V-", "IN", "OUT", "ANODE", "CATHODE"
  type: 'input' | 'output' | 'bidirectional';
}

export interface CircuitComponent {
  id: string;
  name: string;
  type: CircuitComponentType;
  position: Vector3D;
  ports: CircuitPort[];
  value?: number; // e.g. resistance in ohms, voltage in V
  unit?: string;
  state?: 'on' | 'off' | 'active' | 'blown';
}

export interface CircuitConnection {
  id: string;
  fromComponentId: string;
  fromPortId: string;
  toComponentId: string;
  toPortId: string;
  wireColor?: string;
}

export interface CircuitSimulationResult {
  valid: boolean;
  closedCircuit: boolean;
  totalResistanceOhms: number;
  currentAmps: number;
  voltageVolts: number;
  blownComponents: string[];
  messages: string[];
}

// --- Smart Home Device Types ---
export type DeviceType = 'light' | 'fan' | 'ac' | 'tv' | 'plug' | 'camera' | 'sensor';
export type DeviceProtocol = 'MQTT' | 'HTTP' | 'WEBSOCKET' | 'IR' | 'WIFI';

export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  type: DeviceType;
  protocol: DeviceProtocol;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  state: {
    power: boolean;
    speed?: number; // e.g. fan speed 1-5
    temperature?: number; // e.g. AC 16-30
    brightness?: number; // e.g. light 0-100
    custom?: Record<string, any>;
  };
  lastSeen: number;
}

// --- Web Search & Knowledge Retrieval ---
export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  retrievedAt: number;
}

export interface WebSearchResult {
  query: string;
  sources: SearchSource[];
  summary: string;
  timestamp: number;
}

// --- System Diagnostics & Service Status ---
export type ServiceHealthStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'NOT_CONFIGURED';

export interface SystemDiagnostics {
  microphone: ServiceHealthStatus;
  vad: ServiceHealthStatus;
  stt: ServiceHealthStatus;
  tts: ServiceHealthStatus;
  aiProvider: {
    name: string;
    status: ServiceHealthStatus;
    latencyMs: number;
  };
  pythonPerception: ServiceHealthStatus;
  pcAgent: ServiceHealthStatus;
  smartHomeGateway: ServiceHealthStatus;
  activeAudioSessions: number;
  lastUpdated: number;
}
