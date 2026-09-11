const h$ = selector => document.querySelector(selector);
document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="binary-housika.css"><style>.stk-progress{display:grid;justify-items:center;gap:8px;padding:7px 0;text-align:center}.stk-progress b{font:800 17px Manrope;color:#eef6ff}.stk-progress span{color:#b9c8de;font:12px Manrope}.stk-progress small{color:#5de0b4;font:700 10px Manrope;letter-spacing:.3px;animation:stkBlink 1.15s ease-in-out infinite}.stk-progress em{color:#8399ba;font:9px DM Mono;font-style:normal;word-break:break-all}.stk-radar{position:relative;width:64px;height:64px;border:2px solid #39d8ad;border-radius:50%;background:radial-gradient(circle,#42dcb744 0 7%,transparent 8%);overflow:hidden}.stk-radar:after{content:"";position:absolute;inset:0;background:conic-gradient(from 0deg,transparent 0 70%,#43ddb955 83%,transparent 100%);animation:stkSweep 1.45s linear infinite}.stk-radar i{position:absolute;border:1px solid #3bd8af55;border-radius:50%;inset:12px}.stk-radar i:nth-child(2){inset:23px}.stk-radar i:nth-child(3){inset:32px;background:#4be4bc}@keyframes stkSweep{to{transform:rotate(360deg)}}@keyframes stkBlink{50%{opacity:.4}}</style>');
h$('.flip')?.remove();

function signed() { return !!localStorage.getItem('nexora_token'); }
function token() { return localStorage.getItem('nexora_token'); }
function show() { h$('#shade').classList.add('open'); h$('#binModal').classList.add('open'); }
function close() { h$('.x').click(); }

function showAuth(mode = 'signin') {
  h$('#modalTitle').textContent = mode === 'signup' ? 'Create your NEXORA account' : 'Sign in to NEXORA';
  h$('#modalText').innerHTML = `<label>Email<input id="hEmail" type="email" placeholder="you@example.com"></label><label>Password<input id="hPassword" type="password" placeholder="At least 12 characters"></label><button class="auth-toggle" id="hToggle">${mode === 'signup' ? 'Already have an account? Sign in' : 'New to NEXORA? Create an account'}</button>`;
  h$('#modalAction').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  h$('#modalAction').onclick = async () => {
    try {
      const response = await fetch(`/api/auth/${mode === 'signup' ? 'signup' : 'signin'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: h$('#hEmail').value, password: h$('#hPassword').value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Account request failed');
      localStorage.setItem('nexora_token', data.token);
      localStorage.setItem('nexora_user', JSON.stringify(data.user));
      h$('.account span').innerHTML = `${data.user.email.split('@')[0]}<br><b>Signed in</b>`;
      document.dispatchEvent(new Event('nexora:auth-changed'));
      close();
      toast('Signed in to NEXORA Binary.');
    } catch (error) { toast(error.message); }
  };
  h$('#hToggle').onclick = () => showAuth(mode === 'signup' ? 'signin' : 'signup');
  show();
}

function checkHashPayDeposit(reference, headers, quiet = false) {
  fetch(`/api/deposits/hashpay/status?reference=${encodeURIComponent(reference)}`, { headers })
    .then(response => response.json().then(data => ({ ok: response.ok, data })))
    .then(result => {
      if (!result.ok) { if (!quiet) throw new Error(result.data.error || 'Payment status is unavailable.'); return; }
      if (result.data.status !== 'settled') { if (!quiet) toast('Waiting for M-Pesa approval.'); return; }
      close();
      localStorage.removeItem('nexora_pending_deposit_reference');
      document.dispatchEvent(new Event('nexora:wallet-changed'));
      toast(`Deposit confirmed. $${Number(result.data.balanceCredited).toFixed(2)} credited.`);
    }).catch(error => { if (!quiet) toast(error.message); });
}

function pollPendingDeposit() {
  const reference = localStorage.getItem('nexora_pending_deposit_reference');
  if (!reference || !signed()) return;
  const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
  const poller = window.setInterval(() => {
    if (!localStorage.getItem('nexora_pending_deposit_reference')) return window.clearInterval(poller);
    checkHashPayDeposit(reference, headers, true);
  }, 5000);
  window.setTimeout(() => window.clearInterval(poller), 180000);
}

function showDeposit() {
  if (!signed()) return showAuth();
  h$('#modalTitle').textContent = 'NEXORA Deposit';
  h$('#modalText').innerHTML = '<label>Deposit method<select id="hMethod"><option value="mpesa">M-Pesa</option></select></label><label>M-Pesa number<input id="hPhone" type="tel" inputmode="tel" placeholder="07…, 01…, +254…, or 254…"></label><label>Amount (KSh)<input id="hAmount" type="number" min="650" value="650"></label><p class="housika-note">Minimum deposit: $5 (KSh 650).</p>';
  h$('#modalAction').textContent = 'Deposit';
  h$('#modalAction').onclick = async () => {
    const amountKes = Number(h$('#hAmount').value), phone = h$('#hPhone').value.trim();
    if (!amountKes || amountKes < 650) return toast('Minimum deposit is $5 (KSh 650).');
    if (!phone) return toast('Enter the M-Pesa number that should receive the prompt.');
    try {
      const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
      const response = await fetch('/api/deposits/hashpay/stk', { method: 'POST', headers, body: JSON.stringify({ amountKes, phone }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send the M-Pesa prompt.');
      localStorage.setItem('nexora_pending_deposit_reference', data.reference);
      h$('#modalTitle').textContent = 'NEXORA payment in progress';
      h$('#modalText').innerHTML = `<div class="stk-progress"><div class="stk-radar"><i></i><i></i><i></i></div><b>STK prompt sent</b><span>Approve the M-Pesa prompt on your phone.</span><small>Checking your NEXORA payment securely…</small><em>Reference: ${data.reference}</em></div>`;
      h$('#modalAction').disabled = true;
      h$('#modalAction').textContent = 'Awaiting approval';
      pollPendingDeposit();
    } catch (error) { toast(error.message); }
  };
  show();
}

function showWithdrawal() {
  if (!signed()) return showAuth();
  h$('#modalTitle').textContent = 'Request withdrawal';
  h$('#modalText').innerHTML = '<label>Amount (USD)<input id="wAmount" type="number" min="10" value="10"></label><label>Destination<select id="wMethod"><option value="mpesa">M-Pesa number</option><option value="trc20">USDT TRC20 address</option></select></label><label id="destinationLabel">M-Pesa number<input id="wDestination" placeholder="2547XXXXXXXX"></label><p class="housika-note">Minimum withdrawal: $10.</p>';
  h$('#modalAction').textContent = 'Request withdrawal';
  h$('#wMethod').onchange = () => { const trc = h$('#wMethod').value === 'trc20'; h$('#destinationLabel').firstChild.textContent = trc ? 'USDT TRC20 address' : 'M-Pesa number'; h$('#wDestination').placeholder = trc ? 'T...' : '2547XXXXXXXX'; };
  h$('#modalAction').onclick = async () => {
    const amount = Number(h$('#wAmount').value), destination = h$('#wDestination').value.trim();
    if (!amount || amount < 10 || !destination) return toast('Minimum withdrawal is $10. Enter a destination.');
    try {
      const response = await fetch('/api/withdrawal-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ amount, method: h$('#wMethod').value, destination }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create request');
      close(); toast('Withdrawal processing. You will be notified after review.');
    } catch (error) { toast(error.message); }
  };
  show();
}

h$('#binDeposit').onclick = showDeposit;
h$('#binDeposit2').onclick = showDeposit;
h$('#binAccount').onclick = () => signed() ? toast('You are signed in to NEXORA Binary.') : showAuth();
h$('#binWithdraw').classList.remove('withdraw-disabled');
h$('#binWithdraw').onclick = showWithdrawal;
window.setTimeout(pollPendingDeposit, 1000);
