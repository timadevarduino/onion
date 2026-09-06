const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'onimart.json');

// Ensure database file exists on startup
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [{ id: "usr_admin", username: "admin", role: "admin", createdAt: "2026-09-06" }],
    listings: [],
    orders: [],
    chats: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Get entire database live
  if (req.url === '/api/db' && req.method === 'GET') {
    fs.readFile(DB_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to read database' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // API: Save entire database to onimart.json on disk
  if (req.url === '/api/db' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFile(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Disk write failed' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
      }
    });
    return;
  }

  // Serve onimart.html
  let filePath = path.join(__dirname, req.url === '/' ? 'onimart.html' : req.url);
  let extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'onimart.html'), (errHtml, defaultHtml) => {
        if (errHtml) {
          res.writeHead(404);
          return res.end('onimart.html not found in folder.');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(defaultHtml);
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`  ONIMART LIVE SERVER IS RUNNING`);
  console.log(`  Open this URL in your browsers:`);
  console.log(`  ==> http://localhost:${PORT}`);
  console.log(`=================================================\n`);
});