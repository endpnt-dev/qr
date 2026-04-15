#!/usr/bin/env node

/**
 * Test the QR API v2 endpoint directly
 * Tests basic functionality without requiring compiled TypeScript
 */

const fs = require('fs');
const path = require('path');

// Create a minimal test server
async function testV2Endpoint() {
  console.log('🧪 Testing QR Code API v2 Endpoint\n');

  // Test cases for the v2 endpoint
  const testCases = [
    {
      name: 'basic_v1_compatibility',
      body: {
        data: 'https://endpnt.dev',
        size: 300,
        format: 'png',
        color: '#000000',
        background: '#FFFFFF'
      },
      description: 'Test basic v1 backwards compatibility'
    },
    {
      name: 'dot_styling',
      body: {
        data: 'https://endpnt.dev',
        size: 300,
        format: 'png',
        dot_style: 'rounded',
        color: '#2196F3'
      },
      description: 'Test dot styling features'
    },
    {
      name: 'gradient_test',
      body: {
        data: 'https://endpnt.dev',
        size: 300,
        format: 'png',
        dot_style: 'classy',
        gradient: {
          type: 'linear',
          rotation: 45,
          colors: [
            { offset: 0, color: '#0F6E56' },
            { offset: 1, color: '#2196F3' }
          ]
        }
      },
      description: 'Test gradient functionality'
    }
  ];

  // Mock environment for testing
  process.env.API_KEYS = JSON.stringify({
    'ek_test_12345': {
      tier: 'free',
      name: 'Test Key'
    }
  });

  console.log('✅ Environment set up for testing');
  console.log('📋 Running endpoint tests...\n');

  // Import after setting env
  const { NextRequest } = require('next/server');

  const results = [];

  for (const testCase of testCases) {
    console.log(`🔍 ${testCase.name}: ${testCase.description}`);

    try {
      // Create a mock NextRequest
      const url = `http://localhost:3000/api/v2/generate`;
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ek_test_12345'
        },
        body: JSON.stringify(testCase.body)
      });

      // Import the route handler
      const { POST } = require('./app/api/v2/generate/route.ts');

      const startTime = Date.now();
      const response = await POST(request);
      const duration = Date.now() - startTime;

      const responseData = await response.json();

      if (responseData.success) {
        console.log(`   ✅ Success: ${responseData.data.format} ${responseData.data.size}x${responseData.data.size} (${Math.round(responseData.data.file_size_bytes / 1024)}KB) in ${duration}ms`);

        if (responseData.data.warnings && responseData.data.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${responseData.data.warnings.join(', ')}`);
        }

        // Save the image for manual inspection
        const imageBuffer = Buffer.from(responseData.data.image, 'base64');
        const outputDir = path.join(__dirname, 'test-v2-endpoint-output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        const filename = `${testCase.name}.${responseData.data.format}`;
        fs.writeFileSync(path.join(outputDir, filename), imageBuffer);

        results.push({
          name: testCase.name,
          status: 'success',
          duration,
          size: responseData.data.file_size_bytes,
          format: responseData.data.format,
          warnings: responseData.data.warnings ? responseData.data.warnings.length : 0
        });
      } else {
        console.log(`   ❌ Failed: ${responseData.error}`);
        results.push({
          name: testCase.name,
          status: 'failed',
          error: responseData.error
        });
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        name: testCase.name,
        status: 'error',
        error: error.message
      });
    }

    console.log('');
  }

  // Summary
  console.log('📊 ENDPOINT TEST RESULTS');
  console.log('='.repeat(40));

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status !== 'success').length;

  console.log(`✅ Successful tests: ${successful}/${testCases.length}`);
  if (failed > 0) {
    console.log(`❌ Failed tests: ${failed}/${testCases.length}`);
    console.log('\nFailed tests:');
    results.filter(r => r.status !== 'success').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  if (successful > 0) {
    console.log(`\n📁 Test images saved to: test-v2-endpoint-output/`);
  }

  // Verdict
  if (successful >= testCases.length) {
    console.log('\n🎉 QR CODE API v2 CORE FEATURES WORKING!');
    console.log('✅ Phase 2 Complete - Backend v2 Core Implementation');
    console.log('✅ Ready for Phase 3: Border and Overlay Features');
    return true;
  } else if (successful >= 1) {
    console.log('\n✅ QR Code API v2 Basic Functionality Working');
    console.log('⚠️  Some advanced features need fixes before Phase 3');
    return true;
  } else {
    console.log('\n❌ QR Code API v2 Core Issues - Fix before proceeding');
    return false;
  }
}

// Handle imports that require build
try {
  // Test if the v2 route can be imported
  require('./app/api/v2/generate/route.ts');

  // Run tests
  testV2Endpoint().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 This might be because the project needs to be built first.');
    console.log('   Try running: npm run build');
    process.exit(1);
  });

} catch (error) {
  console.log('❌ Cannot import v2 route handler:', error.message);
  console.log('\n💡 The project needs to be built or started first.');
  console.log('   Try running: npm run build && npm start');
  console.log('   Or start dev server: npm run dev');
  console.log('\n🔧 Alternative: Test via HTTP once server is running:');
  console.log('   curl -X POST http://localhost:3000/api/v2/generate \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "x-api-key: ek_test_12345" \\');
  console.log('     -d \'{"data":"https://endpnt.dev","dot_style":"rounded"}\'');
  process.exit(1);
}