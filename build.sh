#!/bin/bash

# Exit on error
set -e

# Install dependencies without using frozen lockfile
echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

# Build the application
echo "Building Next.js application..."
pnpm run build

echo "Build completed successfully!"
