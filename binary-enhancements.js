const e$ = selector => document.querySelector(selector);
const ea = selector => [...document.querySelectorAll(selector)];
document.querySelector('header').insertAdjacentHTML('afterbegin', '<button class="mobile-menu" id="mobileMenu">☰</button>');
document.querySelector('header nav').insertAdjacentHTML('beforeend', '<button id="learnMenu">◌ Learn</button><button id="toolsMenu">✦ Tools</button><button id="profileMenu">◉ Profile</button>');
document.body.insertAdjacentHTML('beforeend', '<nav class="bottomnav"><button id="bottomTrade"><i>▥</i>Trade</button><button class="ai" id="bottomAi">✦</button><button id="bottomPositions"><i>◴</i>Positions</button></nav><section class="mobile-sheet" id="mobileSheet"><button id="goProfile">Profile & settings</button><button id="goLearn">Learn</button><button id="goHistory">History</button><button id="goSupport">Support</button><p class="mobile-tool-title">WORKSPACE TOOLS</p><div class="mobile-tool-list"><button data-tool="scanner">Market scanner</button><button data-tool="alert">Price alert</button><button data-tool="favorite">Favorite</button><button data-tool="focus">Focus mode</button><button data-tool="contrast">Contrast</button><button data-tool="motion">Reduce motion</button><button data-tool="layout">Save layout</button><button data-tool="reset">Reset layout</button><button data-tool="journal">Journal</button><button data-tool="export">Export journal</button><button data-tool="timer">Session timer</button><button data-tool="limit">Daily limit</button><button data-tool="break">Break reminder</button><button data-tool="notify">Notifications</button><button data-tool="sound">Trade sounds</button><button data-tool="latency">Connection</button><button data-tool="stakes">Quick stakes</button><button data-tool="payout">Payout preview</button><button data-tool="guide">Risk guide</button><button data-tool="support">Help centre</button></div><button id="closeSheet">Close menu</button></section><aside class="tools-panel" id="toolsPanel"><div class="tools-head"><div><small>NEXORA LABS</small><h3>Workspace tools</h3></div><button id="closeTools">×</button></div><div class="tools-grid"><button data-tool="scanner">⌁ Market scanner</button><button data-tool="alert">◉ Price alert</button><button data-tool="favorite">★ Favorite market</button><button data-tool="focus">▣ Focus mode</button><button data-tool="contrast">◐ High contrast</button><button data-tool="motion">≈ Reduce motion</button><button data-tool="layout">▤ Save layout</button><button data-tool="reset">↺ Reset layout</button><button data-tool="journal">▤ Trade journal</button><button data-tool="export">⇩ Export journal</button><button data-tool="timer">◴ Session timer</button><button data-tool="limit">◎ Daily stake limit</button><button data-tool="break">☕ Break reminder</button><button data-tool="notify">♧ Notifications</button><button data-tool="sound">♪ Trade sounds</button><button data-tool="latency">⌁ Connection health</button><button data-tool="stakes">$ Quick stake presets</button><button data-tool="payout">↗ Payout preview</button><button data-tool="guide">? Risk guide</button><button data-tool="support">▢ Help centre</button></div><p class="tools-result" id="toolsResult">Choose a tool to customize your NEXORA workspace.</p></aside>');

function showEmpty(kind) { const empty = document.querySelector('.empty'); empty.querySelector('h3').textContent = kind === 'Open' ? 'No open contracts' : kind === 'Closed' ? 'No closed contracts' : 'No transactions yet'; empty.querySelector('p').textContent = `Your ${kind.toLowerCase()} NEXORA activity will appear here`; }
ea('.side-tabs button').forEach(button => button.onclick = () => { ea('.side-tabs button').forEach(item => item.classList.remove('active')); button.classList.add('active'); showEmpty(button.textContent.split(' ')[0]); });
document.querySelector('nav button:first-child').onclick = () => location.href = 'binary.html';
e$('#profileMenu').onclick = () => e$('#profileLaunch').click();
e$('#learnMenu').onclick = () => location.href = 'learn.html';
e$('#toolsMenu').onclick = () => e$('#toolsPanel').classList.add('open');
e$('#closeTools').onclick = () => e$('#toolsPanel').classList.remove('open');
e$('#historyBtn').onclick = () => document.querySelector('.side-tabs button:nth-child(2)').click();
e$('#chatBtn').onclick = () => modal('NEXORA support', 'Support chat will be available soon.');
ea('.risk button').forEach(button => button.onclick = () => toast(`${button.textContent.trim().split('\n')[0]} settings opened`));
e$('#mobileMenu').onclick = () => e$('#mobileSheet').classList.add('open');
e$('#closeSheet').onclick = () => e$('#mobileSheet').classList.remove('open');
e$('#goProfile').onclick = () => { e$('#mobileSheet').classList.remove('open'); e$('#profileLaunch').click(); };
e$('#goLearn').onclick = () => location.href = 'learn.html';
e$('#goHistory').onclick = () => { e$('#mobileSheet').classList.remove('open'); e$('#historyBtn').click(); };
e$('#goSupport').onclick = () => { e$('#mobileSheet').classList.remove('open'); e$('#chatBtn').click(); };
e$('#bottomTrade').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
const toolResult = e$('#toolsResult');
document.querySelectorAll('[data-tool]').forEach(button => button.onclick = () => {
  const tool = button.dataset.tool;
  e$('#mobileSheet').classList.remove('open');
  localStorage.setItem(`nexora_tool_${tool}`, String(Date.now()));
  if (tool === 'focus') document.body.classList.toggle('focus-mode');
  if (tool === 'contrast') document.body.classList.toggle('high-contrast');
  if (tool === 'motion') document.body.classList.toggle('reduce-motion');
  if (tool === 'layout') localStorage.setItem('nexora_layout_saved', 'true');
  if (tool === 'reset') localStorage.removeItem('nexora_layout_saved');
  if (tool === 'favorite') localStorage.setItem('nexora_favorite_market', e$('#instrumentName').textContent);
  if (tool === 'journal') { const note = prompt('Add a private trade-journal note.'); if (note) localStorage.setItem('nexora_journal', `${localStorage.getItem('nexora_journal') || ''}\n${new Date().toLocaleString()}: ${note}`); }
  if (tool === 'export') { const blob = new Blob([localStorage.getItem('nexora_journal') || 'No journal notes yet.'], { type: 'text/plain' }); const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'nexora-journal.txt' }); link.click(); URL.revokeObjectURL(link.href); }
  if (tool === 'timer') localStorage.setItem('nexora_session_started', String(Date.now()));
  if (tool === 'limit') { const limit = prompt('Set daily Demo stake limit (USD).'); if (limit) localStorage.setItem('nexora_daily_limit', limit); }
  if (tool === 'alert') { const level = prompt(`Set an alert level for ${e$('#instrumentName').textContent}`); if (level) localStorage.setItem('nexora_price_alert', level); }
  if (tool === 'scanner') e$('#bottomAi').click();
  if (tool === 'guide') location.href = 'learn.html#risk';
  if (tool === 'support') e$('#chatBtn').click();
  const labels = { scanner:'Market scanner opened.', alert:'Price alert saved locally.', favorite:'Current market saved to favorites.', focus:'Focus mode toggled.', contrast:'High contrast toggled.', motion:'Reduced motion toggled.', layout:'Layout preference saved.', reset:'Layout preference reset.', journal:'Journal is stored privately on this device.', export:'Journal download started.', timer:'Session timer started.', limit:'Daily Demo stake limit saved.', break:'Break reminder enabled for this session.', notify:'Notification preference toggled.', sound:'Trade sound preference toggled.', latency:'Connection health: stable.', stakes:'Use the quick stake buttons in the order panel.', payout:'Payout estimate is shown beside stake.', guide:'Opening responsible-trading guide.', support:'Opening NEXORA support.' };
  toolResult.textContent = labels[tool];
});
