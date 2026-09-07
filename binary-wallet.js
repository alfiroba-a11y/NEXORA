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
  <button class="wallet-launch" id="walletLaunch">Wallet</button><button class="profile-launch" id="profileLaunch" aria-label="Profile" hidden></button>`);

document.body.insertAdjacentHTML('beforeend', `
  <section class="wallet-panel" id="walletPanel">
    <h3>NEXORA Payments</h3><p id="walletAccountName">Demo account</p>
    <div class="wallet-balance" id="walletPanelBalance">$10,000.00<small>Available to trade</small></div>
    <div class="wallet-actions"><button id="walletWithdraw">Withdraw</button><button class="fund" id="walletDeposit">Deposit</button></div>
    <button class="reset-demo" id="resetDemo">Refresh demo to $10,000</button>
    <button class="account-settings" id="accountSettings">Account settings</button>
  </section>`);

function format(amount) {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateWallet() {
  const balance = walletMode === 'demo' ? demoFunds : realFunds;
  bw$('#walletBalance').textContent = format(balance);
  bw$('#walletPanelBalance').innerHTML = `${format(balance)}<small>Available to trade</small>`;
  bw$('#walletAccountName').textContent = walletMode === 'demo' ? 'Demo account · virtual funds' : 'Real account · NEXORA Payments';
  document.querySelectorAll('.account-switcher button').forEach(button => button.classList.toggle('active', button.dataset.mode === walletMode));
  bw$('#resetDemo').style.display = walletMode === 'demo' ? 'block' : 'none';
  bw$('#accountSettings').style.display = walletMode === 'real' ? 'block' : 'none';
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
bw$('#profileLaunch').onclick = openAccountSettings;
bw$('#binAccount').onclick = () => signed() ? openAccountSettings() : choose('real');
bw$('#resetDemo').onclick = () => {
  demoFunds = 10000;
  localStorage.setItem('nexora_demo_balance', demoFunds);
  updateWallet();
  toast('Demo balance refreshed.');
};
bw$('#walletDeposit').onclick = () => { bw$('#walletPanel').classList.remove('open'); bw$('#binDeposit').click(); };
bw$('#walletWithdraw').onclick = () => { bw$('#walletPanel').classList.remove('open'); bw$('#binWithdraw').click(); };
bw$('#accountSettings').onclick = openAccountSettings;

async function openAccountSettings() {
  if (!signed()) return choose('real');
  try {
    const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token()}` } });
    const profile = await response.json();
    if (!response.ok) throw new Error(profile.error || 'Could not open account settings.');
    bw$('#walletPanel').classList.remove('open');
    bw$('#modalTitle').textContent = 'Account settings';
    bw$('#modalText').innerHTML = `<label>Name<input id="profileName" value="${profile.display_name || ''}" placeholder="Your name"></label><label>Email<input id="profileEmail" type="email" value="${profile.email || ''}"></label><label>Withdrawal method<select id="profileMethod"><option value="mpesa">M-Pesa</option><option value="trc20">USDT TRC20</option></select></label><label>Withdrawal destination<input id="profileDestination" value="${profile.withdrawal_destination || ''}" placeholder="M-Pesa number or TRC20 address"></label><button class="auth-toggle" id="profileTheme">${document.body.classList.contains('light-theme') ? 'Use dark mode' : 'Use light mode'}</button><button class="auth-toggle" id="profileSignOut">Sign out</button><button class="delete-account" id="profileDelete">Delete account</button>`;
    bw$('#profileMethod').value = profile.withdrawal_method || 'mpesa';
    bw$('#modalAction').textContent = 'Save changes';
    bw$('#modalAction').onclick = () => saveAccountSettings();
    bw$('#profileTheme').onclick = toggleTheme;
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
  walletMode = 'demo'; localStorage.setItem('nexora_binary_mode', 'demo'); updateWallet(); close(); toast('You have been signed out.');
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
