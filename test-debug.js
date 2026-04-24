const http = require('http');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n📍 GET ${path}`);
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response:`, JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(`   Raw:`, data.substring(0, 500));
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log(`\n❌ ${path}`);
      console.log(`   Error: ${e.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log('Testing endpoints...');
  await testEndpoint('/api/rodadas?limit=2');
  await testEndpoint('/api/partidas?limit=2');
  process.exit(0);
}

main().catch(console.error);
