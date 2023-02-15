#!/bin/bash
echo "Start tests"
deno test  --allow-all --unstable --trace-ops 
echo "End test"