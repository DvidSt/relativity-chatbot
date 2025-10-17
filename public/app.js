const API_BASE = window.location.origin;
let sessionId = 'session_' + Date.now();
let isCollectingContact = false;
let lastQuestion = '';

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const contactForm = document.getElementById('contactForm');
const contactFormElement = document.getElementById('contactFormElement');
const typingIndicator = document.getElementById('typingIndicator');

// Add welcome message on load
window.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = `
        <div class="welcome-banner">
            <h3>👋 Welcome to Relativity Release Assistant</h3>
            <p>I can help you with questions about Relativity RelativityOne releases and features.</p>
            <p class="small">Try asking: "What's new in 2025?" or "Tell me about aiR for Review"</p>
        </div>
    `;
    chatMessages.innerHTML = welcomeMessage;
});

function addMessage(content, isUser = false, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    if (isHtml) {
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    } else {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        messageDiv.appendChild(contentDiv);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

async function sendMessage(message) {
    if (!message || message.trim() === '') return;
    
    lastQuestion = message;
    addMessage(message, true);
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    showTyping();

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId })
        });

        const data = await response.json();

        hideTyping();
        
        // Format markdown-like responses
        let formattedAnswer = data.answer;
        if (formattedAnswer.includes('•') || formattedAnswer.includes('-')) {
            formattedAnswer = formattedAnswer.replace(/\n/g, '<br>');
        }
        
        addMessage(formattedAnswer, false, true);

        if (data.needsContact) {
            isCollectingContact = true;
            contactForm.style.display = 'block';
            // Store the question for submission
            document.getElementById('contactFormElement').dataset.question = lastQuestion;
        }

    } catch (error) {
        hideTyping();
        const errorMsg = 'Sorry, I encountered an error. Please try again or refresh the page.';
        addMessage(errorMsg);
        console.error('Chat error:', error);
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

contactFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('emailInput').value;
    const organization = document.getElementById('orgInput').value;
    const question = e.target.dataset.question || lastQuestion || 'General inquiry';

    // Disable form during submission
    const submitButton = contactFormElement.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_BASE}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                organization,
                question,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (data.success) {
            addMessage('✅ ' + data.message);
            contactForm.style.display = 'none';
            isCollectingContact = false;
            contactFormElement.reset();
        } else {
            addMessage('❌ Please check your information and try again.');
        }

    } catch (error) {
        addMessage('❌ Failed to submit contact information. Please try again.');
        console.error('Contact submission error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
});

sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) sendMessage(message);
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) sendMessage(message);
    }
});

// Auto-focus on input
messageInput.focus();