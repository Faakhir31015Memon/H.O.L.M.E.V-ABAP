import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OsControlService } from './osControl.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PC_AGENT_PORT || '4002', 10);
const osService = new OsControlService();

app.get('/api/agent/status', (req, res) => {
  res.json({ success: true, status: 'ONLINE', platform: process.platform, arch: process.arch });
});

app.post('/api/agent/execute', async (req, res) => {
  const { action, applicationName, folderName, folderPath, url, text } = req.body;

  try {
    switch (action) {
      case 'open_application': {
        const result = await osService.openApplication(applicationName || 'chrome');
        return res.json(result);
      }
      case 'open_url': {
        const result = await osService.openUrl(url || 'https://youtube.com');
        return res.json(result);
      }
      case 'create_folder': {
        const result = await osService.createFolder(folderName || 'H.O.L.M.E.V Test', folderPath);
        return res.json(result);
      }
      case 'type_text': {
        const result = await osService.typeText(text || '');
        return res.json(result);
      }
      default:
        return res.status(400).json({ success: false, message: `Unsupported PC agent action: ${action}` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`💻 H.O.L.M.E.V Desktop Local Agent Running on Port ${PORT}`);
  console.log(`====================================================`);
});
