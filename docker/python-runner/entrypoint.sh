#!/usr/bin/env bash
# Run the user python file named main.py in /sandbox
# Provide a simple timeout (process killed by docker)
if [ -f /sandbox/main.py ]; then
  python3 /sandbox/main.py
else
  echo "No main.py" >&2
  exit 1
fi
