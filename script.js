// script.js
window.addEventListener('DOMContentLoaded', () => {
  // --- Element refs ---
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar    = document.getElementById('loading-bar');
  const mainScreen    = document.getElementById('main-screen');
  const goButton      = document.getElementById('go-button');
  const gameScreen    = document.getElementById('game-screen');
  const canvas        = document.getElementById('click-canvas');
  const resultScreen  = document.getElementById('result-screen');
  const rarityText    = document.getElementById('rarity-text');
  const backButton    = document.getElementById('back-button');
  const overlayImg    = document.getElementById('overlay-image');

  // --- Audio setup ---
  const audios = {
    common:    new Audio('common.mp3'),
    uncommon:  new Audio('uncommon.mp3'),
    rare:      new Audio('rare.mp3'),
    legendary: new Audio('legendary.mp3'),
    godly:     new Audio('godly.mp3'),
    unknown:   new Audio('unknown.mp3'),
    background:new Audio('backround.mp3')
  };
  audios.background.loop = true;
  audios.background.volume = 0.2;

  // --- RNG‐zone config & dev‐mode setup ---
  const raritiesConfig = [
    { name:'unknown',  count: 5,  minR:30, maxR:60, devColor:'rgba(255,0,0,0.3)' },
    { name:'godly',    count: 8,  minR:30, maxR:60, devColor:'rgba(255,192,203,0.3)' },
    { name:'legendary',count:10,  minR:30, maxR:60, devColor:'rgba(255,215,0,0.3)' },
    { name:'rare',     count:12,  minR:30, maxR:60, devColor:'rgba(30,144,255,0.3)' },
    { name:'uncommon', count:20,  minR:30, maxR:60, devColor:'rgba(0,255,127,0.3)' }
  ];
  let zones = [];
  let devMode = false;

  // Canvas context
  const ctx = canvas.getContext('2d');

  // --- Utility functions ---
  const rand = (min,max) => min + Math.random()*(max-min);

  function initZones() {
    zones = [];
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    raritiesConfig.forEach(cfg => {
      for (let i = 0; i < cfg.count; i++) {
        const r = rand(cfg.minR, cfg.maxR);
        const x = rand(r, canvas.width  - r);
        const y = rand(r, canvas.height - r);
        zones.push({ x, y, r, name: cfg.name, color: cfg.devColor });
      }
    });
  }

  function drawDev() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    zones.forEach(z => {
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, 2*Math.PI);
      ctx.fillStyle = z.color;
      ctx.fill();
    });
  }

  function clearDev() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function detectRarity(x,y) {
    // check rarer first
    for (let cfg of raritiesConfig) {
      for (let z of zones.filter(z=>z.name===cfg.name)) {
        const dx = x - z.x, dy = y - z.y;
        if (dx*dx + dy*dy <= z.r*z.r) {
          return cfg.name;
        }
      }
    }
    return 'common';
  }

  function showResult(rarity) {
    // set gradient
    let grad;
    switch(rarity) {
      case 'common':
        grad = 'linear-gradient(to right, #777,#aaa)'; break;
      case 'uncommon':
        grad = 'linear-gradient(to right, #4CAF50,#8BC34A)'; break;
      case 'rare':
        grad = 'linear-gradient(to right, #2196F3,#64B5F6)'; break;
      case 'legendary':
        grad = 'linear-gradient(to right, #FFD700,#FFECB3)'; break;
      case 'godly':
        grad = 'linear-gradient(to right, #E91E63,#F48FB1)'; break;
      case 'unknown':
        grad = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
        resultScreen.style.animation = 'hue 5s infinite linear';
        break;
    }
    if (rarity !== 'unknown') resultScreen.style.animation = '';
    resultScreen.style.background = grad;

    // update text & overlay
    rarityText.textContent = rarity === 'unknown' ? '???' : rarity;
    overlayImg.src = 'overlay.png';

    // play sounds
    audios.common.pause(); audios.uncommon.pause();
    audios.rare.pause(); audios.legendary.pause();
    audios.godly.pause(); audios.unknown.pause();
    Object.values(audios).forEach(a=>a.currentTime = 0);

    audios[rarity].play();
    if (['rare','legendary','godly','unknown'].includes(rarity)) {
      audios.background.play();
    }

    // show
    gameScreen.style.display   = 'none';
    resultScreen.style.display = 'flex';
  }

  // --- Event handlers ---
  // loading animation → main
  (function startLoading(){
    loadingBar.style.width = '0%';
    loadingScreen.style.display = 'flex';
    let pct = 0;
    const iv = setInterval(()=>{
      pct += 2;
      loadingBar.style.width = pct + '%';
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(()=>{
          loadingScreen.style.display = 'none';
          mainScreen.style.display    = 'flex';
        }, 300);
      }
    }, 20);
  })();

  // “Go” → init zones & show game
  goButton.addEventListener('click', () => {
    mainScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    initZones();
    if (devMode) drawDev();
  });

  // click on canvas → RNG
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rarity = detectRarity(x,y);
    showResult(rarity);
  });

  // back to home
  backButton.addEventListener('click', () => {
    resultScreen.style.display = 'none';
    resultScreen.style.animation = '';
    audios.background.pause();
    gameScreen.style.display = 'none';
    mainScreen.style.display = 'flex';
  });

  // dev‐mode toggle: key sequence “d e v m”
  let keyBuf = '';
  window.addEventListener('keydown', e => {
    keyBuf += e.key.toLowerCase();
    if (keyBuf.endsWith('devm')) {
      devMode = !devMode;
      if (gameScreen.style.display === 'block' && devMode) drawDev();
      else clearDev();
      keyBuf = '';
    }
    if (keyBuf.length > 10) keyBuf = keyBuf.slice(-10);
  });
});
