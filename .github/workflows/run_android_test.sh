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

# If app exited, check for abnormal exit
if [ "$APP_EXITED" = true ]; then
  echo "Checking exit status..."
  sleep 2  # Wait for system to flush logs
  
  # Check if app sent SIGKILL signal (normal exit pattern)
  # Normal exit: app calls Process.killProcess() which sends SIG: 9
  NORMAL_EXIT_SIGNAL=$(grep "Sending signal.*PID.*SIG: 9" logcat.txt | grep -v grep || true)
  
  # Check Zygote exit code (non-zero means abnormal)
  # Format: "Process <pid> exited cleanly (<exit_code>)"
  ZYGOTE_EXIT=$(grep "Zygote.*Process.*exited" logcat.txt | tail -1 || true)
  
  if [ -n "$ZYGOTE_EXIT" ]; then
    # Extract exit code from Zygote message
    EXIT_CODE=$(echo "$ZYGOTE_EXIT" | sed -n 's/.*exited cleanly (\([0-9]*\)).*/\1/p')
    echo "Process exit code: $EXIT_CODE"
    
    # Exit code 0 = normal, non-zero = abnormal
    if [ -n "$EXIT_CODE" ] && [ "$EXIT_CODE" != "0" ]; then
      echo "=========================================="
      echo "ERROR: App exited abnormally!"
      echo "Exit code: $EXIT_CODE (non-zero indicates error)"
      echo "=========================================="
      
      # Show relevant crash logs
      echo ""
      echo "Recent activity before crash:"
      grep -B 5 "Process com.tencent.puerts_test.*has died" logcat.txt | tail -20 || true
      echo ""
      
      exit 1
    fi
  fi
  
  # Additional check: if no normal exit signal found, it might be abnormal
  if [ -z "$NORMAL_EXIT_SIGNAL" ]; then
    echo "Warning: No normal exit signal (SIG: 9) detected"
    
    # Check for "has died" message which indicates unexpected termination
    HAS_DIED=$(grep "ActivityManager.*Process com.tencent.puerts_test.*has died" logcat.txt || true)
    
    if [ -n "$HAS_DIED" ]; then
      # Check if it was preceded by a normal signal
      DIED_CONTEXT=$(grep -B 3 "Process com.tencent.puerts_test.*has died" logcat.txt | tail -4)
      
      # If no "Sending signal" in the context, it's abnormal
      if ! echo "$DIED_CONTEXT" | grep -q "Sending signal"; then
        echo "=========================================="
        echo "ERROR: App died unexpectedly without sending exit signal!"
        echo "=========================================="
        echo ""
        echo "Context around process death:"
        echo "$DIED_CONTEXT"
        echo ""
        exit 1
      fi
    fi
  fi
  
  echo "App exited normally (exit code 0 or normal signal detected)"
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
