try { if (JSON.parse(atob(localStorage.getItem('nexora_token').split('.')[1])).exp * 1000 <= Date.now()) throw new Error('expired'); } catch { localStorage.removeItem('nexora_token'); localStorage.removeItem('nexora_user'); location.replace('index.html'); }
const q = s => document.querySelector(s);
const qa = s => [...document.querySelectorAll(s)];
let stake = 10, zoom = 1;
let points = Array.from({ length: 120 }, (_, i) => 500 + Math.sin(i / 7) * 70 + (Math.random() - .5) * 75);
let digits = Array.from({ length: 10 }, (_, n) => ({ n, p: 5 + Math.random() * 7 }));

q('#marketList').innerHTML = ['Volatility 10 (1s)','Volatility 25 (1s)','Volatility 50 (1s)','Volatility 75 (1s)','Volatility 100 (1s)','Crash 500','Boom 500'].map(x => `<button>${x}</button>`).join('');
q('#marketToggle').onclick = () => q('#marketList').classList.toggle('open');
qa('#marketList button').forEach(b => b.onclick = () => { q('#instrumentName').textContent = b.textContent; q('#marketList').classList.remove('open'); toast(`${b.textContent} selected`); });

function draw() {
  const canvas = q('#line'), box = canvas.getBoundingClientRect(), dpr = devicePixelRatio;
  canvas.width = box.width * dpr; canvas.height = box.height * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, box.width, box.height);
  ctx.strokeStyle = '#202a3b'; ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(0, i * box.height / 7); ctx.lineTo(box.width, i * box.height / 7); ctx.stroke(); }
  ctx.strokeStyle = '#dfe6f2'; ctx.lineWidth = 2; ctx.beginPath();
  points.forEach((p, i) => { const x = i * box.width / (points.length - 1), y = box.height * .66 - (p - 500) * zoom; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
}
function renderDigits(hit) {
  q('#digitList').innerHTML = digits.map(d => `<div class="digit ${d.p > 10 ? 'green' : 'red'}" data-n="${d.n}">${d.n}<small>${d.p.toFixed(2)}%</small></div>`).join('');
  const active = q(`[data-n="${hit}"]`), host = q('#digitList'), a = active.getBoundingClientRect(), h = host.getBoundingClientRect();
  q('#digitArrow').style.left = `${a.left - h.left + a.width / 2 - 7}px`;
  q('#evenP').textContent = `${digits.filter(x => x.n % 2 === 0).reduce((sum, x) => sum + x.p, 0).toFixed(2)}%`;
  q('#oddP').textContent = `${digits.filter(x => x.n % 2).reduce((sum, x) => sum + x.p, 0).toFixed(2)}%`;
}
function tick() {
  const hit = Math.floor(Math.random() * 10);
  points.push(points.at(-1) + (Math.random() - .48) * 30); points = points.slice(-120);
  digits = digits.map(d => ({ n: d.n, p: Math.max(.2, Math.min(12, d.p + (Math.random() - .5) * 1.1)) }));
  q('#quoteLine').innerHTML = `${(9300 + points.at(-1) / 10).toFixed(2)} <i>${(Math.random() * 12).toFixed(2)}% ↑</i>`;
  draw(); renderDigits(hit);
}
function updateStake() {
  q('#stake').textContent = stake; q('#payout').innerHTML = `${(stake * 1.952).toFixed(2)} <small>USD</small>`;
  q('#evenPay').textContent = q('#oddPay').textContent = `${(stake * 1.952).toFixed(2)} USD`;
  qa('.quick button').forEach(b => b.classList.toggle('active', Number(b.textContent.slice(1)) === stake));
}
function toast(text) { q('#toast').textContent = text; q('#toast').classList.add('show'); clearTimeout(window.binaryToast); window.binaryToast = setTimeout(() => q('#toast').classList.remove('show'), 2200); }
function modal(title, text) { q('#modalTitle').textContent = title; q('#modalText').textContent = text; q('#shade').classList.add('open'); q('#binModal').classList.add('open'); }

q('#minus').onclick = () => { stake = Math.max(1, stake - 1); updateStake(); };
q('#plus').onclick = () => { stake = Math.min(10000, stake + 1); updateStake(); };
qa('.quick button').forEach(b => b.onclick = () => { stake = Number(b.textContent.slice(1)); updateStake(); });
qa('.contract-tabs button,.mode button').forEach(b => b.onclick = () => { b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('active')); b.classList.add('active'); });
q('#zoomIn').onclick = () => { zoom = Math.min(2, zoom + .15); draw(); }; q('#zoomOut').onclick = () => { zoom = Math.max(.35, zoom - .15); draw(); }; q('#zoomReset').onclick = () => { zoom = 1; draw(); };
qa('#binDeposit,#binDeposit2').forEach(b => b.onclick = () => modal('Housika Payments — Deposit', 'Sign in to fund your NEXORA Binary account. Payments are initialized and verified server-side through Housika Payments.'));
q('#binWithdraw').onclick = () => modal('Withdrawals pending approval', 'Withdrawals are currently disabled until the NEXORA operator enables approval. Your balance remains protected.'); q('#binAccount').onclick = () => modal('Account access', 'Sign in or create an account to access Real Binary trading.');
q('.x').onclick = () => { q('#shade').classList.remove('open'); q('#binModal').classList.remove('open'); };
q('#chatBtn').onclick = () => toast('Secure support chat will open after sign in.'); q('#historyBtn').onclick = () => toast('Your transaction history is empty.'); q('#even').onclick = () => toast(`Even contract selected · stake $${stake}`); q('#odd').onclick = () => toast(`Odd contract selected · stake $${stake}`);
window.addEventListener('resize', draw); draw(); tick(); setInterval(tick, 1000);
const binaryStyle = document.createElement('link'); binaryStyle.rel = 'stylesheet'; binaryStyle.href = 'binary-enhancements.css'; document.head.append(binaryStyle);
const binaryEnhancements = document.createElement('script'); binaryEnhancements.async=false; binaryEnhancements.src = 'binary-enhancements.js'; document.body.append(binaryEnhancements);
const housika = document.createElement('script'); housika.async=false; housika.src = 'binary-housika.js'; document.body.append(housika);
const mobileTradeStyle = document.createElement('link'); mobileTradeStyle.rel = 'stylesheet'; mobileTradeStyle.href = 'binary-mobile-trade.css'; document.head.append(mobileTradeStyle);
const binaryTrading = document.createElement('script'); binaryTrading.async=false; binaryTrading.src = 'binary-trading.js'; document.body.append(binaryTrading);
const binaryRisk = document.createElement('script'); binaryRisk.async=false; binaryRisk.src = 'binary-risk.js'; document.body.append(binaryRisk);
const walletStyle = document.createElement('link'); walletStyle.rel='stylesheet'; walletStyle.href='binary-wallet.css'; document.head.append(walletStyle);
const walletApp = document.createElement('script'); walletApp.async=false; walletApp.src='binary-wallet.js'; document.body.append(walletApp);
