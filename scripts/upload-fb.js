#!/usr/bin/env node
/**
 * upload-fb.js
 *
 * Uploads the Loudmouth Spin Lab bundle to Facebook Instant Games Web Hosting
 * using the Facebook Graph API.
 *
 * Prerequisites
 * -------------
 * 1. Run `npm run build:fb` first – this produces loudmouth-spin-lab.zip.
 * 2. Set the following environment variables (or put them in a .env file):
 *      FB_APP_ID      – your Facebook App ID
 *      FB_APP_SECRET  – your Facebook App Secret
 *
 * Usage
 * -----
 *   node scripts/upload-fb.js
 *   # or via npm:
 *   npm run upload:fb
 *
 * What it does
 * ------------
 * 1. Reads FB_APP_ID and FB_APP_SECRET from the environment.
 * 2. POSTs the zip file to the Facebook Graph API hosting endpoint.
 * 3. Prints the resulting asset/version ID so you can set it as production
 *    in the App Dashboard (Instant Games → Web Hosting → ★ Set as Production).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Load .env manually (no external dotenv dependency required)
// ---------------------------------------------------------------------------
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Validate required variables
// ---------------------------------------------------------------------------
const APP_ID = process.env.FB_APP_ID;
const APP_SECRET = process.env.FB_APP_SECRET;

if (!APP_ID || !APP_SECRET) {
  console.error(
    'Error: FB_APP_ID and FB_APP_SECRET must be set in the environment or in a .env file.\n' +
    'Example .env:\n' +
    '  FB_APP_ID=123456789\n' +
    '  FB_APP_SECRET=abcdef1234567890\n'
  );
  process.exit(1);
}

const ZIP_PATH = path.join(ROOT, 'loudmouth-spin-lab.zip');
if (!fs.existsSync(ZIP_PATH)) {
  console.error(
    `Error: ${ZIP_PATH} not found.\n` +
    'Run "npm run build:fb" first to generate the bundle.\n'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Build the app access token (app_id|app_secret)
// ---------------------------------------------------------------------------
const accessToken = `${APP_ID}|${APP_SECRET}`;

// ---------------------------------------------------------------------------
// Upload via the Graph API
// ---------------------------------------------------------------------------
const form = new FormData();
form.append('access_token', accessToken);
form.append('type', 'BUNDLE');
form.append('asset', fs.createReadStream(ZIP_PATH), {
  filename: 'loudmouth-spin-lab.zip',
  contentType: 'application/zip',
});

const hostname = 'graph-video.facebook.com'; // required for multipart binary uploads (bundles can be up to 200 MB)
const uploadPath = `/${APP_ID}/assets`;

console.log(`Uploading ${ZIP_PATH} to https://${hostname}${uploadPath} …`);

const options = {
  hostname,
  path: uploadPath,
  method: 'POST',
  headers: form.getHeaders(),
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      console.error('Error: Unexpected response from Facebook API:\n', body);
      process.exit(1);
    }

    if (parsed.error) {
      console.error('Facebook API error:', JSON.stringify(parsed.error, null, 2));
      console.error(
        '\nCommon causes:\n' +
        '  • Invalid APP_ID or APP_SECRET\n' +
        '  • Instant Games not enabled for this app\n' +
        '  • App is in development mode and the account is not a developer/tester\n'
      );
      process.exit(1);
    }

    console.log('\n✅ Upload successful!');
    console.log('Response:', JSON.stringify(parsed, null, 2));
    console.log(
      '\nNext steps:\n' +
      '  1. Go to https://developers.facebook.com/apps/' + APP_ID + '/hosting/\n' +
      '  2. Find the newly uploaded version.\n' +
      '  3. Click "★ Set as Production" to make it live.\n' +
      '  4. Use the QA Tool on that page to test before submitting for review.\n'
    );
  });
});

req.on('error', (err) => {
  console.error('Network error while uploading to Facebook:', err.message);
  process.exit(1);
});

form.pipe(req);
