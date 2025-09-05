// public/collabdoc.js
// Utilise la variable socket et username globale
const docArea = document.getElementById('collab-doc');
let isLocalEdit = false;

// Envoie la modification à chaque frappe
if (docArea) {
    docArea.addEventListener('input', function() {
        isLocalEdit = true;
        socket.emit('collabdoc update', { text: docArea.value, user: username });
    });
}

// Reçoit les modifications des autres
socket.on('collabdoc update', ({ text }) => {
    if (!isLocalEdit) {
        docArea.value = text;
    }
    isLocalEdit = false;
});

// Demande le contenu au chargement
socket.emit('collabdoc get');

socket.on('collabdoc init', ({ text }) => {
    docArea.value = text;
});
