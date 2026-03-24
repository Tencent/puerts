var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/editor-assistant/builtins/screenshot.mts
var DEFAULT_WIDTH = 512;
var DEFAULT_HEIGHT = 512;
var MIN_WIDTH = 64;
var MAX_WIDTH = 1920;
var MIN_HEIGHT = 64;
var MAX_HEIGHT = 1080;
var summary = `**screenshot** \u2014 Capture Unity game view and scene view screenshots for visual analysis. Read \`.description\` to see available functions and their signatures.`;
var description = `
- **\`captureScreenshot(maxWidth?, maxHeight?)\`** \u2014 Capture the Unity Game view.
  - \`maxWidth\` (number, default ${DEFAULT_WIDTH}): Maximum width in pixels (${MIN_WIDTH}-${MAX_WIDTH}).
  - \`maxHeight\` (number, default ${DEFAULT_HEIGHT}): Maximum height in pixels (${MIN_HEIGHT}-${MAX_HEIGHT}).
  - Returns a result object. On success the image is automatically sent to you for visual analysis.

- **\`captureSceneView(maxWidth?, maxHeight?)\`** \u2014 Capture the Unity Scene view (Editor only).
  - \`maxWidth\` (number, default ${DEFAULT_WIDTH}): Maximum width in pixels (${MIN_WIDTH}-${MAX_WIDTH}).
  - \`maxHeight\` (number, default ${DEFAULT_HEIGHT}): Maximum height in pixels (${MIN_HEIGHT}-${MAX_HEIGHT}).
  - Returns a result object. On success the image is automatically sent to you for visual analysis.

**Note**: The captured image is automatically included as visual content in the tool response.
You do NOT need to process the base64 data yourself \u2014 just call the function and you will see the screenshot.
`.trim();
async function captureScreenshot(maxWidth = DEFAULT_WIDTH, maxHeight = DEFAULT_HEIGHT) {
  validateDimensions(maxWidth, maxHeight, "captureScreenshot");
  const resultJson = await new Promise((resolve, reject) => {
    try {
      CS.LLMAgent.ScreenCaptureBridge.CaptureScreenAsync(
        maxWidth,
        maxHeight,
        (json) => resolve(json)
      );
    } catch (error) {
      reject(error);
    }
  });
  const result = JSON.parse(resultJson);
  if (!result.success) {
    return {
      success: false,
      message: `Screenshot capture failed: ${result.error || "Unknown error"}`
    };
  }
  return {
    success: true,
    message: `Game view screenshot captured successfully (${result.width}x${result.height}).`,
    __image: {
      base64: result.base64,
      mediaType: "image/png"
    }
  };
}
__name(captureScreenshot, "captureScreenshot");
async function captureSceneView(maxWidth = DEFAULT_WIDTH, maxHeight = DEFAULT_HEIGHT) {
  validateDimensions(maxWidth, maxHeight, "captureSceneView");
  const resultJson = await new Promise((resolve, reject) => {
    try {
      CS.LLMAgent.ScreenCaptureBridge.CaptureSceneViewAsync(
        maxWidth,
        maxHeight,
        (json) => resolve(json)
      );
    } catch (error) {
      reject(error);
    }
  });
  const result = JSON.parse(resultJson);
  if (!result.success) {
    return {
      success: false,
      message: `Scene view capture failed: ${result.error || "Unknown error"}`
    };
  }
  return {
    success: true,
    message: `Scene view screenshot captured successfully (${result.width}x${result.height}).`,
    __image: {
      base64: result.base64,
      mediaType: "image/png"
    }
  };
}
__name(captureSceneView, "captureSceneView");
function validateDimensions(maxWidth, maxHeight, funcName) {
  if (typeof maxWidth !== "number" || !Number.isInteger(maxWidth) || maxWidth < MIN_WIDTH || maxWidth > MAX_WIDTH) {
    throw new Error(`${funcName}: 'maxWidth' must be an integer between ${MIN_WIDTH} and ${MAX_WIDTH} (got ${JSON.stringify(maxWidth)}). Read module.description for usage.`);
  }
  if (typeof maxHeight !== "number" || !Number.isInteger(maxHeight) || maxHeight < MIN_HEIGHT || maxHeight > MAX_HEIGHT) {
    throw new Error(`${funcName}: 'maxHeight' must be an integer between ${MIN_HEIGHT} and ${MAX_HEIGHT} (got ${JSON.stringify(maxHeight)}). Read module.description for usage.`);
  }
}
__name(validateDimensions, "validateDimensions");
export {
  captureSceneView,
  captureScreenshot,
  description,
  summary
};
