#!/bin/bash

echo "🔍 === DEBUGGING BLANK WEBSITE ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project directory. Please run from /var/www/keuangan/keuangan-personal"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

echo "🔧 1. Checking PM2 status..."
pm2 status
echo ""

echo "🔧 2. Checking if port 3000 is listening..."
netstat -tlnp | grep :3000
echo ""

echo "🔧 3. Testing direct connection to localhost:3000..."
curl -I http://localhost:3000
echo ""

echo "🔧 4. Checking dist directory contents..."
ls -la dist/
echo ""

echo "🔧 5. Checking if index.html exists and has content..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html exists"
    echo "📄 File size: $(wc -c < dist/index.html) bytes"
    echo "📄 First 10 lines:"
    head -10 dist/index.html
else
    echo "❌ index.html not found in dist/"
fi
echo ""

echo "🔧 6. Checking if CSS and JS files exist..."
echo "CSS files:"
ls -la dist/assets/*.css 2>/dev/null || echo "❌ No CSS files found"
echo "JS files:"
ls -la dist/assets/*.js 2>/dev/null || echo "❌ No JS files found"
echo ""

echo "🔧 7. Testing actual response from server..."
echo "Response body (first 20 lines):"
curl -s http://localhost:3000 | head -20
echo ""

echo "🔧 8. Checking server logs..."
echo "PM2 logs (last 10 lines):"
pm2 logs akuntansi-keuangan --lines 10 --nostream
echo ""

echo "🔧 9. Checking Nginx logs..."
echo "Nginx error log (last 5 lines):"
sudo tail -5 /var/log/nginx/keuangan99.error.log 2>/dev/null || echo "❌ Cannot read Nginx error log"
echo ""

echo "🔧 10. Testing from external (via Nginx)..."
echo "Testing https://keuangan99.com response:"
curl -I https://keuangan99.com 2>/dev/null || echo "❌ Cannot connect to external URL"
echo ""

echo "🎯 === DIAGNOSIS COMPLETE ==="
echo ""
echo "💡 Common causes of blank white page:"
echo "   1. JavaScript errors (check browser console)"
echo "   2. Missing or corrupted build files"
echo "   3. Incorrect file paths in index.html"
echo "   4. Server not serving files correctly"
echo "   5. CSP (Content Security Policy) blocking resources"
echo ""
echo "🔧 Next steps:"
echo "   1. Check browser console (F12) for JavaScript errors"
echo "   2. Check Network tab for failed resource loads"
echo "   3. Rebuild application if files are missing"
echo "   4. Restart server if needed"