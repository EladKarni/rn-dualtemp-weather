import { initializeForecastStore, useForecastStore } from '../src/store/useForecastStore';
import { logger } from '../src/utils/logger';

/**
 * Simple test to verify the useForecastStore implementation
 * This can be run in development to test the SQLite integration
 */
export async function testForecastStore() {
  try {
    console.log('🧪 Testing useForecastStore...');
    
    // Initialize store
    await initializeForecastStore();
    console.log('✅ Database initialized successfully');
    
    const store = useForecastStore.getState();
    
    // Test database stats
    const stats = await store.getDatabaseStats();
    console.log('📊 Database stats:', stats);
    
    // Test runtime state
    console.log('💾 Runtime state:', {
      forecast: store.forecast ? 'has data' : 'null',
      lastUpdated: store.lastUpdated || 'not set'
    });
    
    console.log('🎉 useForecastStore test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ useForecastStore test failed:', error);
    return false;
  }
}

// Export test function for manual testing
export default testForecastStore;