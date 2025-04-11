const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');  // Add HTTP server support

const app = express();

// Load SSL certificates
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certificates/privkey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates/fullchain.pem'))
};

// Trust X-Forwarded-* headers from Cloudflare
app.set('trust proxy', true);

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  index: 'index.html',
  setHeaders: (res, path) => {
    if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Use this instead of a separate catch-all route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create HTTPS server
const httpsServer = https.createServer(options, app);
// Create HTTP server (for Cloudflare)
const httpServer = http.createServer(app);

// Start HTTPS server
httpsServer.listen(443, '0.0.0.0', () => {
  console.log('HTTPS Server running at https://0.0.0.0:443/');
}).on('error', (err) => {
  console.error('HTTPS Server error:', err);
  if (err.code === 'EACCES') {
    console.error('Port 443 requires root privileges');
  }
});

// Start HTTP server on port 80 (for Cloudflare)
httpServer.listen(80, '0.0.0.0', () => {
  console.log('HTTP Server running at http://0.0.0.0:80/');
}).on('error', (err) => {
  console.error('HTTP Server error:', err);
  if (err.code === 'EACCES') {
    console.error('Port 80 requires root privileges');
  }
}); 