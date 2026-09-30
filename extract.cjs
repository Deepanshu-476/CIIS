const fs = require('fs');
const content = fs.readFileSync('d:/ciisnetwork/CIIS/src/marketing/pages/HomePage.jsx', 'utf8');
const w = content.indexOf(`v.P.k === 'work'`);
const c = content.indexOf(`v.P.k === 'clients'`);
console.log(content.slice(w, c));
