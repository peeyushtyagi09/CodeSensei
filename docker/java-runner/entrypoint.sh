#!/usr/bin/env bash
# compile Main.java and run
if [ -f /sandbox/Main.java ]; then
  javac /sandbox/Main.java 2> /sandbox/compile_err
  if [ $? -ne 0 ]; then
    cat /sandbox/compile_err >&2
    exit 1
  fi
  java -cp /sandbox Main
else
  echo "No Main.java" >&2
  exit 1
fi
