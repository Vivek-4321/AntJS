import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { promises as fs } from 'fs';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import http from 'http';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Define an array of directories to search for files
const searchDirectories = [
  '',  // Root directory
  'src',
  'src/components',
  'utils',
  'public',
  // Add more directories as needed
];

// Serve static files from the root directory
app.use(express.static(join(__dirname, '..')));

// Middleware to handle file requests dynamically
app.use(async (req, res, next) => {
  const fileExtensions = ['.ant', '.js', '.css']; // Add more extensions as needed
  
  if (fileExtensions.some(ext => req.path.endsWith(ext)) || req.path.startsWith('/utils/')) {
    let filePath;
    
    // Check if it's a specific import (contains '/')
    if (req.path.includes('/')) {
      filePath = resolve(__dirname, '..', req.path.replace(/^\//, ''));
      try {
        const data = await fs.readFile(filePath, 'utf8');
        res.type(req.path.endsWith('.css') ? 'text/css' : 'application/javascript').send(data);
        return;
      } catch (err) {
        // Fall through to the general search if specific file not found
      }
    }
    
    // General search through directories
    for (const dir of searchDirectories) {
      filePath = resolve(__dirname, '..', dir, req.path.replace(/^\//, ''));
      
      try {
        const data = await fs.readFile(filePath, 'utf8');
        res.type(req.path.endsWith('.css') ? 'text/css' : 'application/javascript').send(data);
        return;
      } catch (err) {
        // Continue to next directory
      }
    }
    
    console.error(chalk.red('❌'), chalk.yellow(`File not found: ${req.path}`));
    res.status(404).send('File not found');
  } else {
    next();
  }
});

// Serve static files from the public directory
app.use(express.static(join(__dirname, '..', 'public')));

// Serve index.html from the public folder for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// Set up Chokidar watcher
const watcher = chokidar.watch([
  join(__dirname, '..', 'src'),
  join(__dirname, '..', 'utils'),
  join(__dirname, '..', 'public')
], {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher.on('change', (path) => {
  console.log(chalk.yellow('🔥'), chalk.blue(`File changed: ${path}`));
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'reload' }));
    }
  });
});

// Serve the hot-reload client script
app.get('/hot-reload-client.js', (req, res) => {
  res.sendFile(join(__dirname, 'hot-reload-client.js'));
});

server.listen(port, () => {
  console.log(chalk.green('🚀'), chalk.blue(`Server running at http://localhost:${port}`));
});

// Log when the file watcher is ready
watcher.on('ready', () => {
  console.log(chalk.magenta('👀'), chalk.blue('File watcher initialized and ready'));
});

// Log when new files are added
watcher.on('add', (path) => {
  console.log(chalk.green('➕'), chalk.blue(`New file added: ${path}`));
});

// Log when files are deleted
watcher.on('unlink', (path) => {
  console.log(chalk.red('➖'), chalk.blue(`File deleted: ${path}`));
});
