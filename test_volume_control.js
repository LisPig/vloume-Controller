// test_volume_control.js - Volume Control Test Script
// This script can be run in the developer console to test functionality

class VolumeControlTester {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
    }

    // Simulate popup sending volume control message
    async testVolumeControl(volume = 0.5, retries = 3) {
        this.testCount++;
        const testId = `test_${this.testCount}_${Date.now()}`;
        
        console.log(`🧪 Starting test ${testId}: setting volume to ${volume}`);
        
        const testResult = {
            id: testId,
            volume: volume,
            timestamp: Date.now(),
            attempts: [],
            success: false,
            totalTime: 0
        };

        const startTime = Date.now();
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            const attemptStart = Date.now();
            
            try {
                const response = await this.sendVolumeMessage(volume, attempt);
                const attemptTime = Date.now() - attemptStart;
                
                testResult.attempts.push({
                    attempt: attempt,
                    success: true,
                    time: attemptTime,
                    response: response
                });
                
                testResult.success = true;
                console.log(`✅ Test ${testId} successful - attempt ${attempt}, took ${attemptTime}ms`);
                break;
                
            } catch (error) {
                const attemptTime = Date.now() - attemptStart;
                
                testResult.attempts.push({
                    attempt: attempt,
                    success: false,
                    time: attemptTime,
                    error: error.message
                });
                
                console.warn(`❌ Test ${testId} attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < retries) {
                    const delay = 200 * Math.pow(2, attempt - 1);
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await this.sleep(delay);
                }
            }
        }
        
        testResult.totalTime = Date.now() - startTime;
        this.testResults.push(testResult);
        
        if (!testResult.success) {
            console.error(`❌ Test ${testId} ultimately failed - total time: ${testResult.totalTime}ms`);
        }
        
        return testResult;
    }

    // Send volume control message
    sendVolumeMessage(volume, attempt) {
        return new Promise((resolve, reject) => {
            // Check if in extension environment
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                // In popup environment
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    const tabId = tabs[0].id;
                    chrome.tabs.sendMessage(tabId, {
                        type: 'siteVolume',
                        site: window.location?.hostname || 'test.com',
                        volume: volume
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
            } else {
                // In content script environment, test directly
                const mediaElements = document.querySelectorAll('video, audio');
                if (mediaElements.length === 0) {
                    reject(new Error('No media elements found'));
                    return;
                }
                
                let successCount = 0;
                mediaElements.forEach(element => {
                    try {
                        element.volume = volume;
                        successCount++;
                    } catch (error) {
                        console.warn('Failed to set volume on element:', error);
                    }
                });
                
                if (successCount > 0) {
                    resolve({
                        success: true,
                        elementsUpdated: successCount,
                        totalElements: mediaElements.length
                    });
                } else {
                    reject(new Error('Failed to update any media elements'));
                }
            }
        });
    }

    // Batch testing
    async runBatchTest(volumes = [0.1, 0.3, 0.5, 0.7, 0.9], iterations = 3) {
        console.log(`🚀 Starting batch test - ${volumes.length} volume levels × ${iterations} iterations`);
        
        const allTests = [];
        
        for (let i = 0; i < iterations; i++) {
            console.log(`📊 Round ${i + 1}/${iterations} testing`);
            
            for (const volume of volumes) {
                const result = await this.testVolumeControl(volume, 3);
                allTests.push(result);
                
                // Test interval
                await this.sleep(500);
            }
        }
        
        this.generateTestReport();
        return allTests;
    }

    // Generate test report
    generateTestReport() {
        const total = this.testResults.length;
        const successful = this.testResults.filter(r => r.success).length;
        const failed = total - successful;
        const successRate = ((successful / total) * 100).toFixed(2);
        
        const avgTime = this.testResults
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.totalTime, 0) / successful;
        
        const avgAttempts = this.testResults
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.attempts.length, 0) / successful;

        console.log('\n📈 ===== Volume Control Test Report =====');
        console.log(`Total tests: ${total}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success rate: ${successRate}%`);
        console.log(`Average response time: ${avgTime?.toFixed(2)}ms`);
        console.log(`Average attempts: ${avgAttempts?.toFixed(2)}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed cases analysis:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    const lastError = r.attempts[r.attempts.length - 1]?.error || 'Unknown error';
                    console.log(`  - ${r.id}: ${lastError}`);
                });
        }
        
        console.log('=========================================\n');
    }

    // Helper function: delay
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Clear test results
    clearResults() {
        this.testResults = [];
        this.testCount = 0;
        console.log('🧹 Test results cleared');
    }
}

// Create global test instance
window.volumeTester = new VolumeControlTester();

// Usage instructions
console.log(`
🧪 Volume Control Test Tool Loaded!

Usage:
1. Single test: volumeTester.testVolumeControl(0.5)
2. Batch test: volumeTester.runBatchTest()
3. View results: volumeTester.testResults
4. Clear results: volumeTester.clearResults()

Examples:
- await volumeTester.testVolumeControl(0.3)
- await volumeTester.runBatchTest([0.2, 0.5, 0.8], 2)
`); 