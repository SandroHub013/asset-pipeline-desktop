const { app, BrowserWindow } = require('electron');
const path = require('path');

// Avvia il server Express interno allo stesso processo Node di Electron!
console.log('[Electron] Avvio server Express di background...');
require('./server.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 850,
    title: "agy-pipeline > desktop",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Carica la pagina locale servita dal nostro server Express
  console.log('[Electron] Apertura finestra desktop...');
  win.loadURL('http://localhost:9003/');

  // Nascondi la barra dei menu per un design pulito ed immersivo
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('[Electron] Chiusura finestra. Arresto del server Express in corso...');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
