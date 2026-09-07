const e$ = selector => document.querySelector(selector);
const ea = selector => [...document.querySelectorAll(selector)];
document.querySelector('header').insertAdjacentHTML('afterbegin', '<button class="mobile-menu" id="mobileMenu">☰</button>');
document.querySelector('header nav').insertAdjacentHTML('beforeend', '<button id="profileMenu">◉ Profile</button>');
document.body.insertAdjacentHTML('beforeend', '<nav class="bottomnav"><button id="bottomTrade"><i>▥</i>Trade</button><button class="ai" id="bottomAi">✦</button><button id="bottomPositions"><i>◴</i>Positions</button></nav><section class="mobile-sheet" id="mobileSheet"><button id="goProfile">Profile & settings</button><button id="goHistory">History</button><button id="goSupport">Support</button><button id="closeSheet">Close</button></section>');

function showEmpty(kind) { const empty = document.querySelector('.empty'); empty.querySelector('h3').textContent = kind === 'Open' ? 'No open contracts' : kind === 'Closed' ? 'No closed contracts' : 'No transactions yet'; empty.querySelector('p').textContent = `Your ${kind.toLowerCase()} NEXORA activity will appear here`; }
ea('.side-tabs button').forEach(button => button.onclick = () => { ea('.side-tabs button').forEach(item => item.classList.remove('active')); button.classList.add('active'); showEmpty(button.textContent.split(' ')[0]); });
document.querySelector('nav button:first-child').onclick = () => location.href = 'binary.html';
e$('#profileMenu').onclick = () => e$('#profileLaunch').click();
e$('#historyBtn').onclick = () => document.querySelector('.side-tabs button:nth-child(2)').click();
e$('#chatBtn').onclick = () => modal('NEXORA support', 'Support chat will be available soon.');
ea('.risk button').forEach(button => button.onclick = () => toast(`${button.textContent.trim().split('\n')[0]} settings opened`));
e$('#mobileMenu').onclick = () => e$('#mobileSheet').classList.add('open');
e$('#closeSheet').onclick = () => e$('#mobileSheet').classList.remove('open');
e$('#goProfile').onclick = () => { e$('#mobileSheet').classList.remove('open'); e$('#profileLaunch').click(); };
e$('#goHistory').onclick = () => { e$('#mobileSheet').classList.remove('open'); e$('#historyBtn').click(); };
e$('#goSupport').onclick = () => { e$('#mobileSheet').classList.remove('open'); e$('#chatBtn').click(); };
e$('#bottomTrade').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
