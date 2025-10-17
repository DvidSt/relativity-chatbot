# ⚡ Quick Start - ¡Pon el Chatbot Funcionando en 5 Minutos!

## 🚀 Paso 1: Instalar (30 segundos)

```bash
npm install
```

## 🔑 Paso 2: Configurar .env (2 minutos)

Crea archivo `.env` en la raíz:

```env
GEMINI_API_KEY=tu_gemini_api_key
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"tu-project",...}
GOOGLE_SHEET_ID=tu_sheet_id
PORT=3001
```

### ¿Dónde conseguir las keys?

**GEMINI_API_KEY**:
1. Ve a https://makersuite.google.com/app/apikey
2. Crea una API key
3. Copia y pega

**GOOGLE_SHEETS_CREDENTIALS**:
1. Ve a https://console.cloud.google.com
2. Crea proyecto → Habilita Sheets API
3. Crea Service Account → Descarga JSON
4. Copia TODO el contenido del JSON (en una línea)

**GOOGLE_SHEET_ID**:
1. Crea un Google Sheet
2. Compártelo con el email del Service Account
3. Copia el ID de la URL: `docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`

## 🏗️ Paso 3: Build (30 segundos)

```bash
npm run build
```

## ▶️ Paso 4: Start (10 segundos)

```bash
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

## 🌐 Paso 5: Probar (1 minuto)

1. Abre: `http://localhost:3001`
2. Abre Console (F12)
3. Escribe: "Hola"
4. Escribe: "What's new in aiR for Review?"

**¡Listo!** 🎉

---

## 🧪 Tests Rápidos

Copia y pega estos mensajes para probar todos los flujos:

```
1. Hola
2. Hello
3. What's new in 2025?
4. ¿Qué hay de nuevo en aiR for Review?
5. Tell me about Legal Hold
6. How do I reset my password?
```

Deberías ver:
- 1-2: Respuestas de saludo, NO formulario
- 3-5: Respuestas técnicas, NO formulario
- 6: Mensaje de escalación, SÍ formulario

---

## 🐛 Problemas Comunes

### "GEMINI_API_KEY not set"
✅ Verifica que `.env` existe en la raíz
✅ Verifica que la key es correcta
✅ Reinicia el server

### "Failed to load release data"
✅ Verifica que `data/Releases_History.csv` existe
✅ El archivo debe tener 1,297+ líneas

### Google Sheets error
✅ Verifica que compartiste el Sheet
✅ Verifica que el Service Account tiene acceso
✅ Verifica que el SHEET_ID es correcto

---

## 🎯 Para la Demo

### Preparación (5 minutos antes):

```bash
# 1. Asegúrate que todo está actualizado
npm run build

# 2. Inicia el server
npm start

# 3. Abre el browser
# Navega a http://localhost:3001

# 4. Abre Console (F12)
# Deja la tab de Console visible

# 5. Ten Google Sheet abierto en otra tab
# Para mostrar donde se guardan contactos
```

### Durante la Demo:

1. **Siempre muestra los logs** - Es tu prueba de inteligencia
2. **Explica mientras escribes** - No solo escribas en silencio
3. **Señala el comportamiento** - "Ven que NO muestra formulario aquí"

---

## 📝 Checklist Pre-Demo

- [ ] `.env` configurado correctamente
- [ ] `npm install` ejecutado
- [ ] `npm run build` exitoso
- [ ] `npm start` corriendo sin errores
- [ ] Browser en localhost:3001
- [ ] Console abierto (F12)
- [ ] Google Sheet abierto
- [ ] VSCode con `src/prompts/` visible
- [ ] Internet connection estable
- [ ] ¡Actitud positiva! 😊

---

## 🎬 Orden Sugerido de Demo

1. **Greeting** (30s) - "Hola" → respuesta natural
2. **Question** (1m) - Pregunta técnica → muestra logs
3. **Multi-language** (30s) - Pregunta en español
4. **Escalation** (1m) - Pregunta fuera de scope
5. **Architecture** (1m) - Muestra código/prompts
6. **Q&A** (2m) - Responde preguntas

**Total**: ~6 minutos

---

## 💡 Si Algo Sale Mal

### El chatbot no responde
1. Check console del browser - ¿hay errores?
2. Check terminal - ¿el server está corriendo?
3. Reinicia: Ctrl+C y `npm start` de nuevo

### Respuesta tarda mucho
- Esto es normal para la primera pregunta
- Gemini API puede tardar 2-3 segundos
- Menciona: "La primera llamada inicializa el modelo"

### Formulario no aparece
- Verifica que preguntaste algo fuera de scope
- Check logs: debe decir `needsContact: true`

---

## 🎯 Mensaje de Confianza

**Tienes**:
- ✅ Sistema funcionando
- ✅ Código profesional
- ✅ Documentación completa
- ✅ Arquitectura sólida

**Estás listo** para impresionar. 

El trabajo es tuyo - solo demuestra lo que construiste.

---

**¡ÉXITO!** 🌟

Ahora ve y consigue ese trabajo! 💪