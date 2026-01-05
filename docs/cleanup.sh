#!/bin/bash

# ColdEmailCrafter Cleanup Script
# Run this in your project root before migration

set -e

echo "🧹 Cleaning up Replit files from ColdEmailCrafter..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMOVED=0

remove_if_exists() {
    if [ -e "$1" ]; then
        rm -rf "$1"
        echo -e "  ${GREEN}✓${NC} Removed: $1"
        REMOVED=$((REMOVED + 1))
    fi
}

# Remove Replit-specific files
echo "Removing Replit files..."
remove_if_exists ".replit"
remove_if_exists "replit.nix"
remove_if_exists ".upm"
remove_if_exists ".cache"
remove_if_exists ".config"
remove_if_exists ".local"
remove_if_exists ".breakpoints"
remove_if_exists "attached_assets"

# Remove unused database files (not used in routes)
echo ""
echo "Removing unused database files..."
remove_if_exists "db"
remove_if_exists "drizzle.config.ts"
remove_if_exists "migrations"

# Remove theme.json if it exists (Replit shadcn theme)
remove_if_exists "theme.json"

echo ""
echo -e "Removed ${GREEN}$REMOVED${NC} items"
echo ""

# Remove Replit packages
echo -e "${YELLOW}Removing Replit npm packages...${NC}"
npm uninstall @replit/vite-plugin-shadcn-theme-json @replit/vite-plugin-runtime-error-modal 2>/dev/null || true

# Remove unused packages (database/auth not used in routes)
echo -e "${YELLOW}Removing unused npm packages...${NC}"
npm uninstall drizzle-orm drizzle-zod drizzle-kit 2>/dev/null || true
npm uninstall passport passport-local express-session memorystore ws 2>/dev/null || true
npm uninstall @types/passport @types/passport-local @types/express-session @types/ws 2>/dev/null || true

# Add security packages
echo ""
echo -e "${YELLOW}Adding security packages...${NC}"
npm install helmet cors express-rate-limit
npm install -D @types/cors

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Cleanup complete! Next steps:"
echo ""
echo "  1. Replace server/index.ts with the new version"
echo "  2. Replace vite.config.ts with the new version"
echo "  3. Add the Dockerfile"
echo "  4. Update package.json scripts if needed"
echo "  5. Test locally: npm run dev"
echo "  6. Deploy to Railway"
echo ""
