import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class OsControlService {
  async openApplication(appName: string): Promise<{ success: boolean; message: string }> {
    const app = appName.toLowerCase();
    try {
      if (app.includes('chrome')) {
        await execAsync('start chrome');
      } else if (app.includes('notepad')) {
        await execAsync('start notepad');
      } else if (app.includes('calc')) {
        await execAsync('start calc');
      } else {
        await execAsync(`start ${app}`);
      }
      return { success: true, message: `Opened application "${appName}" successfully.` };
    } catch (err: any) {
      return { success: false, message: `Failed to launch application "${appName}": ${err.message}` };
    }
  }

  async openUrl(url: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`start ${url}`);
      return { success: true, message: `Opened URL "${url}" in browser.` };
    } catch (err: any) {
      return { success: false, message: `Failed to open URL "${url}": ${err.message}` };
    }
  }

  async createFolder(folderName: string, parentDir?: string): Promise<{ success: boolean; message: string }> {
    try {
      const targetDir = parentDir || `${process.env.USERPROFILE || 'C:\\Users\\USER'}\\Desktop`;
      const fullPath = path.join(targetDir, folderName);
      await fs.mkdir(fullPath, { recursive: true });
      return { success: true, message: `Created folder "${folderName}" at ${fullPath}` };
    } catch (err: any) {
      return { success: false, message: `Failed to create folder "${folderName}": ${err.message}` };
    }
  }

  async typeText(text: string): Promise<{ success: boolean; message: string }> {
    try {
      // Windows PowerShell send keys fallback for text injection
      const psCommand = `powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${text.replace(/'/g, "''")}')"`;
      await execAsync(psCommand);
      return { success: true, message: `Typed text string into active window.` };
    } catch (err: any) {
      return { success: false, message: `Failed to type text: ${err.message}` };
    }
  }
}
