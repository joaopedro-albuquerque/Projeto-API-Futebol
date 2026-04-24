require('dotenv').config({ path: require('path').resolve(__dirname, '../api-futebol/.env'), override: true });
const fs = require('fs');
(async () => {
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch('https://webws.365scores.com/web/game/?appTypeId=5&langId=31&timezoneName=America%2FSao_Paulo&userCountryId=31&gameId=4632534&sports=1', {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json', Referer: 'https://www.365scores.com/' }
  });
  const data = await res.json();
  const lineup = data.game?.homeCompetitor?.lineups;
  const m0 = lineup?.members?.[0];
  const out = {
    lineupKeys: Object.keys(lineup || {}),
    memberKeys: Object.keys(m0 || {}),
    member0: m0,
    member1: lineup?.members?.[1],
  };
  fs.writeFileSync(__dirname + '/_debug-out.json', JSON.stringify(out, null, 2));
  console.log('OK — escrito em scripts/_debug-out.json');
})().catch(e => { require('fs').writeFileSync(require('path').resolve(__dirname, '_debug-out.json'), JSON.stringify({ error: e.message })); });
