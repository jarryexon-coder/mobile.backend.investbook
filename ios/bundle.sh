#!/bin/bash
set -e

export NODE_BINARY=node
export ENTRY_FILE=index.js

echo "📦 Bundling JavaScript..."
echo "Entry file: $ENTRY_FILE"
echo "Project root: $PROJECT_ROOT"

# Run the React Native bundler
"$NODE_BINARY" ../node_modules/react-native/scripts/react-native-xcode.sh
