const bt$ = selector => document.querySelector(selector);
let openPositions = [];
const choiceTemplates = Object.fromEntries(['even','odd'].map(id => [id, bt$(`#${id}`).innerHTML]));

function restoreChoices() {
  ['even','odd'].forEach(id => {
    const button = bt$(`#${id}`);
    button.classList.remove('contract-running', 'contract-even', 'contract-odd');
    button.innerHTML = choiceTemplates[id];
  });
}

function renderActive() {
  restoreChoices();
  const position = openPositions[0];
  if (!position) return;
  const id = position.type.toLowerCase();
  const button = bt$(`#${id}`);
  const seconds = Math.max(0, Math.ceil((position.endsAt - Date.now()) / 1000));
  button.classList.add('contract-running', `contract-${id}`);
  button.innerHTML = `<span class="running-dot"></span><b>Stop ${position.type}</b><em>${seconds}s remaining</em><small>Tap to cash out</small>`;
}

function settle(position) {
  if (!openPositions.includes(position)) return;
  const won = Math.random() > .48;
  openPositions = openPositions.filter(item => item !== position);
  if (won) {
    window.nexoraBinaryWallet.credit(position.stake * 1.952);
    toast(`${position.type} Demo contract won. Profit credited.`);
  } else toast(`${position.type} Demo contract lost.`);
  document.dispatchEvent(new CustomEvent('nexora:contract-outcome', { detail: { won, type: position.type, stake: position.stake } }));
  renderActive();
}

function stopContract(position) {
  clearTimeout(position.timer);
  openPositions = openPositions.filter(item => item !== position);
  const cashout = Number((position.stake * .85).toFixed(2));
  window.nexoraBinaryWallet.credit(cashout);
  toast(`${position.type} Demo contract stopped. $${cashout.toFixed(2)} returned.`);
  document.dispatchEvent(new CustomEvent('nexora:contract-outcome', { detail: { won: true, type: position.type, stake: cashout, stopped: true } }));
  renderActive();
}

function trade(type) {
  const running = openPositions[0];
  if (running) {
    if (running.type === type) return stopContract(running);
    return toast(`Stop the active ${running.type} contract before opening ${type}.`);
  }
  const stake = Number(bt$('#stake').value), wallet = window.nexoraBinaryWallet;
  if (!wallet) return toast('Wallet is loading.');
  if (!Number.isFinite(stake) || stake < 1) return toast('Minimum stake is $1.');
  if (wallet.mode === 'real') return wallet.balance < stake ? toast('Insufficient balance to trade. Deposit funds to your Real account.') : toast('Real Binary execution needs your licensed provider connection.');
  const current = Number(localStorage.getItem('nexora_demo_balance') || 10000);
  const dailyLimit = Number(localStorage.getItem('nexora_daily_limit') || 0), stakedToday = Number(localStorage.getItem('nexora_daily_staked') || 0);
  if (dailyLimit && stakedToday + stake > dailyLimit) return toast(`Daily Demo stake limit is $${dailyLimit.toFixed(2)}.`);
  if (stake > current) return toast('Demo balance is insufficient. Refresh Demo in Wallet.');
  wallet.debit(stake); localStorage.setItem('nexora_daily_staked', String(stakedToday + stake));
  const position = { id: crypto.randomUUID(), type, stake, endsAt: Date.now() + 12000 };
  position.timer = setTimeout(() => settle(position), 12000);
  openPositions = [position]; renderActive();
  toast(`${type} Demo contract opened for $${stake.toFixed(2)}.`);
}

bt$('#even').onclick = () => trade('Even');
bt$('#odd').onclick = () => trade('Odd');
const positionsButton = document.querySelector('#bottomPositions'); if (positionsButton) positionsButton.onclick = () => {
  const position = openPositions[0];
  bt$('#modalTitle').textContent = 'Positions';
  bt$('#modalText').innerHTML = position ? `<p><b>${position.type}</b> · $${position.stake.toFixed(2)}<br><small>Running · ${Math.max(0, Math.ceil((position.endsAt - Date.now()) / 1000))} seconds remaining</small></p>` : '<p>No active Demo contracts.</p>';
  bt$('#modalAction').textContent = 'Close'; bt$('#modalAction').onclick = () => bt$('.x').click();
  bt$('#shade').classList.add('open'); bt$('#binModal').classList.add('open');
};
setInterval(renderActive, 250);
