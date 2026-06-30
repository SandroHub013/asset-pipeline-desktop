const { app, BrowserWindow } = require('electron');
const path = require('path');

// Avvia il server Express interno allo stesso processo Node di Electron!
console.log('[Electron] Avvio server Express di background...');
require('./server.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "agy-pipeline > ide",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Carica la pagina locale servita dal nostro server Express
  console.log('[Electron] Apertura finestra desktop principale...');
  win.loadURL('http://localhost:9003/');

  // Nascondi la barra dei menu per un design pulito ed immersivo
  win.setMenuBarVisibility(false);

  // Gestione dell'apertura di nuove finestre (es. per Piskel o Animator)
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.log(`[Electron] Apertura finestra popup per: ${url}`);
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 1100,
        height: 750,
        title: url.includes('9001') ? "Piskel - Sprite Editor" : "Animator Preview",
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      }
    };
  });
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
  console.log('[Electron] Chiusura finestra principale. Arresto del server Express in corso...');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
