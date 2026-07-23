#!/bin/bash

# Find and patch the Time.h file
find ios/Pods -name "Time.h" -path "*/folly/portability/*" | while read file; do
  echo "Patching: $file"
  # Comment out the clockid_t typedef
  sed -i '' 's/typedef uint8_t clockid_t;/\/\/ typedef uint8_t clockid_t;/g' "$file"
done

echo "✅ Folly Time.h patched!"
