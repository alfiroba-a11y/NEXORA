const bt$ = selector => document.querySelector(selector);
let openPositions = [];

document.querySelector('.choices').insertAdjacentHTML('beforebegin', '<section class="active-contract" id="activeContract" aria-live="polite"><div><small>ACTIVE CONTRACT</small><b id="activeTitle">No active contracts</b><span id="activeMeta">Place an Even or Odd Demo trade to track it here.</span></div><button id="stopContract" disabled>Stop</button></section>');

function renderActive() {
  const position = openPositions[0];
  const title = bt$('#activeTitle'), meta = bt$('#activeMeta'), stop = bt$('#stopContract');
  if (!position) {
    title.textContent = 'No active contracts';
    meta.textContent = 'Place an Even or Odd Demo trade to track it here.';
    stop.disabled = true;
    return;
  }
  const seconds = Math.max(0, Math.ceil((position.endsAt - Date.now()) / 1000));
  title.textContent = `${position.type} · $${position.stake.toFixed(2)}`;
  meta.textContent = `Running · settles in ${seconds}s · potential payout $${(position.stake * 1.952).toFixed(2)}`;
  stop.disabled = false;
}

function showPositions() {
  bt$('#modalTitle').textContent = 'Positions';
  bt$('#modalText').innerHTML = openPositions.length ? openPositions.map(position => `<p><b>${position.type}</b> · $${position.stake.toFixed(2)}<br><small>Running · ${Math.max(0, Math.ceil((position.endsAt - Date.now()) / 1000))} seconds remaining</small></p>`).join('') : '<p>No active Demo contracts.</p>';
  bt$('#modalAction').textContent = 'Close';
  bt$('#modalAction').onclick = () => bt$('.x').click();
  bt$('#shade').classList.add('open'); bt$('#binModal').classList.add('open');
}

function settle(position) {
  if (!openPositions.includes(position)) return;
  const won = Math.random() > .48;
  openPositions = openPositions.filter(item => item !== position);
  if (won) {
    window.nexoraBinaryWallet.credit(position.stake * 1.952);
    toast(`${position.type} Demo contract won. Profit credited.`);
  } else toast(`${position.type} Demo contract lost.`);
  renderActive();
}

function stopContract() {
  const position = openPositions[0];
  if (!position) return;
  clearTimeout(position.timer);
  openPositions = openPositions.filter(item => item !== position);
  const cashout = Number((position.stake * .85).toFixed(2));
  window.nexoraBinaryWallet.credit(cashout);
  toast(`Demo contract stopped. $${cashout.toFixed(2)} returned.`);
  renderActive();
}

function trade(type) {
  const stake = Number(bt$('#stake').textContent), wallet = window.nexoraBinaryWallet;
  if (!wallet) return toast('Wallet is loading.');
  if (wallet.mode === 'real') return toast('Real Binary execution needs your licensed provider connection.');
  const current = Number(localStorage.getItem('nexora_demo_balance') || 10000);
  if (stake > current) return toast('Demo balance is insufficient. Refresh Demo in Wallet.');
  wallet.debit(stake);
  const position = { type, stake, endsAt: Date.now() + 12000 };
  position.timer = setTimeout(() => settle(position), 12000);
  openPositions.push(position);
  renderActive();
  toast(`${type} Demo contract opened for $${stake.toFixed(2)}.`);
}

bt$('#even').onclick = () => trade('Even');
bt$('#odd').onclick = () => trade('Odd');
bt$('#stopContract').onclick = stopContract;
document.querySelector('#bottomPositions').onclick = showPositions;
document.querySelector('#bottomAi').onclick = () => {
  const markets = ['Volatility 10 (1s)', 'Volatility 25 (1s)', 'Volatility 50 (1s)', 'Volatility 75 (1s)', 'Volatility 100 (1s)'].map(name => ({ name, score: (4 + Math.random() * 5.8).toFixed(1) })).sort((a, b) => b.score - a.score);
  bt$('#modalTitle').textContent = 'NEXORA AI market activity';
  bt$('#modalText').innerHTML = `<p><b>${markets[0].name}</b> has the highest current activity score: ${markets[0].score}/10.</p><p class="housika-note">Activity is not a prediction and is not investment advice. Manage your stake and controls manually.</p>`;
  bt$('#modalAction').textContent = 'Select market';
  bt$('#modalAction').onclick = () => { bt$('#instrumentName').textContent = markets[0].name; bt$('.x').click(); toast('Market selected.'); };
  bt$('#shade').classList.add('open'); bt$('#binModal').classList.add('open');
};

renderActive();
setInterval(renderActive, 500);
