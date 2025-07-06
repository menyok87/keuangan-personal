const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found!');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in dist directory!');
  process.exit(1);
}

console.log('✅ dist directory found:', distPath);
console.log('✅ index.html found:', indexPath);

// Serve static files with proper headers
app.use(express.static(distPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath),
    indexExists: fs.existsSync(indexPath)
  });
});

// Handle React Router (SPA) - catch all
app.get('*', (req, res) => {
  console.log(`Serving index.html for: ${req.url}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log('🚀 Simple Server started successfully!');
  console.log(`📱 Local: http://localhost:${port}`);
  console.log(`🌐 External: http://keuangan99.com`);
  console.log(`📁 Serving from: ${distPath}`);
  
  // Test if index.html can be read
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    console.log(`📄 index.html size: ${indexContent.length} characters`);
    console.log(`📄 index.html preview: ${indexContent.substring(0, 100)}...`);
  } catch (err) {
    console.error('❌ Cannot read index.html:', err.message);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server shutting down...');
  process.exit(0);
});