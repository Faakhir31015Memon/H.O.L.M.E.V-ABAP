import { BaseTool } from '@holmev/tool-sdk';
import { PermissionLevel, CircuitComponent, CircuitConnection, CircuitSimulationResult } from '@holmev/shared-types';
import { CircuitSimulator } from '../services/CircuitSimulator.js';

export interface CircuitToolParams {
  action: 'create_scene' | 'add_component' | 'remove_component' | 'connect' | 'simulate';
  componentType?: 'battery' | 'resistor' | 'led' | 'switch' | 'capacitor';
  componentName?: string;
  value?: number;
  fromId?: string;
  toId?: string;
}

export class CircuitTool extends BaseTool<CircuitToolParams, { success: boolean; components: CircuitComponent[]; connections: CircuitConnection[]; simulation?: CircuitSimulationResult; message: string }> {
  name = 'circuit_designer';
  description = 'Create, modify, connect, and simulate 3D electronic circuit components.';
  permissionLevel = PermissionLevel.LEVEL_1_LOW_LOCAL;
  parametersSchema = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['create_scene', 'add_component', 'remove_component', 'connect', 'simulate'] },
      componentType: { type: 'string', enum: ['battery', 'resistor', 'led', 'switch', 'capacitor'] },
      componentName: { type: 'string' },
      value: { type: 'number' },
      fromId: { type: 'string' },
      toId: { type: 'string' },
    },
    required: ['action'],
  };

  private components: Map<string, CircuitComponent> = new Map();
  private connections: CircuitConnection[] = [];

  constructor() {
    super();
    // Default initial template circuit (Battery + Resistor + LED)
    this.resetDefaultCircuit();
  }

  private resetDefaultCircuit() {
    this.components.clear();
    this.connections = [];

    const b1: CircuitComponent = {
      id: 'bat-1',
      name: '9V Battery',
      type: 'battery',
      value: 9,
      position: { x: -2, y: 0, z: 0 },
      ports: [
        { id: 'bat-1-pos', name: 'V+', type: 'output' },
        { id: 'bat-1-neg', name: 'V-', type: 'input' },
      ],
    };

    const r1: CircuitComponent = {
      id: 'res-1',
      name: '220Ω Resistor',
      type: 'resistor',
      value: 220,
      position: { x: 0, y: 0, z: 0 },
      ports: [
        { id: 'res-1-in', name: 'IN', type: 'input' },
        { id: 'res-1-out', name: 'OUT', type: 'output' },
      ],
    };

    const led1: CircuitComponent = {
      id: 'led-1',
      name: 'Red LED',
      type: 'led',
      position: { x: 2, y: 0, z: 0 },
      ports: [
        { id: 'led-1-anode', name: 'Anode (+)', type: 'input' },
        { id: 'led-1-cathode', name: 'Cathode (-)', type: 'output' },
      ],
    };

    this.components.set(b1.id, b1);
    this.components.set(r1.id, r1);
    this.components.set(led1.id, led1);

    this.connections.push({ id: 'conn-1', fromComponentId: 'bat-1', fromPortId: 'bat-1-pos', toComponentId: 'res-1', toPortId: 'res-1-in' });
    this.connections.push({ id: 'conn-2', fromComponentId: 'res-1', fromPortId: 'res-1-out', toComponentId: 'led-1', toPortId: 'led-1-anode' });
    this.connections.push({ id: 'conn-3', fromComponentId: 'led-1', fromPortId: 'led-1-cathode', toComponentId: 'bat-1', toPortId: 'bat-1-neg' });
  }

  async execute(params: CircuitToolParams): Promise<{ success: boolean; components: CircuitComponent[]; connections: CircuitConnection[]; simulation?: CircuitSimulationResult; message: string }> {
    const { action, componentType, componentName, value, fromId, toId } = params;

    switch (action) {
      case 'create_scene':
        this.resetDefaultCircuit();
        return {
          success: true,
          components: Array.from(this.components.values()),
          connections: this.connections,
          simulation: CircuitSimulator.simulate(Array.from(this.components.values()), this.connections),
          message: '3D Circuit workspace reset with LED circuit template.',
        };

      case 'add_component': {
        const type = componentType || 'resistor';
        const id = `${type}-${Date.now().toString(36)}`;
        const name = componentName || `${type.toUpperCase()} ${this.components.size + 1}`;
        const newComp: CircuitComponent = {
          id,
          name,
          type,
          value: value || (type === 'resistor' ? 220 : type === 'battery' ? 9 : undefined),
          position: { x: (this.components.size % 4) * 1.5 - 2, y: 0, z: Math.floor(this.components.size / 4) * 1.5 },
          ports: [
            { id: `${id}-p1`, name: 'P1', type: 'input' },
            { id: `${id}-p2`, name: 'P2', type: 'output' },
          ],
        };
        this.components.set(id, newComp);

        return {
          success: true,
          components: Array.from(this.components.values()),
          connections: this.connections,
          simulation: CircuitSimulator.simulate(Array.from(this.components.values()), this.connections),
          message: `Added ${name} to 3D circuit.`,
        };
      }

      case 'remove_component': {
        if (fromId && this.components.has(fromId)) {
          const removedName = this.components.get(fromId)?.name;
          this.components.delete(fromId);
          this.connections = this.connections.filter((c) => c.fromComponentId !== fromId && c.toComponentId !== fromId);
          return {
            success: true,
            components: Array.from(this.components.values()),
            connections: this.connections,
            simulation: CircuitSimulator.simulate(Array.from(this.components.values()), this.connections),
            message: `Removed ${removedName} from circuit.`,
          };
        }
        return {
          success: false,
          components: Array.from(this.components.values()),
          connections: this.connections,
          message: 'Component ID to remove not found.',
        };
      }

      case 'connect': {
        if (!fromId || !toId) {
          return {
            success: false,
            components: Array.from(this.components.values()),
            connections: this.connections,
            message: 'Both fromId and toId are required to connect components.',
          };
        }
        const connId = `conn-${Date.now().toString(36)}`;
        this.connections.push({
          id: connId,
          fromComponentId: fromId,
          fromPortId: `${fromId}-p2`,
          toComponentId: toId,
          toPortId: `${toId}-p1`,
        });

        return {
          success: true,
          components: Array.from(this.components.values()),
          connections: this.connections,
          simulation: CircuitSimulator.simulate(Array.from(this.components.values()), this.connections),
          message: `Connected ${fromId} -> ${toId}.`,
        };
      }

      case 'simulate':
      default: {
        const simulation = CircuitSimulator.simulate(Array.from(this.components.values()), this.connections);
        return {
          success: true,
          components: Array.from(this.components.values()),
          connections: this.connections,
          simulation,
          message: simulation.messages.join(' '),
        };
      }
    }
  }

  getCircuitState() {
    return {
      components: Array.from(this.components.values()),
      connections: this.connections,
      simulation: CircuitSimulator.simulate(Array.from(this.components.values()), this.connections),
    };
  }
}
