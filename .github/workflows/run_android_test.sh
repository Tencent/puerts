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
  PID=$(adb shell pidof com.tencent.puerts_test | tr -d '\r')
  if [ -n "$PID" ]; then
    echo "App PID: $PID"
    break
  fi
  sleep 1
  COUNTER=$((COUNTER + 1))
done

if [ -z "$PID" ]; then
  echo "App did not start in time"
  exit 1
fi

echo "Starting logcat capture..."
adb logcat --pid=$PID -v time > logcat.txt &
LOGCAT_BG_PID=$!

echo "Waiting for app to complete (timeout: 300s)..."
TIMEOUT=300
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if ! adb shell ps -A | grep -q com.tencent.puerts_test; then
    echo "App exited"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED+2))
done

if adb shell ps -A | grep -q com.tencent.puerts_test; then
  echo "App did not exit in time, killing..."
  adb shell am force-stop com.tencent.puerts_test
fi

echo "Stopping logcat capture..."
kill $LOGCAT_BG_PID || true
sleep 1

echo "Test completed successfully"
