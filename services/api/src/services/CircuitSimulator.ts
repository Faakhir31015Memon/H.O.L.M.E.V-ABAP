import { CircuitComponent, CircuitConnection, CircuitSimulationResult } from '@holmev/shared-types';

export class CircuitSimulator {
  static simulate(components: CircuitComponent[], connections: CircuitConnection[]): CircuitSimulationResult {
    const messages: string[] = [];
    const blownComponents: string[] = [];

    if (components.length === 0) {
      return {
        valid: false,
        closedCircuit: false,
        totalResistanceOhms: 0,
        currentAmps: 0,
        voltageVolts: 0,
        blownComponents: [],
        messages: ['Circuit empty. Add components to simulate.'],
      };
    }

    // Find power source (battery)
    const battery = components.find((c) => c.type === 'battery');
    if (!battery) {
      return {
        valid: false,
        closedCircuit: false,
        totalResistanceOhms: 0,
        currentAmps: 0,
        voltageVolts: 0,
        blownComponents: [],
        messages: ['No battery power source found in circuit.'],
      };
    }

    const voltage = battery.value || 9; // default 9V battery

    // Check closed loop connectivity
    if (connections.length < components.length) {
      messages.push('Warning: Open circuit detected. Connections incomplete.');
      return {
        valid: true,
        closedCircuit: false,
        totalResistanceOhms: 0,
        currentAmps: 0,
        voltageVolts: voltage,
        blownComponents: [],
        messages,
      };
    }

    // Calculate total resistance
    let totalResistance = 0;
    let hasResistor = false;
    let hasLED = false;

    for (const comp of components) {
      if (comp.type === 'resistor') {
        totalResistance += comp.value || 220; // default 220 ohms
        hasResistor = true;
      } else if (comp.type === 'led') {
        hasLED = true;
        totalResistance += 10; // small internal LED resistance
      } else if (comp.type === 'capacitor') {
        totalResistance += 1000;
      }
    }

    // Check for direct LED overload (short circuit or missing current-limiting resistor)
    if (hasLED && !hasResistor && voltage > 3) {
      const ledComp = components.find((c) => c.type === 'led');
      if (ledComp) {
        blownComponents.push(ledComp.id);
        messages.push(`CRITICAL: LED (${ledComp.name}) blown! Overcurrent without current-limiting resistor.`);
      }
    }

    // Ohm's Law: I = V / R
    const current = totalResistance > 0 ? voltage / totalResistance : 0;

    if (blownComponents.length === 0) {
      messages.push(`Circuit simulation OK. Total Voltage: ${voltage}V, Current: ${(current * 1000).toFixed(1)}mA, Resistance: ${totalResistance}Ω.`);
    }

    return {
      valid: true,
      closedCircuit: true,
      totalResistanceOhms: totalResistance,
      currentAmps: current,
      voltageVolts: voltage,
      blownComponents,
      messages,
    };
  }
}
