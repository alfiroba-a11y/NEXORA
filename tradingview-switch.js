document.addEventListener('click',e=>{const choice=e.target.closest('#marketOptions button');if(choice)document.dispatchEvent(new CustomEvent('nexora:market',{detail:choice.dataset.name}));});
