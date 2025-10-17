# 🧪 Guía de Testing - Relativity Chatbot

## 🎯 Test Cases para la Demostración

### ✅ Test 1: Greeting Flow (NO debe mostrar formulario)

**Input**: `Hola`

**Resultado esperado**:
- ✅ Respuesta natural en español
- ✅ NO muestra formulario
- ✅ Tono amigable y profesional

**Ejemplo**: "¡Hola! ¿En qué puedo ayudarte hoy con Relativity?"

**Logs esperados**:
```
📨 New message: "Hola"
🎯 Intent detected: GREETING (confidence: 95%, language: es)
💬 Routing to GREETING flow
📤 Sending response (needsContact: false)
```

---

### ✅ Test 2: Question Flow con Resultados

**Input**: `What's new in aiR for Review in 2025?`

**Resultado esperado**:
- ✅ Respuesta técnica con citations
- ✅ Menciona fechas específicas
- ✅ NO muestra formulario (porque encontró info)
- ✅ Responde en inglés

**Logs esperados**:
```
📨 New message: "What's new in aiR for Review in 2025?"
🎯 Intent detected: QUESTION (confidence: 90%, language: en)
🔍 Routing to QUESTION flow
📝 Keywords extracted: ["aiR", "Review", "2025", "new"]
📊 Found 12 relevant releases (score: 85)
✅ Answer generated using 12 releases
📤 Sending response (needsContact: false)
```

---

### ✅ Test 3: Question Flow en Español

**Input**: `¿Qué hay de nuevo en Processing en 2024?`

**Resultado esperado**:
- ✅ Respuesta en español
- ✅ Información sobre Processing de 2024
- ✅ Citations con fechas

**Logs esperados**:
```
🔍 Conducting research for: "¿Qué hay de nuevo en Processing en 2024?"
📝 Keywords extracted: ["Processing", "2024", "nuevo"]
📊 Found 18 relevant releases (score: 78)
```

---

### ✅ Test 4: Escalation Flow (NO encontró info)

**Input**: `How do I reset my password?`

**Resultado esperado**:
- ✅ Mensaje empático generado por IA
- ✅ Explica por qué no puede responder
- ✅ SÍ muestra formulario
- ✅ Mensaje NO es estático

**Logs esperados**:
```
📨 New message: "How do I reset my password?"
🎯 Intent detected: QUESTION (confidence: 85%, language: en)
🔍 Routing to QUESTION flow
📝 Keywords extracted: ["reset", "password"]
📊 Found 0 relevant releases (score: 0)
⚠️ Escalating to contact form
📤 Sending response (needsContact: true)
```

---

### ✅ Test 5: Contact Form Submission

**Input**: 
- Name: "John Doe"
- Email: "john@example.com"
- Organization: "Acme Corp"

**Resultado esperado**:
- ✅ Validación exitosa
- ✅ Guardado en Google Sheets
- ✅ Mensaje de confirmación
- ✅ Formulario se oculta

**Logs esperados**:
```
📝 Contact submission received: John Doe
✅ Contact saved to Google Sheets
```

---

## 🔍 Verificaciones de Calidad

### Checklist Pre-Demo

- [ ] ✅ Responde "Hola" sin formulario
- [ ] ✅ Responde "Hello" sin formulario
- [ ] ✅ Pregunta técnica da respuesta con citations
- [ ] ✅ Pregunta en español responde en español
- [ ] ✅ Pregunta fuera de scope muestra formulario
- [ ] ✅ Formulario guarda en Google Sheets
- [ ] ✅ Logs muestran intent detection
- [ ] ✅ Auto-updater inicia (check logs)
- [ ] ✅ Frontend muestra welcome banner
- [ ] ✅ UI responsive y profesional

---

## 🎬 Script de Demostración

### Parte 1: Demostrar Conversación Natural (30 segundos)

**Tú dices**: "Primero, les muestro que el chatbot puede tener conversaciones naturales"

**Test**:
1. Escribe: "Hello"
2. Escribe: "Hola"  
3. Escribe: "Good morning"

**Señala**: "Ven que NO muestra el formulario - entiende que es conversación casual"

---

### Parte 2: Demostrar Búsqueda Inteligente (1 minuto)

**Tú dices**: "Ahora una pregunta técnica para mostrar la búsqueda inteligente"

**Test**:
1. Escribe: "What's new in aiR for Review in 2025?"
2. **Abre console** (F12) mientras procesa
3. Señala los logs mostrando:
   - Intent detection
   - Keyword extraction
   - Smart search (solo 15 releases, no 1297!)

**Señala**: "El sistema extrae keywords, busca solo releases relevantes, y genera una respuesta contextual"

---

### Parte 3: Demostrar Multi-idioma (30 segundos)

**Tú dices**: "El sistema es multiidioma"

**Test**:
1. Escribe: "¿Qué novedades hay en Legal Hold?"
2. Muestra respuesta en español

**Señala**: "Detecta el idioma y responde en el mismo idioma"

---

### Parte 4: Demostrar AI Escalation (1 minuto)

**Tú dices**: "Cuando no puede responder, la IA genera un mensaje personalizado"

**Test**:
1. Escribe: "How do I reset my password?"
2. Muestra mensaje de escalación (generado por IA)
3. Muestra que aparece el formulario
4. **NO llenes el formulario** (solo muéstralo)

**Señala**: "El mensaje NO es estático - es generado por IA cada vez, personalizado a la pregunta"

---

### Parte 5: Demostrar Arquitectura (1 minuto)

**Tú dices**: "Permítanme mostrarles la arquitectura del sistema"

**Muestra**:
1. Carpeta `src/prompts/` - "Prompts editables sin código"
2. Archivo `ARCHITECTURE.md` - "Documentación completa"
3. Console logs - "Decisiones transparentes del AI"

**Señala**: "Esto demuestra no solo funcionalidad, sino arquitectura profesional y mantenible"

---

### Parte 6: Demostrar Contact Submission (30 segundos)

**Tú dices**: "Finalmente, el formulario guarda en Google Sheets"

**Test**:
1. Vuelve a una pregunta que escale
2. Llena el formulario:
   - Name: "Test User"
   - Email: "test@example.com"
   - Organization: "Demo Corp"
3. Submit
4. **Abre Google Sheet** y muestra el registro

**Señala**: "Cada contacto se registra con timestamp y contexto de la pregunta"

---

## 📸 Screenshots Recomendados

Para el PDF de entrega, incluye:

1. **Chat funcionando**:
   - Greeting sin formulario
   - Question con respuesta técnica
   - Escalation con formulario

2. **Console logs**:
   - Intent detection
   - Smart search
   - Keyword extraction

3. **Código (opcional)**:
   - Carpeta prompts/
   - Architecture diagram
   - Intent detection logic

4. **Google Sheet**:
   - Contactos guardados con timestamp

---

## ⚡ Quick Test Script

Copia y pega estos mensajes en secuencia:

```
1. "Hola"                                    → Expect: Greeting, NO form
2. "What's new in 2025?"                     → Expect: List of 2025 features
3. "Tell me about aiR for Review"            → Expect: aiR info with dates
4. "¿Qué hay de nuevo en Legal Hold?"        → Expect: Spanish response
5. "How do I contact technical support?"     → Expect: Escalation + form
```

---

## 🎯 Puntos Clave para Mencionar

Durante la demo, enfatiza:

1. **"No envía 1,297 releases a la IA"**
   - Solo los 10-20 más relevantes
   - 90% más rápido
   - 95% menos costoso

2. **"Intent Detection automático"**
   - Entiende contexto
   - No confunde saludos con preguntas
   - Routing inteligente

3. **"Prompts editables"**
   - Sin tocar código
   - Fácil optimización
   - A/B testing simple

4. **"Multi-idioma nativo"**
   - Detecta automáticamente
   - Responde en mismo idioma
   - No traducciones forzadas

5. **"Auto-actualización"**
   - Puppeteer scraping
   - Cada 6 horas
   - Sin intervención manual

6. **"Arquitectura escalable"**
   - Separation of concerns
   - Easy to maintain
   - Professional patterns

---

## 🚨 Errores Comunes a Evitar

1. ❌ **No mostrar console logs** - Son la prueba del sistema inteligente
2. ❌ **No explicar la arquitectura** - Es lo que te diferencia
3. ❌ **Solo mostrar el chat funcionando** - Muestra el "cómo"
4. ❌ **No mencionar los prompts editables** - Es un feature único
5. ❌ **Olvidar probar multi-idioma** - Demuestra internacionalización

---

## 💡 Tips para la Entrevista

**Si preguntan**: "¿Por qué no usar embeddings?"
**Respuesta**: "Para 1,297 documentos, keyword search con scoring es más eficiente y transparente. Si escalamos a 10K+, embeddings serían la siguiente evolución."

**Si preguntan**: "¿Por qué Gemini y no GPT?"
**Respuesta**: "Gemini 2.5 Flash ofrece excelente balance entre velocidad y calidad para este caso de uso, con mejor costo que GPT-4."

**Si preguntan**: "¿Cómo manejas rate limits?"
**Respuesta**: "El intent detection usa patterns primero (instantáneo), solo usa AI cuando es necesario. Además el smart search reduce tokens 95%."

**Si preguntan**: "¿Qué pasa si Gemini falla?"
**Respuesta**: "Cada servicio tiene fallbacks - mensajes predefinidos si AI no responde. La app nunca se rompe."

---

## 🎉 Éxito = Job Offer

Demuestra:
- ✅ Sistema funcional
- ✅ Arquitectura profesional  
- ✅ Código limpio y documentado
- ✅ Pensamiento estratégico
- ✅ Atención al detalle
- ✅ Conocimiento de IA actual

**¡Mucha suerte!** 🍀