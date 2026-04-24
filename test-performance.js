const http = require('http');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ ${path}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Data items: ${json.data?.length || 0}`);
          console.log(`   Total: ${json.pagination?.total || 0}`);
          console.log(`   Duration: ${duration}ms`);
        } catch (e) {
          console.log(`\n❌ ${path} - Parse error`);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log(`\n❌ ${path} - ${e.message}`);
      resolve();
    });
  });
}

async function main() {
  console.log('🚀 Testing optimized endpoints...\n');
  
  await testEndpoint('/api/rodadas?page=1&limit=5');
  await testEndpoint('/api/partidas?page=1&limit=5');
  await testEndpoint('/api/rodadas?page=1&limit=1');
  await testEndpoint('/api/partidas?page=1&limit=1');
  
  console.log('\n✅ Tests completed!');
  process.exit(0);
}

main().catch(console.error);
