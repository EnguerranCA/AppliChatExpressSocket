let username = localStorage.getItem('chatPseudo') || '';
if (!username) {
    window.location.href = '/login';
}
const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const messages = document.getElementById('messages');

input.disabled = false;
sendBtn.disabled = false;
input.focus();
socket.emit('set username', username);

// Affiche l'historique des messages à l'arrivée
socket.on('chat history', function(messagesArr) {
    messages.innerHTML = '';
    messagesArr.forEach(function(data) {
        const item = document.createElement('li');
        const userSpan = document.createElement('span');
        userSpan.className = 'username';
        userSpan.textContent = data.pseudo;
        userSpan.style.color = getUsernameColor(data.pseudo);
        item.appendChild(userSpan);
        item.appendChild(document.createTextNode(': ' + data.content));
        messages.appendChild(item);
    });
    messages.scrollTop = messages.scrollHeight;
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value && username) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

socket.on('chat message', function(data) {
    const item = document.createElement('li');
    const userSpan = document.createElement('span');
    userSpan.className = 'username';
    userSpan.textContent = data.user;
    userSpan.style.color = getUsernameColor(data.user);
    item.appendChild(userSpan);
    item.appendChild(document.createTextNode(': ' + data.message));
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});
