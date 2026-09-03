import { PermissionLevel, ToolDefinition, ToolAuditLog } from '@holmev/shared-types';

export abstract class BaseTool<TParams = any, TResult = any> implements ToolDefinition<TParams, TResult> {
  abstract name: string;
  abstract description: string;
  abstract permissionLevel: PermissionLevel;
  abstract parametersSchema: Record<string, any>;

  abstract execute(params: TParams, context?: any): Promise<TResult>;

  validatePermissions(userPermissionLevel: PermissionLevel): boolean {
    if (this.permissionLevel === PermissionLevel.LEVEL_4_BLOCKED) {
      return false;
    }
    return userPermissionLevel >= this.permissionLevel;
  }

  createAuditLog(
    params: TParams,
    status: 'SUCCESS' | 'FAILED' | 'REJECTED',
    startTime: number,
    result?: any,
    error?: string
  ): ToolAuditLog {
    return {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: startTime,
      toolName: this.name,
      arguments: params as any,
      permissionLevel: this.permissionLevel,
      status,
      result,
      error,
      durationMs: Date.now() - startTime,
    };
  }
}
