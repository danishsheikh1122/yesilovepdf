#!/bin/bash

# Quick script to add PDF tracking to the remaining components
# This will add the import and basic tracking to all PDF tool components

echo "Adding PDF tracking to remaining components..."

# List of component files to update
COMPONENTS=(
  "SimplePdfEditor.tsx"
  "PdfEditorAdvanced.tsx"
  "BrowserPdfEditor.tsx"
  "PdfUtilsDemo.tsx"
)

for component in "${COMPONENTS[@]}"; do
  file="components/$component"
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add import if not already present
    if ! grep -q "pdfTracking" "$file"; then
      # Find the last import line and add after it
      sed -i '' '/^import.*from/a\
import { pdfTrackers } from '\''@/lib/pdfTracking'\'';
' "$file"
    fi
    
    echo "Added tracking import to $file"
  else
    echo "File $file not found, skipping..."
  fi
done

echo "Tracking imports added to all components!"
echo ""
echo "Next steps:"
echo "1. Manually add tracking calls after successful operations"
echo "2. Use: await pdfTrackers.compress(file) // for compression"
echo "3. Use: await pdfTrackers.merge([file1, file2]) // for merging"
echo "4. Use: await pdfTrackers.convertToJpg(file) // for conversions"
echo "5. Use: await pdfTrackers.edit(file) // for editing"