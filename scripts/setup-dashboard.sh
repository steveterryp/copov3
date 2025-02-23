#!/bin/bash

# Build TypeScript files
echo "Building TypeScript files..."
npm run build

# Run the dashboard data generator
echo "Creating dashboard test data..."
node build/scripts/create-dashboard-data.js

echo "Dashboard setup complete!"
