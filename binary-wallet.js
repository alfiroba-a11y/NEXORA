const bw$ = selector => document.querySelector(selector);
let walletMode = localStorage.getItem('nexora_binary_mode') || 'demo';
let demoFunds = Number(localStorage.getItem('nexora_demo_balance') || 10000);
let realFunds = 0;

if (walletMode === 'real' && !localStorage.getItem('nexora_token')) walletMode = 'demo';

const host = bw$('.headright');
host.insertAdjacentHTML('afterbegin', `
  <div class="account-switcher" aria-label="Account type">
    <button data-mode="demo">Demo</button><button data-mode="real">Real</button>
  </div>
  <div class="account-balance" aria-label="Available balance"><b id="walletBalance">$10,000.00</b></div>
  <button class="wallet-launch" id="walletLaunch">Wallet</button>`);

document.body.insertAdjacentHTML('beforeend', `
  <section class="wallet-panel" id="walletPanel">
    <h3>Housika Payments</h3><p id="walletAccountName">Demo account</p>
    <div class="wallet-balance" id="walletPanelBalance">$10,000.00<small>Available to trade</small></div>
    <div class="wallet-actions"><button id="walletWithdraw">Withdraw</button><button class="fund" id="walletDeposit">Deposit</button></div>
    <button class="reset-demo" id="resetDemo">Refresh demo to $10,000</button>
  </section>`);

function format(amount) {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateWallet() {
  const balance = walletMode === 'demo' ? demoFunds : realFunds;
  bw$('#walletBalance').textContent = format(balance);
  bw$('#walletPanelBalance').innerHTML = `${format(balance)}<small>Available to trade</small>`;
  bw$('#walletAccountName').textContent = walletMode === 'demo' ? 'Demo account · virtual funds' : 'Real account · Housika Payments';
  document.querySelectorAll('.account-switcher button').forEach(button => button.classList.toggle('active', button.dataset.mode === walletMode));
  bw$('#resetDemo').style.display = walletMode === 'demo' ? 'block' : 'none';
}

async function refreshRealBalance() {
  if (!localStorage.getItem('nexora_token')) return;
  try {
    const response = await fetch('/api/accounts', { headers: { Authorization: `Bearer ${localStorage.getItem('nexora_token')}` } });
    const accounts = await response.json();
    if (!response.ok) throw new Error(accounts.error || 'Could not load balance.');
    realFunds = Number(accounts.find(account => account.kind === 'real')?.balance || 0);
    if (walletMode === 'real') updateWallet();
  } catch (error) {
    if (walletMode === 'real') toast(error.message);
  }
}

function choose(mode) {
  if (mode === 'real' && !localStorage.getItem('nexora_token')) {
    localStorage.setItem('nexora_pending_account_mode', 'real');
    bw$('#binAccount').click();
    return;
  }
  walletMode = mode;
  localStorage.setItem('nexora_binary_mode', mode);
  updateWallet();
  if (mode === 'real') refreshRealBalance();
  toast(`${mode === 'demo' ? 'Demo' : 'Real'} account selected.`);
}

document.querySelectorAll('.account-switcher button').forEach(button => button.onclick = () => choose(button.dataset.mode));
bw$('#walletLaunch').onclick = () => bw$('#walletPanel').classList.toggle('open');
bw$('#resetDemo').onclick = () => {
  demoFunds = 10000;
  localStorage.setItem('nexora_demo_balance', demoFunds);
  updateWallet();
  toast('Demo balance refreshed.');
};
bw$('#walletDeposit').onclick = () => { bw$('#walletPanel').classList.remove('open'); bw$('#binDeposit').click(); };
bw$('#walletWithdraw').onclick = () => { bw$('#walletPanel').classList.remove('open'); bw$('#binWithdraw').click(); };

document.addEventListener('nexora:auth-changed', () => {
  if (localStorage.getItem('nexora_pending_account_mode') === 'real') {
    localStorage.removeItem('nexora_pending_account_mode');
    choose('real');
  }
});
document.addEventListener('nexora:wallet-changed', refreshRealBalance);

window.nexoraBinaryWallet = {
  get mode() { return walletMode; },
  debit(amount) {
    if (walletMode !== 'demo') return;
    demoFunds = Math.max(0, demoFunds - amount);
    localStorage.setItem('nexora_demo_balance', demoFunds);
    updateWallet();
  },
  credit(amount) {
    if (walletMode !== 'demo') return;
    demoFunds += amount;
    localStorage.setItem('nexora_demo_balance', demoFunds);
    updateWallet();
  }
};

updateWallet();
if (walletMode === 'real') refreshRealBalance();
window.setInterval(() => {
  if (localStorage.getItem('nexora_pending_account_mode') === 'real' && localStorage.getItem('nexora_token')) {
    localStorage.removeItem('nexora_pending_account_mode');
    choose('real');
  }
}, 400);
