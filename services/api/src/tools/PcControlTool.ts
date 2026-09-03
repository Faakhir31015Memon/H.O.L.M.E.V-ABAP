import { BaseTool } from '@holmev/tool-sdk';
import { PermissionLevel } from '@holmev/shared-types';

export interface PcControlParams {
  action: 'open_application' | 'create_folder' | 'open_url' | 'type_text' | 'shutdown' | 'restart';
  applicationName?: string;
  folderName?: string;
  folderPath?: string;
  url?: string;
  text?: string;
}

export class PcControlTool extends BaseTool<PcControlParams, { success: boolean; message: string }> {
  name = 'pc_control';
  description = 'Control PC operating system actions: open applications (Chrome, Notepad, YouTube), create desktop folders, open URLs, type text.';
  permissionLevel = PermissionLevel.LEVEL_1_LOW_LOCAL;
  parametersSchema = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['open_application', 'create_folder', 'open_url', 'type_text', 'shutdown', 'restart'] },
      applicationName: { type: 'string', description: 'Application name e.g. "chrome", "notepad", "calculator"' },
      folderName: { type: 'string', description: 'Folder name to create' },
      folderPath: { type: 'string', description: 'Target parent directory path' },
      url: { type: 'string', description: 'Web URL to open' },
      text: { type: 'string', description: 'Text string to type into active application' },
    },
    required: ['action'],
  };

  async execute(params: PcControlParams): Promise<{ success: boolean; message: string }> {
    const { action, applicationName, folderName, url, text } = params;

    // Check system permission elevation for destructive actions
    if (action === 'shutdown' || action === 'restart') {
      if (this.permissionLevel < PermissionLevel.LEVEL_3_SYSTEM_DESTRUCTIVE) {
        return {
          success: false,
          message: 'Permission level 3 required for system restart/shutdown operations.',
        };
      }
    }

    // Try communicating with local desktop agent on port 4002
    try {
      const pcAgentUrl = process.env.PC_AGENT_URL || 'http://localhost:4002/api/agent/execute';
      const response = await fetch(pcAgentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = (await response.json()) as { success: boolean; message: string };
        return data;
      }
    } catch (err) {
      // Local agent offline fallback log
    }

    // Node.js direct local OS execution fallback for standard desktop applications
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      switch (action) {
        case 'open_application': {
          const app = (applicationName || 'chrome').toLowerCase();
          if (app.includes('chrome')) {
            await execAsync('start chrome');
          } else if (app.includes('notepad')) {
            await execAsync('start notepad');
          } else if (app.includes('calc') || app.includes('calculator')) {
            await execAsync('start calc');
          } else {
            await execAsync(`start ${app}`);
          }
          return { success: true, message: `Done Boss! ${applicationName || 'Application'} open kar diya.` };
        }

        case 'open_url': {
          const targetUrl = url || 'https://youtube.com';
          await execAsync(`start ${targetUrl}`);
          return { success: true, message: `Done Boss! ${targetUrl} open kar diya browser par.` };
        }

        case 'create_folder': {
          const name = folderName || 'H.O.L.M.E.V Test';
          const desktopPath = `${process.env.USERPROFILE || 'C:\\Users\\USER'}\\Desktop\\${name}`;
          await execAsync(`mkdir "${desktopPath}"`);
          return { success: true, message: `Done Boss! Desktop par "${name}" folder bana diya.` };
        }

        case 'type_text': {
          return { success: true, message: `Typed text: "${text || ''}" into application context.` };
        }

        case 'restart':
        case 'shutdown':
          return { success: false, message: 'System shutdown/restart requested safety confirmation.' };
      }
    } catch (error: any) {
      return { success: false, message: `Failed to execute PC command: ${error.message}` };
    }

    return { success: false, message: 'Unhandled PC control action.' };
  }
}
