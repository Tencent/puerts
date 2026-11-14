#!/bin/bash
set -e

echo "==========================================="
echo "Checking emulator readiness..."
echo "==========================================="

# Wait for device to be connected
echo "Waiting for device connection..."
adb wait-for-device
echo "Device connected"

# Wait for boot to complete (using POSIX-compatible syntax)
echo "Waiting for boot to complete..."
BOOT_COMPLETED=""
COUNTER=0
while [ -z "$BOOT_COMPLETED" ] && [ $COUNTER -lt 120 ]; do
  BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  if [ -z "$BOOT_COMPLETED" ]; then
    if [ $((COUNTER % 10)) -eq 0 ]; then
      echo "Still waiting for boot... ($COUNTER/120)"
    fi
    sleep 2
    COUNTER=$((COUNTER + 1))
  fi
done

if [ -z "$BOOT_COMPLETED" ]; then
  echo "ERROR: Emulator boot did not complete in time (waited 240 seconds)"
  exit 1
fi
echo "Boot completed successfully"

# Wait for package manager to be ready
echo "Verifying package manager..."
PM_READY=false
for i in 1 2 3 4 5; do
  if adb shell pm list packages > /dev/null 2>&1; then
    PM_READY=true
    break
  fi
  echo "Package manager not ready, retrying ($i/5)..."
  sleep 2
done

if [ "$PM_READY" = false ]; then
  echo "ERROR: Package manager is not ready"
  exit 1
fi
echo "Package manager ready"

# Give system services extra time to stabilize (GPU, OpenGL, etc.)
echo "Waiting for system services to stabilize..."
sleep 10

# Check available memory
MEM_AVAILABLE=$(adb shell cat /proc/meminfo | grep MemAvailable | awk '{print $2}')
echo "Available memory: ${MEM_AVAILABLE}KB"

# Check if we have enough memory (at least 500MB)
if [ -n "$MEM_AVAILABLE" ] && [ "$MEM_AVAILABLE" -lt 512000 ]; then
  echo "WARNING: Low memory available (${MEM_AVAILABLE}KB < 500MB)"
fi

echo "==========================================="
echo "Emulator is ready, starting test..."
echo "==========================================="
echo ""

adb shell setprop log.tag.linker DEBUG

# The apk is arm64-v8a only; on an x86_64 emulator it relies on ARM translation (API 30+ images)
ABI_LIST=$(adb shell getprop ro.product.cpu.abilist | tr -d '\r')
echo "Device ABI list: $ABI_LIST"
echo "Native bridge: $(adb shell getprop ro.dalvik.vm.native.bridge | tr -d '\r')"
case ",$ABI_LIST," in
  *,arm64-v8a,*) ;;
  *) echo "ERROR: device does not support arm64-v8a (no ARM translation in this system image)"; exit 1 ;;
esac

echo "Installing APK..."
adb install -r puerts_test.apk

echo "Clearing logcat..."
adb logcat -c
adb shell logcat -G 16M
adb shell setprop log.tag.Unity I
adb shell setprop log.tag.TestRunner I

# Start capturing before launching so that early startup logs are never missed
echo "Starting logcat capture..."
adb logcat -v time > logcat.txt &
LOGCAT_BG_PID=$!

echo "Starting app..."
adb shell am start -n com.tencent.puerts_test/com.unity3d.player.UnityPlayerActivity

echo "Waiting for app to start..."
COUNTER=0
PID=""
while [ $COUNTER -lt 60 ]; do
  # Android 8+ `ps` only lists the shell user's processes, use pidof instead
  PID=$(adb shell pidof com.tencent.puerts_test 2>/dev/null | tr -d '\r')
  if [ -n "$PID" ]; then
    echo "App PID: $PID"
    echo "App started in $COUNTER seconds"
    break
  fi
  sleep 1
  COUNTER=$((COUNTER + 1))
done

if [ -z "$PID" ]; then
  echo "App did not start in time (waited $COUNTER seconds)"
  kill $LOGCAT_BG_PID || true
  exit 1
fi

echo "Waiting for app to complete (timeout: 1200s, arm64 runs under ARM translation)..."
TIMEOUT=1200
ELAPSED=0
APP_EXITED=false
while [ $ELAPSED -lt $TIMEOUT ]; do
  # Check if process still exists
  PS_CHECK=$(adb shell pidof com.tencent.puerts_test 2>/dev/null | tr -d '\r')
  if [ -z "$PS_CHECK" ]; then
    echo "App exited after $ELAPSED seconds"
    APP_EXITED=true
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED+2))
done

# Double check if app is still running
PS_FINAL=$(adb shell pidof com.tencent.puerts_test 2>/dev/null | tr -d '\r')
if [ -n "$PS_FINAL" ]; then
  echo "App did not exit in time, killing..."
  adb shell am force-stop com.tencent.puerts_test
  exit 1
fi

# If app exited, check for abnormal exit
dump_crash_info() {
  echo ""
  echo "---------- Fatal / crash lines ----------"
  grep -E "Fatal signal|F DEBUG|F/DEBUG|E/AndroidRuntime|E/CRASH|FATAL EXCEPTION|signal [0-9]+ \(SIG|Abort message|backtrace:| #[0-9]+ pc " logcat.txt | head -150 || true
  echo ""
  echo "---------- Last 150 log lines of app pid $PID ----------"
  grep -E "\( *$PID\)" logcat.txt | tail -150 || true
  echo "-----------------------------------------"
  dump_exit_info
}

# Android 11+ records why each process died (reason / signal / description), even for a silent self-kill
dump_exit_info() {
  echo ""
  echo "---------- ApplicationExitInfo ----------"
  adb shell dumpsys activity exit-info com.tencent.puerts_test 2>/dev/null | head -60 || true
  echo "-----------------------------------------"
}

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
      dump_crash_info
      
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
        dump_crash_info
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

# No test case result at all means the app quit before running the tests
if [ "$PASSED_COUNT" -eq 0 ] && [ "$FAILED_COUNT" -eq 0 ]; then
  echo "ERROR: no test case result found in logcat, the app exited before running tests"
  dump_crash_info
  exit 1
fi

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
