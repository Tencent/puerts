#!/bin/bash
set -e

echo "Installing APK..."
adb install -r puerts_test.apk

echo "Clearing logcat..."
adb logcat -c
adb shell logcat -G 16M
adb shell setprop log.tag.Unity I
adb shell setprop log.tag.TestRunner I

echo "Starting app..."
adb shell am start -n com.tencent.puerts_test/com.unity3d.player.UnityPlayerActivity

echo "Waiting for app to start..."
COUNTER=0
while [ $COUNTER -lt 60 ]; do
  PS_LINE=$(adb shell "ps | grep com.tencent.puerts_test | grep -v grep" | tr -d '\r')
  if [ -n "$PS_LINE" ]; then
    # Extract PID (second column) using sed
    PID=$(echo "$PS_LINE" | sed 's/^[^ ]* *\([^ ]*\).*/\1/')
    echo "App PID: $PID"
    echo "App started in $COUNTER seconds"
    break
  fi
  sleep 1
  COUNTER=$((COUNTER + 1))
done

if [ -z "$PID" ]; then
  echo "App did not start in time (waited $COUNTER seconds)"
  exit 1
fi

echo "Starting logcat capture..."
adb logcat -v time > logcat.txt &
LOGCAT_BG_PID=$!

echo "Waiting for app to complete (timeout: 300s)..."
TIMEOUT=300
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if ! adb shell "ps | grep com.tencent.puerts_test | grep -v grep" > /dev/null 2>&1; then
    echo "App exited"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED+2))
done

if adb shell "ps | grep com.tencent.puerts_test | grep -v grep" > /dev/null 2>&1; then
  echo "App did not exit in time, killing..."
  adb shell am force-stop com.tencent.puerts_test
fi

echo "Stopping logcat capture..."
kill $LOGCAT_BG_PID || true
sleep 1

echo "Analyzing test results..."

# Count passed and failed test cases
PASSED_COUNT=$(grep -c "Passed: TestCase" logcat.txt || true)
FAILED_COUNT=$(grep -c "Failed: TestCase" logcat.txt || true)

echo "=========================================="
echo "Test Results Summary:"
echo "Passed: $PASSED_COUNT"
echo "Failed: $FAILED_COUNT"
echo "=========================================="

# Print failed test cases if any
if [ $FAILED_COUNT -gt 0 ]; then
  echo ""
  echo "Failed Test Cases:"
  grep "Failed: TestCase" logcat.txt || true
  echo ""
  echo "Test execution failed with $FAILED_COUNT failed test case(s)"
  exit 1
fi

echo "Test completed successfully"
