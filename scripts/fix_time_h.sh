#!/bin/bash
# Fix the clockid_t redefinition error in Time.h - Archive safe version

echo "🔍 Looking for Time.h..."

# Search in all possible locations
TIME_H=$(find "${SRCROOT}/ios/Pods/Headers/Private/RCT-Folly/folly/portability" -name "Time.h" 2>/dev/null | head -1)

if [ -z "$TIME_H" ]; then
    # Try alternative path
    TIME_H=$(find "${SRCROOT}/Pods/Headers/Private/RCT-Folly/folly/portability" -name "Time.h" 2>/dev/null | head -1)
fi

if [ -z "$TIME_H" ]; then
    # Try from current directory
    TIME_H=$(find . -name "Time.h" -path "*/RCT-Folly/folly/portability/*" 2>/dev/null | head -1)
fi

if [ -n "$TIME_H" ]; then
    echo "📝 Found Time.h at: $TIME_H"
    
    # Check if the fix is already applied
    if grep -q "// typedef uint8_t clockid_t;" "$TIME_H"; then
        echo "✅ Time.h already fixed"
    else
        # Apply the fix
        sed -i '' 's/typedef uint8_t clockid_t;/\/\/ typedef uint8_t clockid_t;/g' "$TIME_H"
        echo "✅ Fixed Time.h"
    fi
else
    echo "⚠️ Time.h not found - skipping fix"
fi
