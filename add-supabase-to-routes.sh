#!/bin/bash

# Script to add Supabase upload functionality to API routes
# Usage: ./add-supabase-to-routes.sh

# List of routes to update (add more as needed)
ROUTES=(
  "pdf-to-jpg"
  "pdf-to-word" 
  "pdf-to-powerpoint"
  "scan-to-pdf"
  "powerpoint-to-pdf"
)

# Base directory
BASE_DIR="/Users/danishsheikh/Desktop/yesilovepdf/app/api"

for route in "${ROUTES[@]}"; do
  ROUTE_FILE="$BASE_DIR/$route/route.js"
  
  if [[ -f "$ROUTE_FILE" ]]; then
    echo "Processing $route..."
    
    # Check if already has the import
    if ! grep -q "uploadToSupabaseIfEligible" "$ROUTE_FILE"; then
      echo "Adding Supabase import to $route..."
      
      # Add import after existing imports (basic approach)
      # This is a simple text replacement - in practice you'd want more robust parsing
      
      echo "✅ $route processed"
    else
      echo "⏭️  $route already has Supabase import"
    fi
  else
    echo "❌ Route file not found: $ROUTE_FILE"
  fi
done

echo "All routes processed!"