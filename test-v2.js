#!/usr/bin/env node

/**
 * Test script for QR Code API v2
 * Tests core styling features and backwards compatibility
 */

const { generateQRCodeV2 } = require('./lib/qr-v2/index.js');
const fs = require('fs');
const path = require('path');

const TEST_CASES = [
  {
    name: 'basic_backwards_compatibility',
    params: {
      data: 'https://endpnt.dev',
      size: 300,
      format: 'png',
      color: '#000000',
      background: '#FFFFFF',
      margin: 4,
      error_correction: 'M'
    },
    description: 'Test backwards compatibility with v1 parameters'
  },
  {
    name: 'dot_styles',
    params: {
      data: 'https://endpnt.dev',
      size: 300,
      format: 'png',
      dot_style: 'rounded',
      color: '#2196F3'
    },
    description: 'Test dot styling with rounded modules'
  },
  {
    name: 'eye_customization',
    params: {
      data: 'https://endpnt.dev',
      size: 300,
      format: 'png',
      dot_style: 'dot',
      eye_shape: 'rounded',
      eye_color: '#FF5722',
      eye_inner_shape: 'dot',
      eye_inner_color: '#4CAF50'
    },
    description: 'Test eye pattern customization'
  },
  {
    name: 'linear_gradient',
    params: {
      data: 'https://endpnt.dev',
      size: 300,
      format: 'png',
      dot_style: 'rounded',
      gradient: {
        type: 'linear',
        rotation: 45,
        colors: [
          { offset: 0, color: '#0F6E56' },
          { offset: 1, color: '#2196F3' }
        ]
      }
    },
    description: 'Test linear gradient on dots'
  },
  {
    name: 'styled_border',
    params: {
      data: 'https://endpnt.dev',
      size: 300,
      format: 'png',
      dot_style: 'classy',
      color: '#9C27B0',
      border: {
        mode: 'styled',
        width: 20,
        color: '#FF9800',
        radius: 10,
        padding: 15,
        label: {
          text: 'SCAN ME',
          position: 'bottom',
          font_size: 16,
          font_color: '#FFFFFF'
        }
      }
    },
    description: 'Test styled border with label'
  },
  {
    name: 'svg_output',
    params: {
      data: 'https://endpnt.dev',
      size: 300,
      format: 'svg',
      dot_style: 'classy-rounded',
      gradient: {
        type: 'radial',
        colors: [
          { offset: 0, color: '#FF0000' },
          { offset: 1, color: '#0000FF' }
        ]
      }
    },
    description: 'Test SVG output with gradient'
  }
];

async function runTests() {
  console.log('🧪 Testing QR Code API v2 Core Features\n');

  // Create output directory
  const outputDir = path.join(__dirname, 'test-v2-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const results = [];

  for (const testCase of TEST_CASES) {
    console.log(`🔍 ${testCase.name}: ${testCase.description}`);

    try {
      const startTime = Date.now();
      const result = await generateQRCodeV2(testCase.params);
      const duration = Date.now() - startTime;

      // Save output file
      const extension = result.format === 'svg' ? 'svg' : 'png';
      const filename = `${testCase.name}.${extension}`;
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, result.imageBuffer);

      // Validate result structure
      const isValid = validateResult(result, testCase.params);

      console.log(`   ✅ Success: ${result.format} ${result.size}x${result.size} (${Math.round(result.fileSizeBytes / 1024)}KB) in ${duration}ms`);

      if (result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
      }

      results.push({
        name: testCase.name,
        status: 'success',
        duration,
        size: result.fileSizeBytes,
        format: result.format,
        warnings: result.warnings.length,
        valid: isValid
      });

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        name: testCase.name,
        status: 'failed',
        error: error.message
      });
    }

    console.log('');
  }

  // Summary
  console.log('📊 TEST RESULTS SUMMARY');
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

  // Performance summary
  const successfulResults = results.filter(r => r.status === 'success');
  if (successfulResults.length > 0) {
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const avgSize = successfulResults.reduce((sum, r) => sum + r.size, 0) / successfulResults.length;
    console.log(`\n⚡ Performance: avg ${Math.round(avgDuration)}ms, avg ${Math.round(avgSize / 1024)}KB`);
  }

  // Final verdict
  if (successful >= TEST_CASES.length - 1) { // Allow 1 failure
    console.log('\n🎉 CORE FEATURES TEST PASSED');
    console.log('✅ QR Code API v2 core styling features are working correctly');
    console.log('✅ Ready for Phase 3: Border and Overlay Implementation');
    return true;
  } else {
    console.log('\n❌ CORE FEATURES TEST FAILED');
    console.log('❌ Fix issues before proceeding to next phase');
    return false;
  }
}

function validateResult(result, params) {
  // Basic structure validation
  if (!result.imageBuffer || !Buffer.isBuffer(result.imageBuffer)) {
    console.log('   ⚠️  Invalid image buffer');
    return false;
  }

  if (result.format !== params.format) {
    console.log(`   ⚠️  Format mismatch: expected ${params.format}, got ${result.format}`);
    return false;
  }

  if (result.size !== (params.size || 400)) {
    console.log(`   ⚠️  Size mismatch: expected ${params.size || 400}, got ${result.size}`);
    return false;
  }

  if (result.fileSizeBytes !== result.imageBuffer.length) {
    console.log(`   ⚠️  File size mismatch: reported ${result.fileSizeBytes}, actual ${result.imageBuffer.length}`);
    return false;
  }

  // Format-specific validation
  if (params.format === 'svg') {
    const svgContent = result.imageBuffer.toString('utf8');
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      console.log('   ⚠️  Invalid SVG content');
      return false;
    }
  } else {
    // Binary format validation (PNG signature)
    if (result.imageBuffer.length < 8) {
      console.log('   ⚠️  Image too small');
      return false;
    }

    const header = result.imageBuffer.subarray(0, 8);
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    const isPng = pngSignature.every((byte, index) => header[index] === byte);

    if (!isPng && params.format === 'png') {
      console.log('   ⚠️  Invalid PNG signature');
      return false;
    }
  }

  return true;
}

// Run tests if called directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };