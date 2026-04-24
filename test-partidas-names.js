const http = require('http');

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Items: ${json.data?.length || 0}`);
          
          // Mostrar exemplo do primeiro item com nomes
          if (json.data && json.data.length > 0) {
            const item = json.data[0];
            console.log(`\n   📌 Exemplo do primeiro item:`);
            console.log(`   - Time Casa: ${item.timeCasa} (${item.timeCasaNome})`);
            console.log(`   - Time Fora: ${item.timeFora} (${item.timeForaNome})`);
            if (item.desempenhos && item.desempenhos.length > 0) {
              const firstPerf = item.desempenhos[0];
              console.log(`   - 1º Jogador: ID ${firstPerf.jogador_id} (${firstPerf.jogador_nome})`);
            }
          }
        } catch (e) {
          console.log(`\n❌ ${description} - Parse error: ${e.message}`);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log(`\n❌ ${description} - ${e.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log('🚀 Testing Partidas API with player names\n');
  
  await testEndpoint('/api/partidas?limit=1', 'GET /api/partidas (with player names)');
  await testEndpoint('/api/partidas/search?nome=Flamengo&limit=1', 'GET /api/partidas/search (with player names)');
  
  console.log('\n✅ Test completed!');
  process.exit(0);
}

setTimeout(main, 1500);
