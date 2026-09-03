import { BaseTool } from '@holmev/tool-sdk';
import { PermissionLevel, ToolAuditLog } from '@holmev/shared-types';
import { WebSearchTool } from './WebSearchTool.js';
import { SmartHomeTool } from './SmartHomeTool.js';
import { PcControlTool } from './PcControlTool.js';
import { CircuitTool } from './CircuitTool.js';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();
  private auditLogs: ToolAuditLog[] = [];
  private userPermissionLevel: PermissionLevel = PermissionLevel.LEVEL_3_SYSTEM_DESTRUCTIVE;

  constructor() {
    this.registerTool(new WebSearchTool());
    this.registerTool(new SmartHomeTool());
    this.registerTool(new PcControlTool());
    this.registerTool(new CircuitTool());
  }

  registerTool(tool: BaseTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolsDefinitions() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      permissionLevel: t.permissionLevel,
      parametersSchema: t.parametersSchema,
    }));
  }

  async executeTool(name: string, params: any, context?: any): Promise<{ success: boolean; result?: any; error?: string; auditLog: ToolAuditLog }> {
    const startTime = Date.now();
    const tool = this.getTool(name);

    if (!tool) {
      const errorMsg = `Tool "${name}" is not registered in H.O.L.M.E.V Tool Registry.`;
      const auditLog: ToolAuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: startTime,
        toolName: name,
        arguments: params,
        permissionLevel: PermissionLevel.LEVEL_0_READONLY,
        status: 'FAILED',
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
      this.auditLogs.push(auditLog);
      return { success: false, error: errorMsg, auditLog };
    }

    // Permission validation
    if (!tool.validatePermissions(this.userPermissionLevel)) {
      const errorMsg = `Permission Denied: Tool "${name}" requires Permission Level ${tool.permissionLevel}, user level is ${this.userPermissionLevel}.`;
      const auditLog = tool.createAuditLog(params, 'REJECTED', startTime, undefined, errorMsg);
      this.auditLogs.push(auditLog);
      return { success: false, error: errorMsg, auditLog };
    }

    try {
      const result = await tool.execute(params, context);
      const auditLog = tool.createAuditLog(params, 'SUCCESS', startTime, result);
      this.auditLogs.push(auditLog);
      return { success: true, result, auditLog };
    } catch (err: any) {
      const errorMsg = err?.message || 'Tool execution encountered an unexpected error.';
      const auditLog = tool.createAuditLog(params, 'FAILED', startTime, undefined, errorMsg);
      this.auditLogs.push(auditLog);
      return { success: false, error: errorMsg, auditLog };
    }
  }

  getAuditLogs(): ToolAuditLog[] {
    return this.auditLogs;
  }
}
