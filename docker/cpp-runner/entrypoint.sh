#!/usr/bin/env bash
# compile main.cpp into /sandbox/a.out then run it
if [ -f /sandbox/main.cpp ]; then
  g++ /sandbox/main.cpp -O2 -std=gnu++17 -o /sandbox/a.out 2> /sandbox/compile_err
  if [ $? -ne 0 ]; then
    cat /sandbox/compile_err >&2
    exit 1
  fi
  /sandbox/a.out
else
  echo "No main.cpp" >&2
  exit 1
fi
