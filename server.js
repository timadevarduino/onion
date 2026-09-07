const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'onimart.json');

// Глобальная переменная для хранения данных в памяти сервера
let memoryDb = {
  users: [{ id: "usr_admin", username: "admin", role: "admin", createdAt: "2026-09-06" }],
  listings: [],
  orders: [],
  chats: []
};

// Загружаем данные из файла при старте, если он существует
if (fs.existsSync(DB_FILE)) {
  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    memoryDb = JSON.parse(fileData);
    console.log("--> База данных успешно загружена из файла.");
  } catch (e) {
    console.log("--> Ошибка чтения файла БД, используем начальные данные.");
  }
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2));
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

  // API: Отдаем актуальную базу из оперативной памяти
  if (req.url === '/api/db' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(memoryDb));
  }

  // API: Безопасно сохраняем новые данные в память и на диск
  if (req.url === '/api/db' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        if (!body.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Empty payload' }));
        }
        
        const parsed = JSON.parse(body);
        
        // Валидация структуры, чтобы не затереть БД пустышкой
        if (parsed.listings || parsed.users || parsed.orders) {
          memoryDb = { ...memoryDb, ...parsed };
          
          // Асинхронно дублируем на диск (для подстраховки)
          fs.writeFile(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8', (err) => {
            if (err) console.error("Ошибка записи на диск:", err);
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid DB structure' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
      }
    });
    return;
  }

  // Отдаем статические файлы (onimart.html)
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
