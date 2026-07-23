#!/bin/bash

# Find the archive
ARCHIVE_PATH=$(find ~/Library/Developer/Xcode/Archives -name "*.xcarchive" -type d -maxdepth 1 -mtime -1 | head -1)

if [ -z "$ARCHIVE_PATH" ]; then
    echo "No archive found in the last day"
    exit 1
fi

echo "📁 Found archive: $ARCHIVE_PATH"

# Check if Hermes dSYM exists
HERMES_DSYM="$ARCHIVE_PATH/dSYMs/hermes.framework.dSYM"

if [ -d "$HERMES_DSYM" ]; then
    echo "✅ Hermes dSYM found: $HERMES_DSYM"
else
    echo "❌ Hermes dSYM not found, generating..."
    # Try to generate dSYM from the archive
    find "$ARCHIVE_PATH" -name "hermes.framework" -exec dsymutil -o "$HERMES_DSYM" {} \;
fi

echo "📦 dSYMs in archive:"
ls -la "$ARCHIVE_PATH/dSYMs/"
