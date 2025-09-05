// public/rplace.js
// Utilise la variable socket déjà déclarée dans chat.twig
const gridSize = 16;
const colors = [
    '#FF4500', '#FFA800', '#FFD635', '#00A368', '#7EED56', '#2450A4', '#3690EA', '#51E9F4', '#811E9F', '#B44AC0',
    '#FF99AA', '#9C6926', '#000000', '#898D90', '#FFFFFF', '#D4D7D9'
];
// Utilise la variable globale username déjà définie dans chat.twig

// Récupère la grille ou crée une grille vide
let grid = Array(gridSize * gridSize).fill({ color: '#FFFFFF', user: '' });

const rplaceContainer = document.getElementById('rplace-container');
const colorPicker = document.getElementById('color-picker');
const gridElem = document.getElementById('rplace-grid');

// Génère le sélecteur de couleurs
colors.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.style.background = c;
    btn.dataset.color = c;
    btn.title = c;
    btn.onclick = () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    };
    if (i === 0) btn.classList.add('selected');
    colorPicker.appendChild(btn);
});

function getSelectedColor() {
    const btn = document.querySelector('.color-btn.selected');
    return btn ? btn.dataset.color : colors[0];
}

// Affiche la grille
function renderGrid(gridData) {
    gridElem.innerHTML = '';
    gridData.forEach((pix, idx) => {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.style.background = pix.color;
        pixel.dataset.idx = idx;
        pixel.title = pix.user ? `Placé par: ${pix.user}` : '';
        pixel.onmouseenter = () => {
            if (pix.user) pixel.title = `Placé par: ${pix.user}`;
        };
        pixel.onclick = () => {
            if (!username) return;
            const color = getSelectedColor();
            socket.emit('rplace pixel', { idx, color, user: username });
        };
        gridElem.appendChild(pixel);
    });
}

// Synchronisation initiale
socket.on('rplace grid', (data) => {
    grid = data;
    renderGrid(grid);
});

// Pixel modifié
socket.on('rplace pixel', ({ idx, color, user }) => {
    grid[idx] = { color, user };
    renderGrid(grid);
});

// Demande la grille au chargement
socket.emit('rplace get');
