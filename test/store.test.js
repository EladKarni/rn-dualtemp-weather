// Test script to verify useForecastStore implementation
// Run with: node -r esbuild-register test/store.test.js

// Mock React Native environment for Node.js testing
global.console = console;

async function testStoreBasics() {
  console.log('🧪 Testing useForecastStore basics...');
  
  try {
    // Import after mock setup
    const { initializeForecastStore, useForecastStore } = require('../src/store/useForecastStore.ts');
    
    // Test store creation
    const store = useForecastStore.getState();
    console.log('✅ Store created successfully');
    
    // Test initial state
    console.log('📋 Initial state:', {
      forecast: store.forecast,
      lastUpdated: store.lastUpdated
    });
    
    // Test database initialization
    await initializeForecastStore();
    console.log('✅ Database initialized');
    
    // Test database stats
    const stats = await store.getDatabaseStats();
    console.log('📊 Database stats:', stats);
    
    // Test update methods
    store.updateLastUpdated('2024-01-01T00:00:00Z');
    console.log('✅ Last updated set to:', store.lastUpdated);
    
    console.log('🎉 Basic store tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Store test failed:', error);
    return false;
  }
}

async function testSQLiteIntegration() {
  console.log('\n🗃️ Testing SQLite integration...');
  
  try {
    const { useForecastStore } = require('../src/store/useForecastStore.ts');
    const { weatherDatabase } = require('../src/utils/database.ts');
    
    // Initialize database
    await weatherDatabase.initialize();
    console.log('✅ SQLite database initialized');
    
    const store = useForecastStore.getState();
    
    // Test database operations
    const stats = await store.getDatabaseStats();
    console.log('📈 Database stats after init:', stats);
    
    console.log('✅ SQLite integration test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ SQLite test failed:', error);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting useForecastStore tests...\n');
  
  const basicTest = await testStoreBasics();
  const sqliteTest = await testSQLiteIntegration();
  
  console.log('\n📋 Test Results:');
  console.log('Basic Store:', basicTest ? '✅ PASS' : '❌ FAIL');
  console.log('SQLite Integration:', sqliteTest ? '✅ PASS' : '❌ FAIL');
  
  if (basicTest && sqliteTest) {
    console.log('\n🎉 All tests passed! Implementation appears to be working.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('🔥 Test runner failed:', error);
  process.exit(1);
});