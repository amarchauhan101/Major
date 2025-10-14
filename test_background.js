// Test script to check backend connectivity from background script context

async function testBackendConnection() {
    console.log('🔗 Testing backend connection...');
    
    try {
        const response = await fetch('http://localhost:8000/', {
            method: 'GET'
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected successfully:', data);
            return { success: true, status: 'connected', backend_url: 'http://localhost:8000' };
        } else {
            console.log('❌ Backend not responding');
            return { success: false, status: 'error', error: 'Backend not responding' };
        }
    } catch (error) {
        console.error('💥 Backend connection failed:', error);
        return { 
            success: false, 
            status: 'disconnected', 
            error: `Cannot connect to backend at http://localhost:8000. Error: ${error.message}`
        };
    }
}

async function testAnalyzeEndpoint() {
    console.log('🧪 Testing analyze endpoint...');
    
    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: 'Test terms and conditions content for analysis. This service collects personal data for advertising purposes.',
                language: 'en'
            })
        });
        
        console.log('Analyze response status:', response.status);
        console.log('Analyze response ok:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Analyze endpoint working:', result);
            return { success: true, data: result };
        } else {
            console.log('❌ Analyze endpoint failed');
            return { success: false, error: 'Analyze endpoint failed' };
        }
    } catch (error) {
        console.error('💥 Analyze endpoint error:', error);
        return { success: false, error: error.message };
    }
}

// Run tests
console.log('🚀 Starting backend tests...');

testBackendConnection().then(result => {
    console.log('Backend connection test result:', result);
    
    if (result.success) {
        return testAnalyzeEndpoint();
    } else {
        console.log('Skipping analyze test due to connection failure');
        return null;
    }
}).then(result => {
    if (result) {
        console.log('Analyze endpoint test result:', result);
    }
    console.log('🏁 Tests completed');
}).catch(error => {
    console.error('💥 Test error:', error);
});