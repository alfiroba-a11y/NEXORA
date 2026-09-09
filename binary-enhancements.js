const e$ = selector => document.querySelector(selector);
const ea = selector => [...document.querySelectorAll(selector)];
document.querySelector('header').insertAdjacentHTML('afterbegin', '<button class="mobile-menu" id="mobileMenu" aria-label="Open settings">☰</button>');
const nexoraUser=JSON.parse(localStorage.getItem('nexora_user')||'{}');const nexoraName=(nexoraUser.display_name||nexoraUser.email||'Trader').split('@')[0];document.querySelector('.hub').insertAdjacentHTML('afterend',`<span class="user-greeting">Hi, ${nexoraName}</span>`);
function showEmpty(kind) { const empty = document.querySelector('.empty'); empty.querySelector('h3').textContent = kind === 'Open' ? 'No open contracts' : kind === 'Closed' ? 'No closed contracts' : 'No transactions yet'; empty.querySelector('p').textContent = `Your ${kind.toLowerCase()} NEXORA activity will appear here`; }
ea('.side-tabs button').forEach(button => button.onclick = () => { ea('.side-tabs button').forEach(item => item.classList.remove('active')); button.classList.add('active'); showEmpty(button.textContent.split(' ')[0]); });
e$('#mobileMenu').onclick = () => { sessionStorage.setItem('nexora_internal_navigation', 'settings'); location.href = 'settings.html'; };
e$('#historyBtn').onclick = () => document.querySelector('.side-tabs button:nth-child(2)').click();
e$('#chatBtn').onclick = () => toast('NEXORA support will be available soon.');
