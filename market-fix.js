const mf$ = s => document.querySelector(s);
const pairs = [
  ['🇪🇺🇺🇸','EUR/USD','Forex','OANDA:EURUSD'],['🇬🇧🇺🇸','GBP/USD','Forex','OANDA:GBPUSD'],['🇺🇸🇯🇵','USD/JPY','Forex','OANDA:USDJPY'],['🇺🇸🇰🇪','USD/KES','Forex','FX_IDC:USDKES'],['🇪🇺🇰🇪','EUR/KES','Forex','FX_IDC:EURKES'],['🇬🇧🇯🇵','GBP/JPY','Forex','OANDA:GBPJPY'],['🇦🇺🇺🇸','AUD/USD','Forex','OANDA:AUDUSD'],['🇨🇦🇺🇸','USD/CAD','Forex','OANDA:USDCAD'],
  ['₿','BTC/USD','Crypto','BINANCE:BTCUSDT'],['♦','ETH/USD','Crypto','BINANCE:ETHUSDT'],['◈','BNB/USD','Crypto','BINANCE:BNBUSDT'],['◎','SOL/USD','Crypto','BINANCE:SOLUSDT'],['◒','XRP/USD','Crypto','BINANCE:XRPUSDT'],['◉','ADA/USD','Crypto','BINANCE:ADAUSDT'],['◌','DOGE/USD','Crypto','BINANCE:DOGEUSDT'],['△','AVAX/USD','Crypto','BINANCE:AVAXUSDT'],['●','DOT/USD','Crypto','BINANCE:DOTUSDT'],['⌁','LINK/USD','Crypto','BINANCE:LINKUSDT'],['Ł','LTC/USD','Crypto','BINANCE:LTCUSDT'],['T','TRX/USD','Crypto','BINANCE:TRXUSDT'],['◍','POL/USD','Crypto','BINANCE:POLUSDT'],['◐','SHIB/USD','Crypto','BINANCE:SHIBUSDT'],['₳','ATOM/USD','Crypto','BINANCE:ATOMUSDT'],
  ['◈','XAU/USD','Commodities','OANDA:XAUUSD'],['🇺🇸','US 500','Indices','FOREXCOM:SPXUSD']
];
pairs.forEach(([,name,,symbol]) => tvMap[name] = symbol);
const menu = mf$('#marketMenu'), picker = mf$('#marketPicker'), options = mf$('#marketOptions');
options.innerHTML = pairs.map(([icon,name,kind]) => `<button data-name="${name}"><span>${icon}</span><b>${name}</b><small>${kind}</small></button>`).join('');
function locate(){const box=picker.getBoundingClientRect();menu.style.left=`${Math.max(10,box.left)}px`;menu.style.top=`${box.bottom+5}px`;}
picker.addEventListener('click',()=>setTimeout(locate,0));window.addEventListener('resize',locate);
options.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;e.stopPropagation();const symbol=button.dataset.name;mf$('#symbolLabel').textContent=symbol;mf$('#marketName').innerHTML=`${symbol} <span>LIVE MARKET</span>`;menu.classList.remove('open');document.dispatchEvent(new CustomEvent('nexora:market',{detail:symbol}));window.showToast(`${symbol} loaded`);});
mf$('#marketFilter').oninput=e=>[...options.children].forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
