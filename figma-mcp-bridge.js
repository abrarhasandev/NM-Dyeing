const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read FIGMA_API_KEY from environment or .env
let figmaApiKey = process.env.FIGMA_API_KEY;
if (!figmaApiKey) {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/FIGMA_API_KEY=(.*)/);
      if (match) {
        figmaApiKey = match[1].trim();
      }
    }
  } catch (err) {
    // Ignore error
  }
}

if (!figmaApiKey) {
  console.error('Warning: FIGMA_API_KEY is not defined. Please set it in your environment or .env file.');
}

console.log('Starting figma-developer-mcp child process...');
const child = spawn('npx', ['-y', 'figma-developer-mcp', '--stdio'], {
  env: {
    ...process.env,
    FIGMA_API_KEY: figmaApiKey
  }
});

let stdoutBuffer = '';
const pendingRequests = new Map(); // id -> res object

child.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  let lineBreakIndex;
  while ((lineBreakIndex = stdoutBuffer.indexOf('\n')) !== -1) {
    const line = stdoutBuffer.substring(0, lineBreakIndex).trim();
    stdoutBuffer = stdoutBuffer.substring(lineBreakIndex + 1);
    if (!line) continue;
    try {
      const response = JSON.parse(line);
      console.log('<- Stdio Response:', response.id, response.method || '');
      if (response.id !== undefined && response.id !== null) {
        const clientRes = pendingRequests.get(response.id);
        if (clientRes) {
          clientRes.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          clientRes.end(line);
          pendingRequests.delete(response.id);
        }
      }
    } catch (e) {
      console.error('Failed to parse stdout line:', line, e);
    }
  }
});

child.stderr.on('data', (data) => {
  console.error('Stdio Error:', data.toString());
});

child.on('close', (code) => {
  console.log(`figma-developer-mcp process exited with code ${code}`);
  process.exit(code);
});

const server = http.createServer((req, res) => {
  // Add CORS headers for preflight requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`${req.method} ${req.url}`);
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        console.log('-> HTTP Request:', json.id, json.method);
        
        if (json.id !== undefined && json.id !== null) {
          pendingRequests.set(json.id, res);
        } else {
          res.writeHead(200);
          res.end();
        }
        
        child.stdin.write(JSON.stringify(json) + '\n');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }));
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed. Use POST.');
  }
});

const PORT = 3845;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Figma Dev Mode MCP Bridge listening on http://127.0.0.1:${PORT}`);
});
