#!/usr/bin/env node

/**
 * Spike Test: Validate @qr-platform/qr-code.js for QR API v2
 * Tests: installation, basic generation, dot styles, eye customization, gradients, SVG output
 */

const fs = require('fs');
const path = require('path');

// Test configurations for different dot styles
const TEST_CASES = [
  {
    name: 'basic_square',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'square', color: '#000000' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'dots_circular',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'dots', color: '#0F6E56' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'rounded_style',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'rounded', color: '#2196F3' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'extra_rounded',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'extra-rounded', color: '#FF5722' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'classy_style',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'classy', color: '#9C27B0' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'classy_rounded',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'classy-rounded', color: '#FF9800' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'custom_eyes',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: { type: 'dots', color: '#000000' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#FF0000' },
      cornersDotOptions: { type: 'dot', color: '#0000FF' },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'gradient_test',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: {
        type: 'rounded',
        gradient: {
          type: 'linear',
          rotation: 45,
          colorStops: [
            { offset: 0, color: '#0F6E56' },
            { offset: 1, color: '#2196F3' }
          ]
        }
      },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  },
  {
    name: 'radial_gradient',
    config: {
      data: 'https://endpnt.dev',
      dotsOptions: {
        type: 'dots',
        gradient: {
          type: 'radial',
          colorStops: [
            { offset: 0, color: '#FF0000' },
            { offset: 0.5, color: '#00FF00' },
            { offset: 1, color: '#0000FF' }
          ]
        }
      },
      backgroundOptions: { color: '#FFFFFF' },
      margin: 4
    }
  }
];

async function runSpike() {
  console.log('🔍 Starting QR Library Spike Test\n');

  try {
    // Test 1: Import the library
    console.log('1️⃣  Testing library import...');
    const { QRCodeJs, QRCodeBuilder } = require('@qr-platform/qr-code.js');
    console.log('✅ Library imported successfully');
    console.log(`📦 QRCodeJs type: ${typeof QRCodeJs}`);
    console.log(`📦 QRCodeBuilder type: ${typeof QRCodeBuilder}`);

    // Create output directory
    const outputDir = path.join(__dirname, 'spike-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Test 2: Basic instantiation
    console.log('\n2️⃣  Testing basic instantiation...');
    const basicQR = new QRCodeJs({
      data: 'test',
      dotsOptions: { type: 'square', color: '#000000' }
    });
    console.log('✅ QR instance created successfully');

    // Test 3: SVG generation
    console.log('\n3️⃣  Testing SVG generation...');
    const basicSVG = basicQR.qrSVG._element.toString();
    if (!basicSVG || basicSVG.length === 0) {
      throw new Error('SVG generation failed - empty output');
    }
    console.log(`✅ SVG generated successfully (${basicSVG.length} bytes)`);

    // Write basic SVG to file
    fs.writeFileSync(path.join(outputDir, 'basic_test.svg'), basicSVG);

    // Test 4: All dot styles and features
    console.log('\n4️⃣  Testing all dot styles and features...');
    const results = [];

    for (const testCase of TEST_CASES) {
      try {
        console.log(`   Testing: ${testCase.name}...`);

        const qr = new QRCodeJs({
          width: 400,
          height: 400,
          qrOptions: {
            errorCorrectionLevel: 'M'
          },
          ...testCase.config
        });

        // Test SVG output
        const svgData = qr.qrSVG._element.toString();
        if (!svgData || svgData.length === 0) {
          throw new Error(`SVG generation failed for ${testCase.name}`);
        }

        // Note: PNG generation requires canvas/DOM which may not be available in Node.js
        // For this library, we'll focus on SVG output and convert to PNG using sharp later
        const pngData = null; // Will be handled by sharp in actual implementation

        // Save outputs
        fs.writeFileSync(path.join(outputDir, `${testCase.name}.svg`), svgData);

        results.push({
          name: testCase.name,
          svgSize: svgData.length,
          pngSize: 0, // Will be handled by sharp conversion
          status: 'success'
        });

        console.log(`   ✅ ${testCase.name}: SVG ${svgData.length}b (PNG conversion via sharp)`);

      } catch (error) {
        console.log(`   ❌ ${testCase.name}: ${error.message}`);
        results.push({
          name: testCase.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Test 5: Validate SVG structure
    console.log('\n5️⃣  Testing SVG structure validation...');
    const testSVG = results.find(r => r.status === 'success');
    if (testSVG) {
      const svgContent = fs.readFileSync(path.join(outputDir, `${testSVG.name}.svg`), 'utf8');

      // Check for expected SVG elements
      const checks = [
        { pattern: /<svg[^>]*>/, desc: 'SVG root element' },
        { pattern: /<rect|<circle|<path/, desc: 'QR modules (shapes)' },
        { pattern: /viewBox=["'][^"']*["']/, desc: 'viewBox attribute' },
        { pattern: /<defs|<linearGradient|<radialGradient/, desc: 'Gradient definitions (if applicable)' }
      ];

      for (const check of checks) {
        const found = check.pattern.test(svgContent);
        console.log(`   ${found ? '✅' : '⚠️'} ${check.desc}: ${found ? 'Found' : 'Not found'}`);
      }
    }

    // Test 6: Memory usage check
    console.log('\n6️⃣  Testing memory usage...');
    const memBefore = process.memoryUsage();

    // Generate multiple QR codes to test memory leaks
    for (let i = 0; i < 10; i++) {
      const qr = new QRCodeJs({
        data: `test-${i}`,
        dotsOptions: { type: 'dots', color: '#000000' }
      });
      qr.qrSVG._element.toString(); // Generate SVG
    }

    const memAfter = process.memoryUsage();
    const memDiff = memAfter.heapUsed - memBefore.heapUsed;
    console.log(`   📊 Memory delta: ${Math.round(memDiff / 1024)}KB`);

    if (memDiff > 50 * 1024 * 1024) { // 50MB threshold
      console.log('   ⚠️  High memory usage detected');
    } else {
      console.log('   ✅ Memory usage acceptable');
    }

    // Summary
    console.log('\n📊 SPIKE TEST SUMMARY');
    console.log('='.repeat(50));

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`✅ Successful tests: ${successful}/${TEST_CASES.length}`);
    if (failed > 0) {
      console.log(`❌ Failed tests: ${failed}/${TEST_CASES.length}`);
      console.log('\nFailed tests:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }

    console.log(`\n📁 Output files saved to: ${outputDir}`);

    // Final verdict
    if (successful >= 7) { // At least 7/9 test cases must pass
      console.log('\n🎉 SPIKE TEST PASSED');
      console.log('✅ @qr-platform/qr-code.js is suitable for production use');
      console.log('✅ Proceed with Phase 2: Backend v2 Core Implementation');
      return true;
    } else {
      console.log('\n❌ SPIKE TEST FAILED');
      console.log('❌ @qr-platform/qr-code.js is not suitable - consider fallback to qr-code-styling');
      return false;
    }

  } catch (error) {
    console.error('\n💥 SPIKE TEST CRITICAL FAILURE');
    console.error(`Error: ${error.message}`);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the spike test
if (require.main === module) {
  runSpike().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runSpike };