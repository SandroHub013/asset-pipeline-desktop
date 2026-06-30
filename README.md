# 🎮 Pixel Art Asset Generator Pipeline (Desktop)

Questo modulo è uno strumento desktop completo e auto-consistente per la generazione, scontornamento (auto-trasparenza) e salvataggio automatico di sprite e asset di gioco a 16-bit. Può essere facilmente esportato o clonato in altri progetti.

## 🚀 Come Funziona
Lo strumento combina un server locale Express (Node.js) con un'interfaccia utente desktop nativa (**Electron**).
* **Avvio:** Facendo doppio click sul launcher, il server Express e l'app desktop si avviano insieme in background.
* **Salvataggio:** I PNG generati e scontornati vengono salvati direttamente all'interno della cartella degli asset del gioco principale (`../assets/sprites/`).
* **Arresto:** Alla chiusura dell'interfaccia Electron (cliccando sulla X), anche il server Express in background si arresta automaticamente.

---

## 🛠️ Requisiti & Installazione
1. Assicurati di avere installato **Node.js** sul tuo computer.
2. Apri il terminale all'interno di questa cartella (`asset-pipeline-desktop`) ed esegui:
   ```bash
   npm install
   ```

---

## 💻 Come Avviarlo
* **Windows (Doppio Click):** Esegui direttamente il file batch `AVVIA_ASSET_GENERATOR.bat` presente in questa cartella.
* **Da Terminale (Qualsiasi OS):**
   ```bash
   npm run app
   ```

---

## 📂 Come Caricare Liste di Prompt (Drag & Drop)
L'applicazione supporta il caricamento massivo di code di prompt trascinando direttamente un file nel pannello **`📂 Trascina qui un file TXT o JSON...`**:

### Formato File di Testo (`.txt`)
Scrivi le righe separando il percorso e il prompt con una barra verticale `|`:
```text
classes/char_ninja.png | A ninja assassin, 16-bit retro game pixel art style, transparent background
enemies/slime_fire.png | Burning red fire slime, pixel art, front view
```

### Formato JSON (`.json`)
Trascina un array JSON:
```json
[
  {
    "prompt": "Necromancer character cast spell, 16-bit pixel art",
    "folder": "classes",
    "fileName": "char_necromancer.png"
  }
]
```

---

## 🚢 Esportazione in altri Progetti
Per utilizzare questo strumento in un altro videogioco:
1. Copia l'intera cartella `asset-pipeline-desktop` nella radice del nuovo progetto.
2. Assicurati che nella radice del nuovo progetto esista la cartella di destinazione degli asset (ad esempio `assets/sprites/` o modifica il percorso `SPRITES_DIR` in `server.js` per puntare alla cartella degli asset del tuo nuovo gioco).
3. Esegui `npm install` all'interno della cartella ed avvia!
