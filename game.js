/* Core state */
const defaultState = {
  money: 0,
  perClick: 1,
  upgrades: { strongerPeck: 0 },
  prices: { strongerPeck: 10 }
};
let s = load() || structuredClone(defaultState);

/* Elements */
const moneyEl = document.getElementById('money');
const perClickEl = document.getElementById('perClick');
const chickenBtn = document.getElementById('chickenBtn');
const buySP = document.getElementById('buyStrongerPeck');
const spCostEl = document.getElementById('spCost');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const clickSfx = document.getElementById('clickSfx');

/* Helpers */
function render() {
  moneyEl.textContent = s.money.toLocaleString();
  perClickEl.textContent = s.perClick;
  spCostEl.textContent = s.prices.strongerPeck;
  buySP.disabled = s.money < s.prices.strongerPeck;
}
function addMoney(n) { s.money += n; render(); }
function save() { localStorage.setItem('chickenClicker', JSON.stringify(s)); }
function load() {
  try { return JSON.parse(localStorage.getItem('chickenClicker')); }
  catch { return null; }
}
function buyUpgrade(key) {
  const cost = s.prices[key];
  if (s.money < cost) return;
  s.money -= cost;
  s.upgrades[key] += 1;
  // effect & price scaling
  if (key === 'strongerPeck') {
    s.perClick += 1;                // +1 per purchase
    s.prices.strongerPeck = Math.ceil(cost * 1.35); // gentle scale
  }
  render(); save();
}

/* Events */
chickenBtn.addEventListener('click', () => {
  addMoney(s.perClick);
  if (clickSfx) { clickSfx.currentTime = 0; clickSfx.play().catch(()=>{}); }
  chickenBtn.classList.add('peck');
  setTimeout(()=>chickenBtn.classList.remove('peck'), 70);
});
chickenBtn.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); chickenBtn.click(); }
});
buySP.addEventListener('click', () => buyUpgrade('strongerPeck'));
saveBtn.addEventListener('click', save);
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset progress?')) return;
  s = structuredClone(defaultState); save(); render();
});

/* Autosave */
setInterval(save, 5000);

/* Init */
render();