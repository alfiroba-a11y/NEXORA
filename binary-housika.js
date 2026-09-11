const h$ = selector => document.querySelector(selector);
document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="binary-housika.css">');
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

async function loadPaystack() {
  if (window.PaystackPop) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not open secure payment checkout.'));
    document.head.append(script);
  });
}

function verifyHousikaDeposit(reference, headers, quiet = false) {
  fetch('/api/housika/verify-deposit', { method: 'POST', headers, body: JSON.stringify({ reference }) })
    .then(response => response.json().then(data => ({ ok: response.ok, data })))
    .then(result => {
      if (!result.ok) { if (!quiet) throw new Error(result.data.error || 'Payment is still awaiting approval.'); return; }
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
    verifyHousikaDeposit(reference, headers, true);
  }, 5000);
  window.setTimeout(() => window.clearInterval(poller), 180000);
}

function showDeposit() {
  if (!signed()) return showAuth();
  h$('#modalTitle').textContent = 'NEXORA Deposit';
  h$('#modalText').innerHTML = '<label>Deposit method<select id="hMethod"><option value="mpesa">M-Pesa</option></select></label><label>Amount (KSh)<input id="hAmount" type="number" min="650" value="650"></label><p class="housika-note">Minimum deposit: $5 (KSh 650).</p>';
  h$('#modalAction').textContent = 'Deposit';
  h$('#modalAction').onclick = async () => {
    const amountKes = Number(h$('#hAmount').value);
    if (!amountKes || amountKes < 650) return toast('Minimum deposit is $5 (KSh 650).');
    try {
      const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
      const [configResponse, intentResponse] = await Promise.all([
        fetch('/api/housika/config', { headers: { Authorization: `Bearer ${token()}` } }),
        fetch('/api/housika/deposit-intent', { method: 'POST', headers, body: JSON.stringify({ amountKes }) })
      ]);
      const config = await configResponse.json(), intent = await intentResponse.json();
      if (!configResponse.ok) throw new Error(config.error || 'Payments are not configured.');
      if (!intentResponse.ok) throw new Error(intent.error || 'Unable to start deposit.');
      localStorage.setItem('nexora_pending_deposit_reference', intent.reference);
      await loadPaystack();
      const handler = PaystackPop.setup({ key: config.publicKey, email: intent.checkoutEmail, amount: Math.round(amountKes * 100), currency: 'KES', ref: intent.reference, channels: ['mobile_money'], callback: response => verifyHousikaDeposit(response.reference, headers), onClose: () => toast('Payment checkout closed.') });
      handler.openIframe();
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
