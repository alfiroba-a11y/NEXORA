const bw$ = selector => document.querySelector(selector);
document.head.insertAdjacentHTML('beforeend','<style>.wallet-panel .stored-funds{margin:0 0 12px;color:#9fc0e9;font:10px Manrope;line-height:1.5}</style>');
let walletMode = localStorage.getItem('nexora_binary_mode') || 'demo';
if (walletMode === 'practice') walletMode = 'real';
let demoFunds = Number(localStorage.getItem('nexora_demo_balance') || 10000);
let realFunds = 0;
let derivSummary = null;

function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('nexora_token')}` }; }
async function syncDemo(action, amount = 0) {
  if (!localStorage.getItem('nexora_token')) return;
  try {
    const response = await fetch('/api/demo/balance', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ action, amount }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not sync Demo balance.');
    demoFunds = Number(data.balance); localStorage.setItem('nexora_demo_balance', demoFunds); updateWallet();
  } catch (error) { toast(error.message); }
}

if (walletMode === 'real' && !localStorage.getItem('nexora_token')) walletMode = 'demo';

const host = bw$('.headright');
host.insertAdjacentHTML('afterbegin', `
  <div class="account-switcher" aria-label="Account type">
    <button data-mode="demo">Demo</button><button data-mode="real">Real</button>
  </div>
  <div class="account-balance" aria-label="Available balance"><b id="walletBalance">$10,000.00</b></div>
  <button class="wallet-launch" id="walletLaunch">Wallet</button><button class="profile-launch" id="profileLaunch" aria-label="Profile" hidden></button>`);

document.body.insertAdjacentHTML('beforeend', `
  <section class="wallet-panel" id="walletPanel">
    <h3>NEXORA Wallet</h3><p id="walletAccountName">Demo account</p>
    <div class="wallet-balance" id="walletPanelBalance">$10,000.00<small>Available to trade</small></div><p class="stored-funds" id="storedFunds"></p>
    <div class="wallet-actions"><button id="walletWithdraw">Withdraw</button><button class="fund" id="walletDeposit">Deposit</button></div>
    <button class="reset-demo" id="resetDemo">Refresh demo to $10,000</button>
    <p class="stored-funds" id="derivStatus">Connect your Deriv account to view its own balance.</p>
    <button class="account-settings" id="derivConnect">Connect Deriv account</button>
    <button class="account-settings" id="accountSettings">Account settings</button>
  </section>`);

function format(amount) {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateWallet() {
  const real = derivSummary?.accounts?.find(account => String(account.account_type || account.type || '').toLowerCase() === 'real');
  const connectedBalance = Number(real?.balance ?? real?.currency?.balance ?? 0);
  const balance = walletMode === 'demo' ? demoFunds : connectedBalance;
  bw$('#walletBalance').textContent = format(balance);
  bw$('#walletPanelBalance').innerHTML = `${format(balance)}<small>Available to trade</small>`;
  const accountBadge = document.querySelector('.account span');
  if (accountBadge) accountBadge.innerHTML = `${walletMode === 'demo' ? 'Demo' : 'Real'}<br><b>${format(balance)}</b>`;
  bw$('#walletAccountName').textContent = walletMode === 'demo' ? 'Demo account · virtual funds' : (derivSummary?.connected ? 'Connected Deriv real account' : 'Connect your Deriv real account');
  bw$('#storedFunds').textContent = realFunds > 0 ? `NEXORA deposit balance: ${format(realFunds)} · available for withdrawal` : 'NEXORA deposits and Deriv trading balances are separate.';
  const derivStatus = bw$('#derivStatus');
  if (derivSummary?.connected) {
    const real = derivSummary.accounts.find(account => String(account.account_type || account.type || '').toLowerCase() === 'real');
    const balance = Number(real?.balance ?? real?.currency?.balance);
    derivStatus.textContent = Number.isFinite(balance) ? `Deriv real-account balance: ${format(balance)} ${real?.currency || 'USD'}` : 'Deriv account connected. Select your Deriv account to trade with its own balance.';
  } else derivStatus.textContent = 'Connect your Deriv account to view its own balance.';
  document.querySelectorAll('.account-switcher button').forEach(button => button.classList.toggle('active', button.dataset.mode === walletMode));
  bw$('#resetDemo').style.display = walletMode === 'demo' ? 'block' : 'none';
  bw$('#resetDemo').textContent = 'Refresh demo to $10,000';
  bw$('#accountSettings').style.display = localStorage.getItem('nexora_token') ? 'block' : 'none';
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

async function refreshDerivConnection() {
  if (!localStorage.getItem('nexora_token')) return;
  try {
    const response = await fetch('/api/deriv/connection', { headers: { Authorization: `Bearer ${localStorage.getItem('nexora_token')}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load Deriv connection.');
    derivSummary = data; updateWallet();
  } catch (error) { derivSummary = null; updateWallet(); }
}

async function connectDeriv() {
  if (!localStorage.getItem('nexora_token')) { toast('Sign in before connecting your Deriv account.'); location.href = 'index.html'; return; }
  try {
    const response = await fetch('/api/deriv/connect', { headers: { Authorization: `Bearer ${localStorage.getItem('nexora_token')}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not start Deriv connection.');
    location.assign(data.authorizationUrl);
  } catch (error) { toast(error.message); }
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
  refreshRealBalance();
  toast(mode === 'demo' ? 'Demo account selected.' : (derivSummary?.connected ? 'Deriv real account selected.' : 'Connect your Deriv account to use Real trading.'));
}

document.querySelectorAll('.account-switcher button').forEach(button => button.onclick = () => choose(button.dataset.mode));
bw$('#walletLaunch').onclick = () => bw$('#walletPanel').classList.toggle('open');
bw$('#walletBalance').onclick = () => bw$('#walletPanel').classList.toggle('open');
bw$('#profileLaunch').onclick = () => { sessionStorage.setItem('nexora_internal_navigation', 'settings'); location.href = 'settings.html'; };
bw$('#binAccount').onclick = () => { sessionStorage.setItem('nexora_internal_navigation', 'settings'); location.href = 'settings.html'; };
bw$('#resetDemo').onclick = () => {
  if (walletMode === 'demo') { demoFunds = 10000; localStorage.setItem('nexora_demo_balance', demoFunds); syncDemo('reset'); }
  updateWallet();
  toast('Demo balance refreshed.');
};
bw$('#walletDeposit').onclick = () => { bw$('#walletPanel').classList.remove('open'); bw$('#binDeposit').click(); };
bw$('#walletWithdraw').onclick = () => { bw$('#walletPanel').classList.remove('open'); bw$('#binWithdraw').click(); };
bw$('#accountSettings').onclick = () => { sessionStorage.setItem('nexora_internal_navigation', 'settings'); location.href = 'settings.html'; };
bw$('#derivConnect').onclick = connectDeriv;

async function openAccountSettings() {
  if (!signed()) return choose('real');
  try {
    const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token()}` } });
    const profile = await response.json();
    if (!response.ok) throw new Error(profile.error || 'Could not open account settings.');
    bw$('#walletPanel').classList.remove('open');
    bw$('#modalTitle').textContent = 'Account settings';
    bw$('#modalText').innerHTML = `<label>Name<input id="profileName" value="${profile.display_name || ''}" placeholder="Your name"></label><label>Email<input id="profileEmail" type="email" value="${profile.email || ''}"></label><label>Withdrawal method<select id="profileMethod"><option value="mpesa">M-Pesa</option><option value="trc20">USDT TRC20</option></select></label><label>Withdrawal destination<input id="profileDestination" value="${profile.withdrawal_destination || ''}" placeholder="M-Pesa number or TRC20 address"></label><button class="auth-toggle" id="profileDeriv">Connect Deriv account</button><button class="auth-toggle" id="profileTheme">${document.body.classList.contains('light-theme') ? 'Use dark mode' : 'Use light mode'}</button><button class="auth-toggle" id="profileSignOut">Sign out</button><button class="delete-account" id="profileDelete">Delete account</button>`;
    bw$('#profileMethod').value = profile.withdrawal_method || 'mpesa';
    bw$('#modalAction').textContent = 'Save changes';
    bw$('#modalAction').onclick = () => saveAccountSettings();
    bw$('#profileTheme').onclick = toggleTheme;
    bw$('#profileDeriv').onclick = connectDeriv;
    bw$('#profileSignOut').onclick = signOut;
    bw$('#profileDelete').onclick = deleteAccount;
    show();
  } catch (error) { toast(error.message); }
}

async function saveAccountSettings() {
  try {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
    const profileResponse = await fetch('/api/profile', { method: 'PATCH', headers, body: JSON.stringify({ displayName: bw$('#profileName').value, email: bw$('#profileEmail').value }) });
    const profileData = await profileResponse.json();
    if (!profileResponse.ok) throw new Error(profileData.error || 'Could not save profile.');
    const walletResponse = await fetch('/api/profile/withdrawal-destination', { method: 'PATCH', headers: { ...headers, Authorization: `Bearer ${profileData.token}` }, body: JSON.stringify({ method: bw$('#profileMethod').value, destination: bw$('#profileDestination').value }) });
    const walletData = await walletResponse.json();
    if (!walletResponse.ok) throw new Error(walletData.error || 'Could not save withdrawal destination.');
    localStorage.setItem('nexora_token', profileData.token);
    localStorage.setItem('nexora_user', JSON.stringify(profileData.user));
    const accountLabel = document.querySelector('.account span');
    if (accountLabel) accountLabel.innerHTML = `${profileData.user.email.split('@')[0]}<br><b>Signed in</b>`;
    close(); toast('Account settings saved.');
  } catch (error) { toast(error.message); }
}

function signOut() {
  localStorage.removeItem('nexora_token'); localStorage.removeItem('nexora_user'); localStorage.removeItem('nexora_pending_account_mode');
  walletMode = 'demo'; localStorage.setItem('nexora_binary_mode', 'demo');
  location.replace('index.html');
}

async function deleteAccount() {
  const password = window.prompt('Enter your password to permanently delete this account.');
  if (!password) return;
  try {
    const response = await fetch('/api/profile', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ password }) });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Could not delete account.'); }
    signOut(); toast('Your account has been deleted.');
  } catch (error) { toast(error.message); }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('nexora_theme', isLight ? 'light' : 'dark');
  const button = bw$('#profileTheme'); if (button) button.textContent = isLight ? 'Use dark mode' : 'Use light mode';
}

document.querySelector('.theme').onclick = toggleTheme;
if (localStorage.getItem('nexora_theme') === 'light') document.body.classList.add('light-theme');

document.addEventListener('nexora:auth-changed', () => {
  if (localStorage.getItem('nexora_pending_account_mode') === 'real') {
    localStorage.removeItem('nexora_pending_account_mode');
    choose('real');
  }
});
document.addEventListener('nexora:wallet-changed', refreshRealBalance);

window.nexoraBinaryWallet = {
  get mode() { return walletMode; },
  get balance() { const account=derivSummary?.accounts?.find(item=>String(item.account_type||item.type||'').toLowerCase()==='real'); return walletMode === 'demo' ? demoFunds : Number(account?.balance ?? account?.currency?.balance ?? 0); },
  debit(amount) {
    if (walletMode === 'demo') { demoFunds = Math.max(0, demoFunds - amount); localStorage.setItem('nexora_demo_balance', demoFunds); syncDemo('debit', amount); }
    else { toast('Real trades are sent to Deriv and never change a local balance.'); return false; }
    updateWallet();
  },
  credit(amount) {
    if (walletMode === 'demo') { demoFunds += amount; localStorage.setItem('nexora_demo_balance', demoFunds); syncDemo('credit', amount); }
    else { toast('Real trade results are supplied by Deriv.'); return false; }
    updateWallet();
  }
};

updateWallet();
refreshRealBalance();
refreshDerivConnection();
const derivOutcome = new URLSearchParams(location.search).get('deriv');
if (derivOutcome) { history.replaceState({}, '', location.pathname); window.setTimeout(() => { toast(derivOutcome === 'connected' ? 'Deriv account connected securely.' : 'Deriv connection was not completed.'); refreshDerivConnection(); }, 250); }
async function loadWorkspace() {
  if (!localStorage.getItem('nexora_token')) return;
  try {
    const response = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${localStorage.getItem('nexora_token')}` } });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not sync account.');
    demoFunds = Number(data.accounts.find(account => account.kind === 'demo')?.balance || 10000);
    realFunds = Number(data.accounts.find(account => account.kind === 'real')?.balance || 0);
    localStorage.setItem('nexora_demo_balance', demoFunds); localStorage.setItem('nexora_workspace_activity', JSON.stringify(data.activity || [])); localStorage.setItem('nexora_workspace_preferences', JSON.stringify(data.preferences || {})); updateWallet();
    document.dispatchEvent(new CustomEvent('nexora:workspace-loaded', { detail: data }));
  } catch (error) { toast(error.message); }
}
loadWorkspace();
window.setInterval(() => {
  if (localStorage.getItem('nexora_pending_account_mode') === 'real' && localStorage.getItem('nexora_token')) {
    localStorage.removeItem('nexora_pending_account_mode');
    choose('real');
  }
}, 400);
