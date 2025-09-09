// public/autobus.js
// Utilise socket et username global
const autobusPanel = document.getElementById('autobus-panel');
const autobusCards = document.getElementById('autobus-cards');
const autobusBtns = document.getElementById('autobus-btns');
const autobusMsg = document.getElementById('autobus-msg');

function getCardSvg(val) {
  const labels = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let label = labels[val-1] || '?';
  return `<svg width="40" height="60" viewBox="0 0 40 60"><rect width="40" height="60" rx="6" fill="#fff" stroke="#222"/><text x="8" y="20" font-size="18" fill="#222">${label}</text></svg>`;
}

const NUM_PILES = 5;

let piles = [];
let currentCards = [];
let nextCards = [];
let currentPileIdx = 0;

function drawCard() {
  return Math.floor(Math.random() * 13) + 1;
}

function resetAutobus() {
  piles = Array(NUM_PILES).fill().map(() => []);
  currentCards = Array(NUM_PILES).fill().map(() => drawCard());
  nextCards = Array(NUM_PILES).fill().map(() => drawCard());
  currentPileIdx = 0;
  renderAutobus();
  autobusMsg.textContent = '';
  autobusBtns.style.display = '';
}

function renderAutobus() {
  autobusCards.innerHTML = '<div style="display:flex; gap:16px; justify-content:center; width:150%;">';
  for (let p = 0; p < NUM_PILES; p++) {
    autobusCards.innerHTML += `<div style="display:flex; flex-direction:column; align-items:center; min-width:40px;">`;
    // Affiche seulement la dernière carte posée dans la pile (ou rien si vide)
    if (piles[p].length > 0) {
      let svg = getCardSvg(piles[p][piles[p].length-1]);
      autobusCards.innerHTML += `<span style="margin:2px 0;">${svg}</span>`;
    }
    // Affiche la carte actuelle (dessus du paquet)
    let svg = getCardSvg(currentCards[p]);
    let border = (p === currentPileIdx) ? 'border:2px solid #9147ff;' : '';
    autobusCards.innerHTML += `<span style="margin:2px 0; ${border}">${svg}</span>`;
    // Affiche le dos de la prochaine carte (non révélée)
    autobusCards.innerHTML += `<span style="margin:2px 0; border:2px solid #222; background:#9147ff; display:inline-block; width:40px; height:60px; border-radius:6px;"></span>`;
    // Boutons plus/moins uniquement pour la pile cour(ante
    if (p === currentPileIdx) {
      autobusCards.innerHTML += `<div style="margin:4px 0;">
        <button class="autobus-btn" data-pile="${p}" data-guess="plus" style="background:#32CD32; color:#fff; font-weight:bold; border:none; border-radius:6px; padding:4px 12px; margin-right:6px; cursor:pointer;">Plus grand</button>
        <button class="autobus-btn" data-pile="${p}" data-guess="moins" style="background:#FF4500; color:#fff; font-weight:bold; border:none; border-radius:6px; padding:4px 12px; cursor:pointer;">Plus petit</button>
      </div>`;
    }
    autobusCards.innerHTML += `</div>`;
  } 
  autobusCards.innerHTML += '</div>';
}

let canPlay = true;
autobusCards.addEventListener('click', function(e) {
  if (e.target.classList.contains('autobus-btn') && canPlay) {
    const pileIdx = parseInt(e.target.dataset.pile);
    if (pileIdx !== currentPileIdx) return;
    const guess = e.target.dataset.guess;
    canPlay = false;
    if ((guess === 'plus' && nextCards[pileIdx] > currentCards[pileIdx]) || (guess === 'moins' && nextCards[pileIdx] < currentCards[pileIdx])) {
      piles[pileIdx].push(nextCards[pileIdx]);
      autobusMsg.textContent = `Bravo ! (Pile ${pileIdx+1})`;
      currentCards[pileIdx] = nextCards[pileIdx];
      nextCards[pileIdx] = drawCard();
      // Passe à la pile suivante si la pile est remplie (par exemple 10 cartes)
      currentPileIdx++;
      if (currentPileIdx >= NUM_PILES || piles[pileIdx].length >= 10) {
        autobusMsg.textContent = 'Félicitations, toutes les piles sont complétées !';
        setTimeout(() => { resetAutobus(); canPlay = true; }, 3000);
        return;
      }
      setTimeout(() => { canPlay = true; renderAutobus(); }, 600);
    } else {
      // Affiche la carte piochée même en cas d'échec
      autobusCards.innerHTML += `<br><span style='font-size:1.1rem;'>La carte piochée était : ${getCardSvg(nextCards[pileIdx])}</span>`;
      autobusMsg.textContent = `Raté, tu recommences à la première pile !`;
      setTimeout(() => {
        piles = Array(NUM_PILES).fill().map(() => []);
        currentCards = Array(NUM_PILES).fill().map(() => drawCard());
        nextCards = Array(NUM_PILES).fill().map(() => drawCard());
        currentPileIdx = 0;
        canPlay = true;
        renderAutobus();
        autobusMsg.textContent = '';
      }, 1500);
    }
  }
});

resetAutobus();

// Calculateur de probabilité
