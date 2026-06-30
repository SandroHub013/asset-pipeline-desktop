const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Jimp } = require('jimp');

const app = express();
const PORT = 9003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rispetto alla cartella asset-pipeline-desktop, assets si trova al livello superiore (..)
const SPRITES_DIR = path.resolve(__dirname, '..', 'assets', 'sprites');

// Helper to ensure target directory exists
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Endpoint: Generate image via OpenRouter
app.post('/api/generate', async (req, res) => {
  const { prompt, model, apiKey } = req.body;

  if (!prompt || !apiKey) {
    return res.status(400).json({ error: 'Prompt e API Key sono richiesti' });
  }

  const selectedModel = model || 'google/gemini-3-pro-image';
  console.log(`[Pipeline] Avvio generazione con modello: ${selectedModel}`);
  console.log(`[Pipeline] Prompt: "${prompt}"`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:9003',
        'X-Title': 'Incremental Idle Asset Pipeline'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('[Pipeline] Errore OpenRouter:', data.error);
      return res.status(500).json({ error: data.error.message || 'Errore nella generazione' });
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[Pipeline] Risposta non valida da OpenRouter:', JSON.stringify(data));
      return res.status(500).json({ error: 'Risposta non valida da OpenRouter. Verifica il modello o la chiave.' });
    }

    console.log('[Pipeline] Payload completo ricevuto:', JSON.stringify(data).substring(0, 150) + '...');
    const message = data.choices[0].message;
    const content = (message.content || '').trim();

    let b64Json = '';

    // Gestione vari formati di output dell'immagine
    if (!content) {
      // Alcuni modelli su OpenRouter restituiscono l'immagine in campi specifici o allegati (es. array message.images o message.image_url)
      if (message.images && message.images[0] && message.images[0].image_url) {
        const url = message.images[0].image_url.url;
        console.log(`[Pipeline] Rilevato URL nel campo message.images[0]: ${url.substring(0, 80)}...`);
        if (url.includes('base64,')) {
          const commaIdx = url.indexOf('base64,');
          b64Json = url.substring(commaIdx + 7).trim();
        } else {
          const imgRes = await fetch(url);
          const imgBuffer = await imgRes.buffer();
          b64Json = imgBuffer.toString('base64');
        }
      } else if (message.image_url) {
        const url = typeof message.image_url === 'object' ? message.image_url.url : message.image_url;
        console.log(`[Pipeline] Rilevato URL nel campo alternativo image_url: ${url}`);
        const imgRes = await fetch(url);
        const imgBuffer = await imgRes.buffer();
        b64Json = imgBuffer.toString('base64');
      } else {
        return res.status(500).json({ error: 'Nessun contenuto testuale o URL immagine ricevuto nella risposta' });
      }
    } else if (content.includes('data:image') && content.includes('base64,')) {
      // Formato Data URI: data:image/png;base64,iVBORw0KG...
      const commaIdx = content.indexOf('base64,');
      b64Json = content.substring(commaIdx + 7).trim();
    } else if (content.startsWith('http://') || content.startsWith('https://')) {
      // Formato URL diretto
      console.log(`[Pipeline] Scaricamento immagine da URL: ${content}`);
      const imgRes = await fetch(content);
      const imgBuffer = await imgRes.buffer();
      b64Json = imgBuffer.toString('base64');
    } else if (content.match(/https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp)/i)) {
      // Ricerca di qualsiasi URL immagine nel testo (es. all'interno di tag markdown o link generici)
      const match = content.match(/(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp))/i);
      const url = match[1];
      console.log(`[Pipeline] Rilevato URL immagine nel testo: ${url}`);
      const imgRes = await fetch(url);
      const imgBuffer = await imgRes.buffer();
      b64Json = imgBuffer.toString('base64');
    } else {
      // Fallback: prova ad assumere che il testo sia direttamente la stringa base64 (ripulendo spazi/ritorni)
      b64Json = content.replace(/\s/g, '');
    }

    return res.json({ b64_json: b64Json });
  } catch (err) {
    console.error('[Pipeline] Eccezione durante generazione:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint: Save image to project sprites folder
app.post('/api/save', async (req, res) => {
  const { b64Data, folder, fileName, removeBg, customOutputDir } = req.body;

  if (!b64Data || !folder || !fileName) {
    return res.status(400).json({ error: 'Dati mancanti (b64Data, folder, fileName)' });
  }

  const baseDir = customOutputDir || SPRITES_DIR;
  const targetDir = path.join(baseDir, folder);
  ensureDirectory(targetDir);
  const outputPath = path.join(targetDir, fileName);

  console.log(`[Pipeline] Salvataggio asset in: ${outputPath}`);

  try {
    const buffer = Buffer.from(b64Data, 'base64');

    if (removeBg) {
      console.log('[Pipeline] Esecuzione rimozione sfondo scuro via Jimp...');
      const image = await Jimp.read(buffer);

      // Scontorna lo sfondo nero/scuro
      image.scan(0, 0, image.width, image.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        if (r < 25 && g < 25 && b < 25) {
          this.bitmap.data[idx + 3] = 0; // Trasparenza
        }
      });

      const processedBuffer = await image.getBuffer('image/png');
      fs.writeFileSync(outputPath, processedBuffer);
    } else {
      fs.writeFileSync(outputPath, buffer);
    }

    console.log('[Pipeline] Asset salvato con successo!');
    return res.json({ success: true, path: outputPath });
  } catch (err) {
    console.error('[Pipeline] Errore nel salvataggio:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Serve frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`Incremental Idle Asset Pipeline running at:`);
  console.log(`👉 http://localhost:${PORT}/`);
  console.log(`Assets will be saved directly to: ${SPRITES_DIR}`);
  console.log(`======================================================\n`);
});
