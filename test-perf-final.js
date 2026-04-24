const http = require('http');

async function testPerformance(path) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ GET ${path}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Data items: ${json.data?.length || 0}`);
          console.log(`   Total: ${json.pagination?.total || 0}`);
          console.log(`   Total Pages: ${json.pagination?.totalPages || 0}`);
          console.log(`   ⏱️  Duration: ${duration}ms`);
        } catch (e) {
          console.log(`\n❌ ${path} - Parse error: ${e.message}`);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      const duration = Date.now() - startTime;
      console.log(`\n❌ ${path}`);
      console.log(`   Error: ${e.message}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
      resolve();
    });
  });
}

async function main() {
  console.log('🚀 Performance Test - Database-Level Pagination\n');
  console.log('Testing endpoints with optimized database pagination...\n');
  
  // Test rodadas
  console.log('📍 RODADAS ENDPOINTS:');
  await testPerformance('/api/rodadas?page=1&limit=20');
  await testPerformance('/api/rodadas?page=2&limit=20');
  await testPerformance('/api/rodadas?page=5&limit=10');
  
  // Test partidas
  console.log('\n📍 PARTIDAS ENDPOINTS:');
  await testPerformance('/api/partidas?page=1&limit=20');
  await testPerformance('/api/partidas?page=2&limit=20');
  await testPerformance('/api/partidas?page=10&limit=5');
  
  // Test search
  console.log('\n📍 SEARCH ENDPOINTS:');
  await testPerformance('/api/rodadas/search?nome=Flamengo&page=1&limit=10');
  
  console.log('\n✅ All tests completed!');
  process.exit(0);
}

main().catch(console.error);
