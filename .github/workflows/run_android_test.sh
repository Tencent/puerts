#!/bin/bash
set -e

adb shell setprop log.tag.linker DEBUG

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
APP_EXITED=false
while [ $ELAPSED -lt $TIMEOUT ]; do
  # Check if process still exists by looking for the PID
  PS_CHECK=$(adb shell "ps | grep com.tencent.puerts_test | grep -v grep" | tr -d '\r')
  if [ -z "$PS_CHECK" ]; then
    echo "App exited after $ELAPSED seconds"
    APP_EXITED=true
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED+2))
done

# Double check if app is still running
PS_FINAL=$(adb shell "ps | grep com.tencent.puerts_test | grep -v grep" | tr -d '\r')
if [ -n "$PS_FINAL" ]; then
  echo "App did not exit in time, killing..."
  adb shell am force-stop com.tencent.puerts_test
  exit 1
fi

# If app exited, check for crashes using system services
if [ "$APP_EXITED" = true ]; then
  echo "Checking for crash records..."
  sleep 2  # Wait for system to record crash info
  
  # Method 1: Check dropbox for crash records (most reliable)
  CRASH_RECORDS=$(adb shell dumpsys dropbox --print | grep -A 5 "com.tencent.puerts_test" | grep -E "crash|native_crash|anr" || true)
  
  # Method 2: Check if app is in crashed state
  APP_ERROR=$(adb shell dumpsys activity processes | grep -A 20 "com.tencent.puerts_test" | grep -E "crashing=true|notResponding=true" || true)
  
  # Method 3: Check exit reason via ActivityManager
  EXIT_INFO=$(adb shell dumpsys activity exit-info com.tencent.puerts_test 2>/dev/null || true)
  ABNORMAL_EXIT=$(echo "$EXIT_INFO" | grep -E "reason: (CRASH|CRASH_NATIVE|ANR|SIGNALED)" || true)
  
  if [ -n "$CRASH_RECORDS" ] || [ -n "$APP_ERROR" ] || [ -n "$ABNORMAL_EXIT" ]; then
    echo "=========================================="
    echo "ERROR: App crashed or exited abnormally!"
    echo "=========================================="
    
    if [ -n "$CRASH_RECORDS" ]; then
      echo "Crash records found in dropbox:"
      echo "$CRASH_RECORDS"
    fi
    
    if [ -n "$APP_ERROR" ]; then
      echo "App error state:"
      echo "$APP_ERROR"
    fi
    
    if [ -n "$ABNORMAL_EXIT" ]; then
      echo "Abnormal exit info:"
      echo "$ABNORMAL_EXIT"
    fi
    
    echo "=========================================="
    exit 1
  fi
  
  echo "No crash detected, app exited normally"
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
