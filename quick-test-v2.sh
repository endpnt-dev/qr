#!/bin/bash

echo "🧪 Quick QR v2 API Test"
echo "======================"

# Set up test API key in environment for this session
export API_KEYS='{"ek_test_12345": {"tier": "free", "name": "Test Key"}}'

echo "✅ Test environment configured"
echo ""

# Test if server is responsive
echo "🔍 Testing server health..."
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Server is running and responsive"
else
    echo "❌ Server not responding - is the dev server running?"
    echo "💡 Start with: npm run dev"
    exit 1
fi

echo ""

# Quick v2 test - basic backwards compatibility
echo "🔍 Testing v2 basic functionality..."
response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: ek_test_12345" \
  -d '{
    "data": "https://endpnt.dev",
    "size": 200,
    "format": "png"
  }' 2>/dev/null)

# Extract HTTP status code (last 3 characters)
status_code="${response: -3}"
response_body="${response%???}"

echo "📊 HTTP Status: $status_code"

if [ "$status_code" = "200" ]; then
    echo "✅ v2 endpoint is working!"
    echo "📄 Response preview:"
    echo "$response_body" | sed 's/"image":"[^"]*"/"image":"[BASE64_TRUNCATED]"/g' | head -5

    # Check if it's actually generating QR codes
    if echo "$response_body" | grep -q '"success":true' && echo "$response_body" | grep -q '"image":'; then
        echo "✅ QR code generation successful!"
        echo "✅ Base64 image data present in response"
    else
        echo "⚠️  Response format unexpected"
    fi
else
    echo "❌ v2 endpoint returned error status: $status_code"
    echo "📄 Error details:"
    echo "$response_body" | head -10
fi

echo ""
echo "📋 Test Summary:"
echo "==============="
if [ "$status_code" = "200" ]; then
    echo "🎉 QR Code API v2 is WORKING!"
    echo "✅ Core functionality operational"
    echo "✅ Ready for full feature testing"
else
    echo "🔧 v2 endpoint needs fixes"
    echo "💡 Check server logs for details"
fi