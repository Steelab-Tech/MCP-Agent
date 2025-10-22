#!/bin/bash
set -e

echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist

echo "Bundling BrandList..."
npx @fractal-mcp/cli bundle --entrypoint=./ui/BrandList.tsx --out=./dist/temp-brand
mv dist/temp-brand/index.html dist/BrandList.html
rm -rf dist/temp-brand

echo "Bundling ProductList..."
npx @fractal-mcp/cli bundle --entrypoint=./ui/ProductList.tsx --out=./dist/temp-product-list
mv dist/temp-product-list/index.html dist/ProductList.html
rm -rf dist/temp-product-list

echo "Bundling ProductDetail..."
npx @fractal-mcp/cli bundle --entrypoint=./ui/ProductDetail.tsx --out=./dist/temp-product-detail
mv dist/temp-product-detail/index.html dist/ProductDetail.html
rm -rf dist/temp-product-detail

echo "Bundling LeadForm..."
npx @fractal-mcp/cli bundle --entrypoint=./ui/LeadForm.tsx --out=./dist/temp-lead
mv dist/temp-lead/index.html dist/LeadForm.html
rm -rf dist/temp-lead

echo "✅ All widgets bundled successfully!"
ls -lh dist/*.html
