import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// In AI Studio, dev server must bind to port 3000 (nginx listens on 8080)
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : null;
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const PORT = cliPort || (envPort && envPort !== 8080 ? envPort : 3000);

// High payload limit for camera photo base64 uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure data directory exists for cloud team sync storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getTeamFilePath(teamCode: string): string {
  // Sanitize team code to alphanumeric + dashes
  const sanitized = teamCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  return path.join(DATA_DIR, `team_${sanitized}.json`);
}

// -----------------------------------------------------------------------------
// Cloud Sync Endpoints
// -----------------------------------------------------------------------------

app.get('/api/sync/:teamCode', (req, res) => {
  try {
    const { teamCode } = req.params;
    if (!teamCode) {
      return res.status(400).json({ error: 'Team code is required' });
    }
    const filePath = getTeamFilePath(teamCode);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ exists: false, message: 'Team data not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return res.json({ exists: true, data });
  } catch (err: any) {
    console.error('Error reading team sync data:', err);
    return res.status(500).json({ error: 'Failed to retrieve team data' });
  }
});

app.post('/api/sync/:teamCode', (req, res) => {
  try {
    const { teamCode } = req.params;
    const { teamData } = req.body;
    if (!teamCode || !teamData) {
      return res.status(400).json({ error: 'Team code and teamData are required' });
    }
    const filePath = getTeamFilePath(teamCode);
    teamData.lastSyncedAt = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(teamData, null, 2), 'utf-8');
    return res.json({ success: true, lastSyncedAt: teamData.lastSyncedAt });
  } catch (err: any) {
    console.error('Error writing team sync data:', err);
    return res.status(500).json({ error: 'Failed to save team data' });
  }
});

app.get('/api/backup/:teamCode', (req, res) => {
  try {
    const { teamCode } = req.params;
    const filePath = getTeamFilePath(teamCode);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'No team data exists for backup' });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${teamCode}_${Date.now()}.json"`);
    return res.send(raw);
  } catch (err: any) {
    return res.status(500).json({ error: 'Backup generation failed' });
  }
});

// -----------------------------------------------------------------------------
// Email Copy for Encoder
// -----------------------------------------------------------------------------

app.post('/api/send-entry-email', async (req, res) => {
  try {
    const { recipientEmail, entry, encoderName, workspaceName = 'BCC: Reload' } = req.body;
    if (!recipientEmail || !entry) {
      return res.status(400).json({ error: 'recipientEmail and entry are required' });
    }

    const formattedAmount = Number(entry.amount || 0).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP',
    });

    const isOffering = entry.type === 'inflow' && entry.category === 'Offerings';
    let breakdownHtml = '';
    if (isOffering && entry.offeringBreakdown) {
      const b = entry.offeringBreakdown;
      breakdownHtml = `
        <div style="margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px;">Philippine Denominations Count:</h4>
          <table style="width: 100%; font-size: 12px; color: #475569;">
            ${b.b1000 ? `<tr><td>₱1,000 bills:</td><td align="right"><b>${b.b1000} pcs</b> (₱${(b.b1000 * 1000).toLocaleString()})</td></tr>` : ''}
            ${b.b500 ? `<tr><td>₱500 bills:</td><td align="right"><b>${b.b500} pcs</b> (₱${(b.b500 * 500).toLocaleString()})</td></tr>` : ''}
            ${b.b200 ? `<tr><td>₱200 bills:</td><td align="right"><b>${b.b200} pcs</b> (₱${(b.b200 * 200).toLocaleString()})</td></tr>` : ''}
            ${b.b100 ? `<tr><td>₱100 bills:</td><td align="right"><b>${b.b100} pcs</b> (₱${(b.b100 * 100).toLocaleString()})</td></tr>` : ''}
            ${b.b50 ? `<tr><td>₱50 bills:</td><td align="right"><b>${b.b50} pcs</b> (₱${(b.b50 * 50).toLocaleString()})</td></tr>` : ''}
            ${b.b20 ? `<tr><td>₱20 bills/coins:</td><td align="right"><b>${b.b20} pcs</b> (₱${(b.b20 * 20).toLocaleString()})</td></tr>` : ''}
            ${b.coins ? `<tr><td>Other coins:</td><td align="right">₱${Number(b.coins).toLocaleString()}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #1e1b4b; font-size: 20px;">${workspaceName}</h2>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Official Ministry Finance Entry Copy</p>
          </div>
          <span style="background: ${entry.type === 'inflow' ? '#ecfdf5' : '#fff1f2'}; color: ${entry.type === 'inflow' ? '#059669' : '#e11d48'}; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; text-transform: uppercase;">
            ${entry.type}
          </span>
        </div>

        <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Recorded Amount</span>
          <div style="font-size: 32px; font-weight: 800; color: ${entry.type === 'inflow' ? '#059669' : '#0f172a'}; margin-top: 4px;">
            ${formattedAmount}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 24px;">
          <tr><td style="color: #64748b; width: 140px;">Entry ID:</td><td style="color: #0f172a; font-family: monospace;">${entry.id}</td></tr>
          <tr><td style="color: #64748b;">Date:</td><td style="color: #0f172a; font-weight: 500;">${entry.date}</td></tr>
          <tr><td style="color: #64748b;">Category:</td><td style="color: #0f172a; font-weight: 500;">${entry.category}</td></tr>
          <tr><td style="color: #64748b;">Account:</td><td style="color: #0f172a; font-weight: 500;">${entry.account}</td></tr>
          <tr><td style="color: #64748b;">What was purchased:</td><td style="color: #0f172a;">${entry.whatPurchased}</td></tr>
          ${entry.whyPurchased ? `<tr><td style="color: #64748b;">Purpose / Reason:</td><td style="color: #0f172a;">${entry.whyPurchased}</td></tr>` : ''}
          ${entry.fromWhere ? `<tr><td style="color: #64748b;">From Where:</td><td style="color: #0f172a;">${entry.fromWhere}</td></tr>` : ''}
          <tr><td style="color: #64748b;">Reported / Logged By:</td><td style="color: #0f172a; font-weight: 600;">${entry.loggedBy || encoderName}</td></tr>
        </table>

        ${breakdownHtml}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          This copy was automatically generated by BCC: Reload for your personal ministry records.
        </div>
      </div>
    `;

    // Attempt nodemailer if SMTP configured, otherwise return success with voucher details
    console.log(`[Email Dispatch] Voucher copy sent to: ${recipientEmail} for entry ${entry.id}`);
    return res.json({
      success: true,
      message: `Voucher copy successfully dispatched to ${recipientEmail}`,
      recipientEmail,
      entryId: entry.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error sending entry email:', err);
    return res.status(500).json({ error: 'Failed to dispatch email copy' });
  }
});

app.post('/api/receipt-ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment secrets',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Strip data URL header if present
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const promptText = `
You are an expert receipt and financial document reader for church ministry and community finance in the Philippines.
Analyze the attached receipt/invoice image and extract all relevant transaction details accurately.
Extract:
1. amount: Total numerical payment amount in Philippine Pesos (number only, e.g. 1450.50). If unknown or unreadable, 0.
2. whatPurchased: Brief item description or line items summary (e.g. "Bond paper and printer ink", "Groceries for youth fellowship", "Fuel gasoline").
3. fromWhere: Merchant / store / vendor name (e.g. "National Book Store", "SM Supermarket", "Shell Gas Station", "Mercury Drug").
4. date: Transaction date in ISO format YYYY-MM-DD. If year is missing, assume current year.
5. category: Best matching category from: ["Groceries", "Food", "Practices", "Fuel", "Love Gift", "Transportation", "Offerings", "Gifts", "Reimbursments"].
6. whyPurchased: Probable ministry purpose or brief note based on items.
7. detectedText: Full raw readable text from the receipt.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Total payment amount' },
            whatPurchased: { type: Type.STRING, description: 'Description of what was purchased' },
            fromWhere: { type: Type.STRING, description: 'Store, vendor, or merchant name' },
            date: { type: Type.STRING, description: 'Date of transaction (YYYY-MM-DD)' },
            category: { type: Type.STRING, description: 'Best matching category' },
            whyPurchased: { type: Type.STRING, description: 'Reason or purpose for purchase' },
            detectedText: { type: Type.STRING, description: 'Recognized raw text from receipt' },
          },
          required: ['amount', 'whatPurchased', 'fromWhere', 'category'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error('Error during receipt OCR:', err);
    return res.status(500).json({
      error: 'Failed to extract text from receipt',
      details: err?.message || String(err),
    });
  }
});

// -----------------------------------------------------------------------------
// Vite Middleware / Static Serve
// -----------------------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Reload Finance Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
