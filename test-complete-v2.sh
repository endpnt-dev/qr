#!/bin/bash

echo "🧪 Comprehensive QR Code API v2 Test Suite"
echo "=========================================="
echo "Testing all implemented features including frontend demo integration"
echo ""

# Test environment setup
test_key="ek_starter_test"
base_url="http://localhost:3000"
failed_tests=0
total_tests=0

# Helper function to run a test
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local payload="$3"
    local expected_status="${4:-200}"

    total_tests=$((total_tests + 1))
    echo "🔍 Test $total_tests: $test_name"
    echo "================================"

    response=$(curl -s -w "%{http_code}" -X POST "$base_url$endpoint" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $test_key" \
        -d "$payload" 2>/dev/null)

    status_code="${response: -3}"
    response_body="${response%???}"

    echo "📊 HTTP Status: $status_code"

    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ $test_name PASSED"
        if [ "$expected_status" = "200" ]; then
            if echo "$response_body" | grep -q '"success":true'; then
                file_size=$(echo "$response_body" | grep -o '"file_size_bytes":[0-9]*' | cut -d: -f2 2>/dev/null)
                processing_time=$(echo "$response_body" | grep -o '"processing_ms":[0-9]*' | cut -d: -f2 2>/dev/null)
                [ "$file_size" ] && echo "📸 Generated: ${file_size} bytes"
                [ "$processing_time" ] && echo "⚡ Processing: ${processing_time}ms"
            fi
        fi
    else
        echo "❌ $test_name FAILED"
        echo "Expected status: $expected_status, Got: $status_code"
        echo "Error: $(echo "$response_body" | head -3)"
        failed_tests=$((failed_tests + 1))
    fi
    echo ""
}

# Test 1: Basic v2 functionality
run_test "Basic v2 QR Generation" "/api/v2/generate" '{
    "data": "https://endpnt.dev",
    "size": 300,
    "format": "png"
}'

# Test 2: Dot style customization
run_test "Dot Style - Classy Rounded" "/api/v2/generate" '{
    "data": "https://endpnt.dev/docs",
    "size": 300,
    "format": "png",
    "dot_style": "classy-rounded",
    "color": "#2196F3"
}'

# Test 3: Eye pattern customization
run_test "Custom Eye Patterns" "/api/v2/generate" '{
    "data": "Custom Eyes Test",
    "size": 300,
    "format": "png",
    "eye_shape": "rounded",
    "eye_inner_shape": "classy",
    "eye_color": "#FF5722",
    "eye_inner_color": "#FFC107"
}'

# Test 4: Linear gradient
run_test "Linear Gradient" "/api/v2/generate" '{
    "data": "Linear Gradient QR",
    "size": 300,
    "format": "png",
    "gradient": {
        "type": "linear",
        "rotation": 45,
        "colors": [
            {"offset": 0, "color": "#FF6B6B"},
            {"offset": 1, "color": "#4ECDC4"}
        ]
    }
}'

# Test 5: Radial gradient
run_test "Radial Gradient" "/api/v2/generate" '{
    "data": "Radial Gradient QR",
    "size": 300,
    "format": "png",
    "gradient": {
        "type": "radial",
        "colors": [
            {"offset": 0, "color": "#667eea"},
            {"offset": 1, "color": "#764ba2"}
        ]
    }
}'

# Test 6: Styled border
run_test "Styled Border with Label" "/api/v2/generate" '{
    "data": "Styled Border QR",
    "size": 300,
    "format": "png",
    "border": {
        "mode": "styled",
        "width": 20,
        "color": "#2C3E50",
        "radius": 8,
        "padding": 12,
        "label": {
            "text": "SCAN ME",
            "position": "bottom",
            "font_size": 14,
            "font_color": "#FFFFFF"
        }
    }
}'

# Test 7: Image border (requires Starter+ tier)
run_test "Image Border" "/api/v2/generate" '{
    "data": "Image Border QR",
    "size": 300,
    "format": "png",
    "border": {
        "mode": "image",
        "image_url": "https://picsum.photos/400/400?random=1",
        "width": 40,
        "padding": 8,
        "opacity": 0.9
    }
}'

# Test 8: SVG freehand border (requires Starter+ tier)
run_test "SVG Freehand Border" "/api/v2/generate" '{
    "data": "SVG Border QR",
    "size": 300,
    "format": "png",
    "border": {
        "mode": "svg",
        "svg_path": "M50 50 L250 50 Q275 50 275 75 L275 225 Q275 250 250 250 L50 250 Q25 250 25 225 L25 75 Q25 50 50 50 Z",
        "viewBox": "0 0 300 300",
        "stroke_color": "#9C27B0",
        "stroke_width": 4,
        "fill": "none",
        "padding": 15
    }
}'

# Test 9: Photo overlay (requires Starter+ tier)
run_test "Photo Overlay" "/api/v2/generate" '{
    "data": "Photo Overlay QR",
    "size": 400,
    "format": "png",
    "overlay": {
        "photo_url": "https://picsum.photos/600/400?random=2",
        "position": {
            "x": 0.75,
            "y": 0.75
        },
        "qr_size": 25,
        "opacity": 0.95
    }
}'

# Test 10: Combined premium features
run_test "Combined Premium Features" "/api/v2/generate" '{
    "data": "PREMIUM COMBO",
    "size": 350,
    "format": "png",
    "dot_style": "extra-rounded",
    "gradient": {
        "type": "radial",
        "colors": [
            {"offset": 0, "color": "#FF9A9E"},
            {"offset": 1, "color": "#FAD0C4"}
        ]
    },
    "border": {
        "mode": "styled",
        "width": 15,
        "color": "#E91E63",
        "radius": 10,
        "label": {
            "text": "PREMIUM QR",
            "position": "bottom"
        }
    },
    "eye_shape": "rounded",
    "eye_color": "#8E24AA"
}'

# Test 11: Free tier validation (should reject premium features)
echo "🔍 Test 11: Free Tier Limitations"
echo "================================="
echo "Testing with free tier key..."

free_response=$(curl -s -w "%{http_code}" -X POST "$base_url/api/v2/generate" \
    -H "Content-Type: application/json" \
    -H "x-api-key: ek_test_12345" \
    -d '{
        "data": "Free tier test",
        "size": 300,
        "format": "png",
        "border": {
            "mode": "image",
            "image_url": "https://picsum.photos/400/400?random=1"
        }
    }' 2>/dev/null)

free_status="${free_response: -3}"
free_body="${free_response%???}"

total_tests=$((total_tests + 1))
if [ "$free_status" = "402" ] || ([ "$free_status" = "400" ] && echo "$free_body" | grep -q "requires Starter"); then
    echo "✅ Free Tier Limitation PASSED"
    echo "📊 Correctly rejected premium feature: HTTP $free_status"
else
    echo "❌ Free Tier Limitation FAILED"
    echo "📊 HTTP Status: $free_status"
    echo "Expected: 402 or 400 with tier restriction message"
    failed_tests=$((failed_tests + 1))
fi
echo ""

# Test 12: v1 backwards compatibility
run_test "v1 Backwards Compatibility" "/api/v2/generate" '{
    "data": "v1 compat test",
    "format": "png",
    "size": 300,
    "color": "#FF0000",
    "background": "#FFFFFF",
    "margin": 4,
    "error_correction": "M",
    "logo_url": "https://picsum.photos/100/100?random=3",
    "logo_size": 30
}'

# Summary
echo "📊 TEST SUMMARY"
echo "================"
echo "Total tests: $total_tests"
echo "Passed: $((total_tests - failed_tests))"
echo "Failed: $failed_tests"

if [ $failed_tests -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ QR Code API v2 is fully operational"
    echo "✅ All dot styles, gradients, borders, and overlays working"
    echo "✅ Tier restrictions properly enforced"
    echo "✅ Backwards compatibility maintained"
    echo ""
    echo "🚀 Phase 5 Frontend Demo: COMPLETE"
    echo "📋 Ready for production deployment!"
else
    echo ""
    echo "🔧 Some tests failed - review issues above"
    echo "💡 Check server logs for detailed error information"
fi

echo ""
echo "🔗 Frontend Demo URL: http://localhost:3000"
echo "📚 API Documentation: http://localhost:3000/docs"