const ux = s => document.querySelector(s), uxa = s => [...document.querySelectorAll(s)];
let nexoraEngine = 'cfd';
function updateOptionPreview() {
  const stake = Number(ux('#amount')?.value || 0);
  const factors = { 'Higher / Lower': 1.85, 'Rise / Fall': 1.8, 'Even / Odd': 1.9, 'Matches / Differs': 1.95, 'Over / Under digit': 1.82, 'Touch / No touch': 2.1, Multiplier: 2.4, Accumulator: 2.15 };
  ux('#payout').textContent = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(stake * (factors[ux('#contractType').value] || 1.8));
}
uxa('.engine-switch button').forEach(button => button.addEventListener('click', () => {
  nexoraEngine = button.dataset.engine;
  uxa('.engine-switch button').forEach(x => x.classList.toggle('selected', x === button));
  ux('#contractFields').classList.toggle('show', nexoraEngine === 'options');
  ux('#placeOrder').innerHTML = nexoraEngine === 'options' ? 'Purchase contract <span>→</span>' : `${window.side === 'sell' ? 'Sell' : 'Buy'} ${ux('#symbolLabel').textContent} <span>→</span>`;
  updateOptionPreview();
}));
ux('#amount').addEventListener('input', updateOptionPreview);ux('#contractType').addEventListener('change', updateOptionPreview);
ux('#walletDeposit').onclick = () => window.openModal('deposit');
ux('#withdrawBtn').onclick = () => window.openModal('withdraw');
ux('#cashierNav').onclick = e => { e.preventDefault(); ux('#cashier').scrollIntoView({behavior:'smooth'}); };
ux('#profileBtn').onclick = () => { ux('#modalBackdrop').classList.add('open');ux('#profileModal').classList.add('open'); };
ux('#twoFactorBtn').onclick = () => window.showToast('2FA setup requires a server-issued enrollment QR code.');
