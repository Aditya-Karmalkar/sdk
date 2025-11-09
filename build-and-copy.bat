@echo off
echo 🔨 Building SDK...
pnpm run build

echo 📁 Copying files to public folder...
copy dist\mapify.js public\mapify.js
copy dist\mapify.min.js public\mapify.min.js

echo ✅ Ready for deployment!
