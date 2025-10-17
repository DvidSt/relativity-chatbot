# 🚀 Guía de Deployment - Relativity Chatbot

## 📋 Pre-requisitos

1. **Node.js 18+** instalado
2. **Google Cloud Account** con Gemini API habilitado
3. **Google Sheets API** configurado
4. **Railway/Vercel/Render** account (opcional para deployment)

## ⚙️ Configuración Paso a Paso

### 1. Clonar y Setup Inicial

```bash
# Clonar proyecto
git clone <tu-repositorio>
cd relativity-chatbot

# Instalar dependencias
npm install
```

### 2. Configurar Gemini API

1. Ve a: https://makersuite.google.com/app/apikey
2. Crea una API key
3. Copia la key

### 3. Configurar Google Sheets

1. Ve a: https://console.cloud.google.com
2. Crea un proyecto nuevo
3. Habilita Google Sheets API
4. Crea Service Account
5. Descarga JSON credentials
6. Crea un Google Sheet nuevo
7. Comparte el Sheet con el email del Service Account

### 4. Configurar Variables de Entorno

Crea archivo `.env`:

```env
# Gemini API
GEMINI_API_KEY=tu_gemini_api_key_aquí

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=tu_sheet_id_aquí

# Server
PORT=3001
NODE_ENV=production
```

**IMPORTANTE**: El `GOOGLE_SHEETS_CREDENTIALS` debe ser el contenido completo del JSON en una sola línea.

### 5. Verificar que Todo Funciona

```bash
# Build
npm run build

# Start
npm start
```

Deberías ver:
```
╔════════════════════════════════════════════════════╗
║   🚀 Relativity Chatbot API v2.0                  ║
║   Port: 3001                                       ║
║   ✅ Intent Detection System Active               ║
║   ✅ Smart Search Engine Ready                    ║
║   ✅ AI-Powered Responses Enabled                 ║
║   ✅ Auto-Updater Initialized                     ║
╚════════════════════════════════════════════════════╝
```

### 6. Probar en Browser

Abre: `http://localhost:3001`

Prueba:
1. "Hola" - Debe responder sin formulario
2. "What's new in aiR?" - Debe dar respuesta técnica
3. Abre console (F12) - Debe ver logs de intent detection

---

## 🌐 Deploy a Railway (Recomendado)

### Setup

1. Instala Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Link proyecto:
```bash
railway link
```

4. Configura variables:
```bash
railway variables set GEMINI_API_KEY="tu_key"
railway variables set GOOGLE_SHEET_ID="tu_sheet_id"
railway variables set GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

5. Deploy:
```bash
railway up
```

6. Get URL:
```bash
railway open
```

---

## 🐳 Deploy con Docker (Alternativo)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**Build y Run**:
```bash
docker build -t relativity-chatbot .
docker run -p 3001:3001 --env-file .env relativity-chatbot
```

---

## ☁️ Deploy a Vercel (Serverless)

**Nota**: El auto-updater no funcionará en Vercel (serverless), pero el resto sí.

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configura variables en Vercel dashboard

---

## 🔧 Configuración de Producción

### Performance Tuning

```env
# En .env de producción
NODE_ENV=production
PORT=3001

# Cache más largo si lo deseas
CACHE_DURATION_HOURS=48
```

### Logs en Producción

Los logs se mostrarán en:
- Railway: `railway logs`
- Docker: `docker logs <container_id>`
- Vercel: Vercel dashboard

---

## 🔒 Seguridad

### Checklist

- [ ] ✅ API keys en variables de entorno (NO en código)
- [ ] ✅ CORS configurado apropiadamente
- [ ] ✅ Validación de inputs
- [ ] ✅ Rate limiting (pendiente - añadir si es necesario)
- [ ] ✅ HTTPS en producción
- [ ] ✅ Service Account con permisos mínimos

### Recomendaciones

1. **CORS**: En producción, especifica dominio exacto
```typescript
app.use(cors({
  origin: 'https://tu-dominio.com'
}));
```

2. **Rate Limiting**: Añade express-rate-limit
```bash
npm install express-rate-limit
```

---

## 📊 Monitoreo

### Logs a Revisar

1. **Intent Detection**:
```
🎯 Intent detected: QUESTION (confidence: 90%, language: en)
```

2. **Search Performance**:
```
📊 Found 15 relevant releases (score: 85)
```

3. **Auto-Update**:
```
🔄 Checking for new releases...
✅ No new releases found
```

4. **Errors**:
```
❌ Error: [descripción del error]
```

### Health Check

Endpoint disponible:
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Relativity Chatbot API",
  "version": "2.0",
  "features": [
    "intent-detection",
    "smart-search",
    "ai-escalation"
  ]
}
```

---

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY not set"
**Solución**: Verifica que `.env` existe y tiene la key correcta

### Error: "Failed to load release data"
**Solución**: Verifica que `data/Releases_History.csv` existe

### Error: Google Sheets connection failed
**Solución**: 
1. Verifica credentials JSON
2. Verifica que Sheet está compartido con Service Account
3. Verifica GOOGLE_SHEET_ID

### Warning: Puppeteer no inicia
**Solución**: En Railway/Docker añade:
```bash
# Para Railway
apt-get install -y chromium

# O usa variable
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

## 📦 Estructura de Deployment

```
Production Setup:
├── Environment Variables (Railway/Vercel)
├── Build: npm run build
├── Start: npm start
├── Health Check: /health endpoint
└── Monitoring: Console logs
```

---

## ✅ Checklist Final Pre-Deploy

- [ ] ✅ `.env` configurado con todas las variables
- [ ] ✅ `npm install` ejecutado
- [ ] ✅ `npm run build` exitoso
- [ ] ✅ `npm start` inicia sin errores
- [ ] ✅ Health check responde
- [ ] ✅ Chat responde "Hola"
- [ ] ✅ Chat responde pregunta técnica
- [ ] ✅ Formulario guarda en Google Sheets
- [ ] ✅ Console logs visibles
- [ ] ✅ README actualizado con URL de deploy

---

## 🎯 Para la Demo

### URL a compartir

Después de deploy, tendrás algo como:
```
https://relativity-chatbot-production.up.railway.app
```

**Incluir en el PDF**:
- ✅ Link al chatbot funcionando
- ✅ Link al Google Sheet (read-only)
- ✅ Screenshots del chat
- ✅ Screenshots de los logs

---

## 📞 Support

Si tienes problemas durante el deployment:

1. Revisa logs: `railway logs` o console del hosting
2. Verifica variables de entorno
3. Test local primero con `npm run dev`
4. Revisa el TROUBLESHOOTING section

---

**¡Listo para deployment!** 🚀