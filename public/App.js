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

// Génère une couleur pseudo unique façon Twitch
function getUsernameColor(name) {
    const colors = [
        '#FF69B4', '#1E90FF', '#32CD32', '#FFD700', '#FF4500', '#8A2BE2', '#00CED1', '#FF6347', '#00FF7F', '#FFB6C1',
        '#20B2AA', '#FF8C00', '#7FFF00', '#DC143C', '#00BFFF', '#ADFF2F', '#FF00FF', '#40E0D0', '#FF1493', '#00FA9A'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

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
