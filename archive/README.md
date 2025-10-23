# Archive - Old React Widgets

## Contents

This folder contains the **old React-based widget system** that has been replaced by lightweight vanilla HTML generators.

### Files Archived:

- **old-react-widgets/ui/** - React components (`.tsx` files)
  - BrandList.tsx (387KB when bundled)
  - ProductList.tsx (389KB when bundled)
  - ProductDetail.tsx (392KB when bundled)
  - LeadForm.tsx (447KB when bundled)

- **old-react-widgets/bundle-widgets.sh** - Build script for React widgets

## Why Archived?

These files were causing **severe performance issues**:
- Widget HTML files were 387-447KB (too large)
- Widget rendering took 5-10 seconds in ChatGPT
- Included entire React library inlined in HTML

## Replacement

New system uses vanilla HTML generators in `server/widgets.ts`:
- ~5KB per widget (98% smaller)
- ~200ms rendering time (25x faster)
- No external dependencies
- Built-in CSS, no React

## Rollback Instructions

If you need to restore the old React widgets:

```bash
# Restore files
mv archive/old-react-widgets/ui ./
mv archive/old-react-widgets/bundle-widgets.sh scripts/

# Update package.json build script
"build": "npm run bundle:widgets && tsc -p tsconfig.json && echo '✅ Build completed. Files:' && ls -la build/server/"

# Restore server/index.ts to use readWidgetHtml()
git checkout [commit-before-optimization] server/index.ts

# Rebuild
npm run build
```

## Recommendation

**Do NOT rollback** unless absolutely necessary. The new vanilla HTML system is:
- 98% smaller
- 25x faster
- More maintainable
- No build-time overhead

---

**Archived on**: October 23, 2025
**Commit**: 829da9f - perf: Replace 400KB React widgets with 5KB vanilla HTML generators
