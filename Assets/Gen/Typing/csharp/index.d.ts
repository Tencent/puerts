   
declare module 'csharp' {
    import * as CSharp from 'csharp';
    export default CSharp;
}
declare module 'csharp' {
    interface $Ref<T> {
        value: T
    }
    namespace System {
        interface Array$1<T> extends System.Array {
            get_Item(index: number):T;
            set_Item(index: number, value: T):void;
        }
    }
    interface $Task<T> {}
        class JsMonoBehaviour extends UnityEngine.MonoBehaviour
        {
            public JSClassName : string
            public JsStart : System.Action
            public JsUpdate : System.Action
            public JsOnTriggerEnter : System.Action$1<UnityEngine.Collider>
            public constructor ()
        }
        class GameManager extends JsMonoBehaviour
        {
            public BallSpawnPoint : UnityEngine.GameObject
            public BallPrefab : UnityEngine.GameObject
            public PrescoreTrigger : UnityEngine.Collider
            public ScoredTrigger : UnityEngine.Collider
            public constructor ()
        }
        namespace UnityEngine {
        /** MonoBehaviour is the base class from which every Unity script derives. */
        class MonoBehaviour extends UnityEngine.Behaviour
        {
        }
        /** Behaviours are Components that can be enabled or disabled. */
        class Behaviour extends UnityEngine.Component
        {
        }
        /** Base class for everything attached to GameObjects. */
        class Component extends UnityEngine.Object
        {
        }
        /** Base class for all objects Unity can reference. */
        class Object extends System.Object
        {
        /** The name of the object. */
            public get name(): string;
            public set name(value: string);
            /** Should the object be hidden, saved with the Scene or modifiable by the user? */
            public get hideFlags(): UnityEngine.HideFlags;
            public set hideFlags(value: UnityEngine.HideFlags);
            public GetInstanceID () : number
            public static op_Implicit ($exists: UnityEngine.Object) : boolean
            /** Clones the object original and returns the clone.
            * @param original An existing object that you want to make a copy of.
            * @param position Position for the new object.
            * @param rotation Orientation of the new object.
            * @param parent Parent that will be assigned to the new object.
            * @param instantiateInWorldSpace When you assign a parent Object, pass true to position the new object directly in world space. Pass false to set the Object’s position relative to its new parent..
            * @returns The instantiated clone. 
            */
            public static Instantiate ($original: UnityEngine.Object, $position: UnityEngine.Vector3, $rotation: UnityEngine.Quaternion) : UnityEngine.Object
            /** Clones the object original and returns the clone.
            * @param original An existing object that you want to make a copy of.
            * @param position Position for the new object.
            * @param rotation Orientation of the new object.
            * @param parent Parent that will be assigned to the new object.
            * @param instantiateInWorldSpace When you assign a parent Object, pass true to position the new object directly in world space. Pass false to set the Object’s position relative to its new parent..
            * @returns The instantiated clone. 
            */
            public static Instantiate ($original: UnityEngine.Object, $position: UnityEngine.Vector3, $rotation: UnityEngine.Quaternion, $parent: UnityEngine.Transform) : UnityEngine.Object
            /** Clones the object original and returns the clone.
            * @param original An existing object that you want to make a copy of.
            * @param position Position for the new object.
            * @param rotation Orientation of the new object.
            * @param parent Parent that will be assigned to the new object.
            * @param instantiateInWorldSpace When you assign a parent Object, pass true to position the new object directly in world space. Pass false to set the Object’s position relative to its new parent..
            * @returns The instantiated clone. 
            */
            public static Instantiate ($original: UnityEngine.Object) : UnityEngine.Object
            /** Clones the object original and returns the clone.
            * @param original An existing object that you want to make a copy of.
            * @param position Position for the new object.
            * @param rotation Orientation of the new object.
            * @param parent Parent that will be assigned to the new object.
            * @param instantiateInWorldSpace When you assign a parent Object, pass true to position the new object directly in world space. Pass false to set the Object’s position relative to its new parent..
            * @returns The instantiated clone. 
            */
            public static Instantiate ($original: UnityEngine.Object, $parent: UnityEngine.Transform) : UnityEngine.Object
            /** Clones the object original and returns the clone.
            * @param original An existing object that you want to make a copy of.
            * @param position Position for the new object.
            * @param rotation Orientation of the new object.
            * @param parent Parent that will be assigned to the new object.
            * @param instantiateInWorldSpace When you assign a parent Object, pass true to position the new object directly in world space. Pass false to set the Object’s position relative to its new parent..
            * @returns The instantiated clone. 
            */
            public static Instantiate ($original: UnityEngine.Object, $parent: UnityEngine.Transform, $instantiateInWorldSpace: boolean) : UnityEngine.Object
            public static Instantiate ($original: UnityEngine.Object, $parent: UnityEngine.Transform, $worldPositionStays: boolean) : UnityEngine.Object
            /** Removes a GameObject, component or asset. * @param obj The object to destroy.
            * @param t The optional amount of time to delay before destroying the object.
            */
            public static Destroy ($obj: UnityEngine.Object, $t: number) : void
            /** Removes a GameObject, component or asset. * @param obj The object to destroy.
            * @param t The optional amount of time to delay before destroying the object.
            */
            public static Destroy ($obj: UnityEngine.Object) : void
            /** Destroys the object obj immediately. You are strongly recommended to use Destroy instead. * @param obj Object to be destroyed.
            * @param allowDestroyingAssets Set to true to allow assets to be destroyed.
            */
            public static DestroyImmediate ($obj: UnityEngine.Object, $allowDestroyingAssets: boolean) : void
            /** Destroys the object obj immediately. You are strongly recommended to use Destroy instead. * @param obj Object to be destroyed.
            * @param allowDestroyingAssets Set to true to allow assets to be destroyed.
            */
            public static DestroyImmediate ($obj: UnityEngine.Object) : void
            /** The older, non-generic version of this method. In most cases you should use the generic version of this method.
            * @param type The type of object to find.
            * @returns Returns an array of all active loaded objects of Type type. 
            */
            public static FindObjectsOfType ($type: System.Type) : System.Array$1<UnityEngine.Object>
            /** Do not destroy the target Object when loading a new Scene. * @param target An Object not destroyed on Scene change.
            */
            public static DontDestroyOnLoad ($target: UnityEngine.Object) : void
            /** The older, non-generic version of this method. In most cases you should use the generic version of this method.
            * @param type The type of object to find.
            * @returns Returns an array of all active loaded objects of Type type. 
            */
            public static FindObjectOfType ($type: System.Type) : UnityEngine.Object
            public static op_Equality ($x: UnityEngine.Object, $y: UnityEngine.Object) : boolean
            public static op_Inequality ($x: UnityEngine.Object, $y: UnityEngine.Object) : boolean
            public constructor ()
        }
        /** A base class of all colliders. */
        class Collider extends UnityEngine.Component
        {
        /** Enabled Colliders will collide with other Colliders, disabled Colliders won't. */
            public get enabled(): boolean;
            public set enabled(value: boolean);
            /** The rigidbody the collider is attached to. */
            public get attachedRigidbody(): UnityEngine.Rigidbody;
            /** Is the collider a trigger? */
            public get isTrigger(): boolean;
            public set isTrigger(value: boolean);
            /** Contact offset value of this collider. */
            public get contactOffset(): number;
            public set contactOffset(value: number);
            /** The world space bounding volume of the collider (Read Only). */
            public get bounds(): UnityEngine.Bounds;
            /** The shared physic material of this collider. */
            public get sharedMaterial(): UnityEngine.PhysicMaterial;
            public set sharedMaterial(value: UnityEngine.PhysicMaterial);
            /** The material used by the collider. */
            public get material(): UnityEngine.PhysicMaterial;
            public set material(value: UnityEngine.PhysicMaterial);
            /** Returns a point on the collider that is closest to a given location.
            * @param position Location you want to find the closest point to.
            * @returns The point on the collider that is closest to the specified location. 
            */
            public ClosestPoint ($position: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Casts a Ray that ignores all Colliders except this one.
            * @param ray The starting point and direction of the ray.
            * @param hitInfo If true is returned, hitInfo will contain more information about where the collider was hit.
            * @param maxDistance The max length of the ray.
            * @returns True when the ray intersects the collider, otherwise false. 
            */
            public Raycast ($ray: UnityEngine.Ray, $hitInfo: $Ref<UnityEngine.RaycastHit>, $maxDistance: number) : boolean
            /** The closest point to the bounding box of the attached collider. */
            public ClosestPointOnBounds ($position: UnityEngine.Vector3) : UnityEngine.Vector3
            public constructor ()
        }
        /** Interface into the Input system. */
        class Input extends System.Object
        {
        /** Enables/Disables mouse simulation with touches. By default this option is enabled. */
            public static get simulateMouseWithTouches(): boolean;
            public static set simulateMouseWithTouches(value: boolean);
            /** Is any key or mouse button currently held down? (Read Only) */
            public static get anyKey(): boolean;
            /** Returns true the first frame the user hits any key or mouse button. (Read Only) */
            public static get anyKeyDown(): boolean;
            /** Returns the keyboard input entered this frame. (Read Only) */
            public static get inputString(): string;
            /** The current mouse position in pixel coordinates. (Read Only) */
            public static get mousePosition(): UnityEngine.Vector3;
            /** The current mouse scroll delta. (Read Only) */
            public static get mouseScrollDelta(): UnityEngine.Vector2;
            /** Controls enabling and disabling of IME input composition. */
            public static get imeCompositionMode(): UnityEngine.IMECompositionMode;
            public static set imeCompositionMode(value: UnityEngine.IMECompositionMode);
            /** The current IME composition string being typed by the user. */
            public static get compositionString(): string;
            /** Does the user have an IME keyboard input source selected? */
            public static get imeIsSelected(): boolean;
            /** The current text input position used by IMEs to open windows. */
            public static get compositionCursorPos(): UnityEngine.Vector2;
            public static set compositionCursorPos(value: UnityEngine.Vector2);
            /** Indicates if a mouse device is detected. */
            public static get mousePresent(): boolean;
            /** Number of touches. Guaranteed not to change throughout the frame. (Read Only) */
            public static get touchCount(): number;
            /** Bool value which let's users check if touch pressure is supported. */
            public static get touchPressureSupported(): boolean;
            /** Returns true when Stylus Touch is supported by a device or platform. */
            public static get stylusTouchSupported(): boolean;
            /** Returns whether the device on which application is currently running supports touch input. */
            public static get touchSupported(): boolean;
            /** Property indicating whether the system handles multiple touches. */
            public static get multiTouchEnabled(): boolean;
            public static set multiTouchEnabled(value: boolean);
            /** Device physical orientation as reported by OS. (Read Only) */
            public static get deviceOrientation(): UnityEngine.DeviceOrientation;
            /** Last measured linear acceleration of a device in three-dimensional space. (Read Only) */
            public static get acceleration(): UnityEngine.Vector3;
            /** This property controls if input sensors should be compensated for screen orientation. */
            public static get compensateSensors(): boolean;
            public static set compensateSensors(value: boolean);
            /** Number of acceleration measurements which occurred during last frame. */
            public static get accelerationEventCount(): number;
            /** Should  Back button quit the application?
            Only usable on Android, Windows Phone or Windows Tablets. */
            public static get backButtonLeavesApp(): boolean;
            public static set backButtonLeavesApp(value: boolean);
            /** Property for accessing device location (handheld devices only). (Read Only) */
            public static get location(): UnityEngine.LocationService;
            /** Property for accessing compass (handheld devices only). (Read Only) */
            public static get compass(): UnityEngine.Compass;
            /** Returns default gyroscope. */
            public static get gyro(): UnityEngine.Gyroscope;
            /** Returns list of objects representing status of all touches during last frame. (Read Only) (Allocates temporary variables). */
            public static get touches(): System.Array$1<UnityEngine.Touch>;
            /** Returns list of acceleration measurements which occurred during the last frame. (Read Only) (Allocates temporary variables). */
            public static get accelerationEvents(): System.Array$1<UnityEngine.AccelerationEvent>;
            /** Returns the value of the virtual axis identified by axisName. */
            public static GetAxis ($axisName: string) : number
            /** Returns the value of the virtual axis identified by axisName with no smoothing filtering applied. */
            public static GetAxisRaw ($axisName: string) : number
            /** Returns true while the virtual button identified by buttonName is held down.
            * @param buttonName The name of the button such as Jump.
            * @returns True when an axis has been pressed and not released. 
            */
            public static GetButton ($buttonName: string) : boolean
            /** Returns true during the frame the user pressed down the virtual button identified by buttonName. */
            public static GetButtonDown ($buttonName: string) : boolean
            /** Returns true the first frame the user releases the virtual button identified by buttonName. */
            public static GetButtonUp ($buttonName: string) : boolean
            /** Returns whether the given mouse button is held down. */
            public static GetMouseButton ($button: number) : boolean
            /** Returns true during the frame the user pressed the given mouse button. */
            public static GetMouseButtonDown ($button: number) : boolean
            /** Returns true during the frame the user releases the given mouse button. */
            public static GetMouseButtonUp ($button: number) : boolean
            public static ResetInputAxes () : void
            /** Determine whether a particular joystick model has been preconfigured by Unity. (Linux-only).
            * @param joystickName The name of the joystick to check (returned by Input.GetJoystickNames).
            * @returns True if the joystick layout has been preconfigured; false otherwise. 
            */
            public static IsJoystickPreconfigured ($joystickName: string) : boolean
            public static GetJoystickNames () : System.Array$1<string>
            /** Call Input.GetTouch to obtain a Touch struct.
            * @param index The touch input on the device screen.
            * @returns Touch details in the struct. 
            */
            public static GetTouch ($index: number) : UnityEngine.Touch
            /** Returns specific acceleration measurement which occurred during last frame. (Does not allocate temporary variables). */
            public static GetAccelerationEvent ($index: number) : UnityEngine.AccelerationEvent
            /** Returns true while the user holds down the key identified by the key KeyCode enum parameter. */
            public static GetKey ($key: UnityEngine.KeyCode) : boolean
            /** Returns true while the user holds down the key identified by name. */
            public static GetKey ($name: string) : boolean
            /** Returns true during the frame the user releases the key identified by the key KeyCode enum parameter. */
            public static GetKeyUp ($key: UnityEngine.KeyCode) : boolean
            /** Returns true during the frame the user releases the key identified by name. */
            public static GetKeyUp ($name: string) : boolean
            /** Returns true during the frame the user starts pressing down the key identified by the key KeyCode enum parameter. */
            public static GetKeyDown ($key: UnityEngine.KeyCode) : boolean
            /** Returns true during the frame the user starts pressing down the key identified by name. */
            public static GetKeyDown ($name: string) : boolean
            public constructor ()
        }
        /** Structure describing the status of a finger touching the screen. */
        class Touch extends System.ValueType
        {
        }
        /** Structure describing acceleration status of the device. */
        class AccelerationEvent extends System.ValueType
        {
        }
        /** Key codes returned by Event.keyCode. These map directly to a physical key on the keyboard. */
        enum KeyCode
        { None = 0, Backspace = 8, Delete = 127, Tab = 9, Clear = 12, Return = 13, Pause = 19, Escape = 27, Space = 32, Keypad0 = 256, Keypad1 = 257, Keypad2 = 258, Keypad3 = 259, Keypad4 = 260, Keypad5 = 261, Keypad6 = 262, Keypad7 = 263, Keypad8 = 264, Keypad9 = 265, KeypadPeriod = 266, KeypadDivide = 267, KeypadMultiply = 268, KeypadMinus = 269, KeypadPlus = 270, KeypadEnter = 271, KeypadEquals = 272, UpArrow = 273, DownArrow = 274, RightArrow = 275, LeftArrow = 276, Insert = 277, Home = 278, End = 279, PageUp = 280, PageDown = 281, F1 = 282, F2 = 283, F3 = 284, F4 = 285, F5 = 286, F6 = 287, F7 = 288, F8 = 289, F9 = 290, F10 = 291, F11 = 292, F12 = 293, F13 = 294, F14 = 295, F15 = 296, Alpha0 = 48, Alpha1 = 49, Alpha2 = 50, Alpha3 = 51, Alpha4 = 52, Alpha5 = 53, Alpha6 = 54, Alpha7 = 55, Alpha8 = 56, Alpha9 = 57, Exclaim = 33, DoubleQuote = 34, Hash = 35, Dollar = 36, Percent = 37, Ampersand = 38, Quote = 39, LeftParen = 40, RightParen = 41, Asterisk = 42, Plus = 43, Comma = 44, Minus = 45, Period = 46, Slash = 47, Colon = 58, Semicolon = 59, Less = 60, Equals = 61, Greater = 62, Question = 63, At = 64, LeftBracket = 91, Backslash = 92, RightBracket = 93, Caret = 94, Underscore = 95, BackQuote = 96, A = 97, B = 98, C = 99, D = 100, E = 101, F = 102, G = 103, H = 104, I = 105, J = 106, K = 107, L = 108, M = 109, N = 110, O = 111, P = 112, Q = 113, R = 114, S = 115, T = 116, U = 117, V = 118, W = 119, X = 120, Y = 121, Z = 122, LeftCurlyBracket = 123, Pipe = 124, RightCurlyBracket = 125, Tilde = 126, Numlock = 300, CapsLock = 301, ScrollLock = 302, RightShift = 303, LeftShift = 304, RightControl = 305, LeftControl = 306, RightAlt = 307, LeftAlt = 308, LeftCommand = 310, LeftApple = 310, LeftWindows = 311, RightCommand = 309, RightApple = 309, RightWindows = 312, AltGr = 313, Help = 315, Print = 316, SysReq = 317, Break = 318, Menu = 319, Mouse0 = 323, Mouse1 = 324, Mouse2 = 325, Mouse3 = 326, Mouse4 = 327, Mouse5 = 328, Mouse6 = 329, JoystickButton0 = 330, JoystickButton1 = 331, JoystickButton2 = 332, JoystickButton3 = 333, JoystickButton4 = 334, JoystickButton5 = 335, JoystickButton6 = 336, JoystickButton7 = 337, JoystickButton8 = 338, JoystickButton9 = 339, JoystickButton10 = 340, JoystickButton11 = 341, JoystickButton12 = 342, JoystickButton13 = 343, JoystickButton14 = 344, JoystickButton15 = 345, JoystickButton16 = 346, JoystickButton17 = 347, JoystickButton18 = 348, JoystickButton19 = 349, Joystick1Button0 = 350, Joystick1Button1 = 351, Joystick1Button2 = 352, Joystick1Button3 = 353, Joystick1Button4 = 354, Joystick1Button5 = 355, Joystick1Button6 = 356, Joystick1Button7 = 357, Joystick1Button8 = 358, Joystick1Button9 = 359, Joystick1Button10 = 360, Joystick1Button11 = 361, Joystick1Button12 = 362, Joystick1Button13 = 363, Joystick1Button14 = 364, Joystick1Button15 = 365, Joystick1Button16 = 366, Joystick1Button17 = 367, Joystick1Button18 = 368, Joystick1Button19 = 369, Joystick2Button0 = 370, Joystick2Button1 = 371, Joystick2Button2 = 372, Joystick2Button3 = 373, Joystick2Button4 = 374, Joystick2Button5 = 375, Joystick2Button6 = 376, Joystick2Button7 = 377, Joystick2Button8 = 378, Joystick2Button9 = 379, Joystick2Button10 = 380, Joystick2Button11 = 381, Joystick2Button12 = 382, Joystick2Button13 = 383, Joystick2Button14 = 384, Joystick2Button15 = 385, Joystick2Button16 = 386, Joystick2Button17 = 387, Joystick2Button18 = 388, Joystick2Button19 = 389, Joystick3Button0 = 390, Joystick3Button1 = 391, Joystick3Button2 = 392, Joystick3Button3 = 393, Joystick3Button4 = 394, Joystick3Button5 = 395, Joystick3Button6 = 396, Joystick3Button7 = 397, Joystick3Button8 = 398, Joystick3Button9 = 399, Joystick3Button10 = 400, Joystick3Button11 = 401, Joystick3Button12 = 402, Joystick3Button13 = 403, Joystick3Button14 = 404, Joystick3Button15 = 405, Joystick3Button16 = 406, Joystick3Button17 = 407, Joystick3Button18 = 408, Joystick3Button19 = 409, Joystick4Button0 = 410, Joystick4Button1 = 411, Joystick4Button2 = 412, Joystick4Button3 = 413, Joystick4Button4 = 414, Joystick4Button5 = 415, Joystick4Button6 = 416, Joystick4Button7 = 417, Joystick4Button8 = 418, Joystick4Button9 = 419, Joystick4Button10 = 420, Joystick4Button11 = 421, Joystick4Button12 = 422, Joystick4Button13 = 423, Joystick4Button14 = 424, Joystick4Button15 = 425, Joystick4Button16 = 426, Joystick4Button17 = 427, Joystick4Button18 = 428, Joystick4Button19 = 429, Joystick5Button0 = 430, Joystick5Button1 = 431, Joystick5Button2 = 432, Joystick5Button3 = 433, Joystick5Button4 = 434, Joystick5Button5 = 435, Joystick5Button6 = 436, Joystick5Button7 = 437, Joystick5Button8 = 438, Joystick5Button9 = 439, Joystick5Button10 = 440, Joystick5Button11 = 441, Joystick5Button12 = 442, Joystick5Button13 = 443, Joystick5Button14 = 444, Joystick5Button15 = 445, Joystick5Button16 = 446, Joystick5Button17 = 447, Joystick5Button18 = 448, Joystick5Button19 = 449, Joystick6Button0 = 450, Joystick6Button1 = 451, Joystick6Button2 = 452, Joystick6Button3 = 453, Joystick6Button4 = 454, Joystick6Button5 = 455, Joystick6Button6 = 456, Joystick6Button7 = 457, Joystick6Button8 = 458, Joystick6Button9 = 459, Joystick6Button10 = 460, Joystick6Button11 = 461, Joystick6Button12 = 462, Joystick6Button13 = 463, Joystick6Button14 = 464, Joystick6Button15 = 465, Joystick6Button16 = 466, Joystick6Button17 = 467, Joystick6Button18 = 468, Joystick6Button19 = 469, Joystick7Button0 = 470, Joystick7Button1 = 471, Joystick7Button2 = 472, Joystick7Button3 = 473, Joystick7Button4 = 474, Joystick7Button5 = 475, Joystick7Button6 = 476, Joystick7Button7 = 477, Joystick7Button8 = 478, Joystick7Button9 = 479, Joystick7Button10 = 480, Joystick7Button11 = 481, Joystick7Button12 = 482, Joystick7Button13 = 483, Joystick7Button14 = 484, Joystick7Button15 = 485, Joystick7Button16 = 486, Joystick7Button17 = 487, Joystick7Button18 = 488, Joystick7Button19 = 489, Joystick8Button0 = 490, Joystick8Button1 = 491, Joystick8Button2 = 492, Joystick8Button3 = 493, Joystick8Button4 = 494, Joystick8Button5 = 495, Joystick8Button6 = 496, Joystick8Button7 = 497, Joystick8Button8 = 498, Joystick8Button9 = 499, Joystick8Button10 = 500, Joystick8Button11 = 501, Joystick8Button12 = 502, Joystick8Button13 = 503, Joystick8Button14 = 504, Joystick8Button15 = 505, Joystick8Button16 = 506, Joystick8Button17 = 507, Joystick8Button18 = 508, Joystick8Button19 = 509 }
        /** Representation of 3D vectors and points. */
        class Vector3 extends System.ValueType implements System.IEquatable$1<UnityEngine.Vector3>
        {
            public static kEpsilon : number
            public static kEpsilonNormalSqrt : number/** X component of the vector. */
            public x : number/** Y component of the vector. */
            public y : number/** Z component of the vector. */
            public z : number/** Returns this vector with a magnitude of 1 (Read Only). */
            public get normalized(): UnityEngine.Vector3;
            /** Returns the length of this vector (Read Only). */
            public get magnitude(): number;
            /** Returns the squared length of this vector (Read Only). */
            public get sqrMagnitude(): number;
            /** Shorthand for writing Vector3(0, 0, 0). */
            public static get zero(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(1, 1, 1). */
            public static get one(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(0, 0, 1). */
            public static get forward(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(0, 0, -1). */
            public static get back(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(0, 1, 0). */
            public static get up(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(0, -1, 0). */
            public static get down(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(-1, 0, 0). */
            public static get left(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(1, 0, 0). */
            public static get right(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity). */
            public static get positiveInfinity(): UnityEngine.Vector3;
            /** Shorthand for writing Vector3(float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity). */
            public static get negativeInfinity(): UnityEngine.Vector3;
            /** Spherically interpolates between two vectors. */
            public static Slerp ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3, $t: number) : UnityEngine.Vector3
            /** Spherically interpolates between two vectors. */
            public static SlerpUnclamped ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3, $t: number) : UnityEngine.Vector3
            /** Makes vectors normalized and orthogonal to each other. */
            public static OrthoNormalize ($normal: $Ref<UnityEngine.Vector3>, $tangent: $Ref<UnityEngine.Vector3>) : void
            /** Makes vectors normalized and orthogonal to each other. */
            public static OrthoNormalize ($normal: $Ref<UnityEngine.Vector3>, $tangent: $Ref<UnityEngine.Vector3>, $binormal: $Ref<UnityEngine.Vector3>) : void
            /** Rotates a vector current towards target.
            * @param current The vector being managed.
            * @param target The vector.
            * @param maxRadiansDelta The maximum angle in radians allowed for this rotation.
            * @param maxMagnitudeDelta The maximum allowed change in vector magnitude for this rotation.
            * @returns The location that RotateTowards generates. 
            */
            public static RotateTowards ($current: UnityEngine.Vector3, $target: UnityEngine.Vector3, $maxRadiansDelta: number, $maxMagnitudeDelta: number) : UnityEngine.Vector3
            /** Linearly interpolates between two points.
            * @param a Start value, returned when t = 0.
            * @param b End value, returned when t = 1.
            * @param t Value used to interpolate between a and b.
            * @returns Interpolated value, equals to a + (b - a) * t. 
            */
            public static Lerp ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3, $t: number) : UnityEngine.Vector3
            /** Linearly interpolates between two vectors. */
            public static LerpUnclamped ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3, $t: number) : UnityEngine.Vector3
            /** Calculate a position between the points specified by current and target, moving no farther than the distance specified by maxDistanceDelta.
            * @param current The position to move from.
            * @param target The position to move towards.
            * @param maxDistanceDelta Distance to move current per call.
            * @returns The new position. 
            */
            public static MoveTowards ($current: UnityEngine.Vector3, $target: UnityEngine.Vector3, $maxDistanceDelta: number) : UnityEngine.Vector3
            /** Gradually changes a vector towards a desired goal over time. * @param current The current position.
            * @param target The position we are trying to reach.
            * @param currentVelocity The current velocity, this value is modified by the function every time you call it.
            * @param smoothTime Approximately the time it will take to reach the target. A smaller value will reach the target faster.
            * @param maxSpeed Optionally allows you to clamp the maximum speed.
            * @param deltaTime The time since the last call to this function. By default Time.deltaTime.
            */
            public static SmoothDamp ($current: UnityEngine.Vector3, $target: UnityEngine.Vector3, $currentVelocity: $Ref<UnityEngine.Vector3>, $smoothTime: number, $maxSpeed: number) : UnityEngine.Vector3
            /** Gradually changes a vector towards a desired goal over time. * @param current The current position.
            * @param target The position we are trying to reach.
            * @param currentVelocity The current velocity, this value is modified by the function every time you call it.
            * @param smoothTime Approximately the time it will take to reach the target. A smaller value will reach the target faster.
            * @param maxSpeed Optionally allows you to clamp the maximum speed.
            * @param deltaTime The time since the last call to this function. By default Time.deltaTime.
            */
            public static SmoothDamp ($current: UnityEngine.Vector3, $target: UnityEngine.Vector3, $currentVelocity: $Ref<UnityEngine.Vector3>, $smoothTime: number) : UnityEngine.Vector3
            /** Gradually changes a vector towards a desired goal over time. * @param current The current position.
            * @param target The position we are trying to reach.
            * @param currentVelocity The current velocity, this value is modified by the function every time you call it.
            * @param smoothTime Approximately the time it will take to reach the target. A smaller value will reach the target faster.
            * @param maxSpeed Optionally allows you to clamp the maximum speed.
            * @param deltaTime The time since the last call to this function. By default Time.deltaTime.
            */
            public static SmoothDamp ($current: UnityEngine.Vector3, $target: UnityEngine.Vector3, $currentVelocity: $Ref<UnityEngine.Vector3>, $smoothTime: number, $maxSpeed: number, $deltaTime: number) : UnityEngine.Vector3
            public get_Item ($index: number) : number
            public set_Item ($index: number, $value: number) : void
            /** Set x, y and z components of an existing Vector3. */
            public Set ($newX: number, $newY: number, $newZ: number) : void
            /** Multiplies two vectors component-wise. */
            public static Scale ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Multiplies every component of this vector by the same component of scale. */
            public Scale ($scale: UnityEngine.Vector3) : void
            /** Cross Product of two vectors. */
            public static Cross ($lhs: UnityEngine.Vector3, $rhs: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Returns true if the given vector is exactly equal to this vector. */
            public Equals ($other: any) : boolean
            public Equals ($other: UnityEngine.Vector3) : boolean
            /** Reflects a vector off the plane defined by a normal. */
            public static Reflect ($inDirection: UnityEngine.Vector3, $inNormal: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Makes this vector have a magnitude of 1. */
            public static Normalize ($value: UnityEngine.Vector3) : UnityEngine.Vector3
            public Normalize () : void
            /** Dot Product of two vectors. */
            public static Dot ($lhs: UnityEngine.Vector3, $rhs: UnityEngine.Vector3) : number
            /** Projects a vector onto another vector. */
            public static Project ($vector: UnityEngine.Vector3, $onNormal: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Projects a vector onto a plane defined by a normal orthogonal to the plane.
            * @param planeNormal The direction from the vector towards the plane.
            * @param vector The location of the vector above the plane.
            * @returns The location of the vector on the plane. 
            */
            public static ProjectOnPlane ($vector: UnityEngine.Vector3, $planeNormal: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Returns the angle in degrees between from and to.
            * @param from The vector from which the angular difference is measured.
            * @param to The vector to which the angular difference is measured.
            * @returns The angle in degrees between the two vectors. 
            */
            public static Angle ($from: UnityEngine.Vector3, $to: UnityEngine.Vector3) : number
            /** Returns the signed angle in degrees between from and to. * @param from The vector from which the angular difference is measured.
            * @param to The vector to which the angular difference is measured.
            * @param axis A vector around which the other vectors are rotated.
            */
            public static SignedAngle ($from: UnityEngine.Vector3, $to: UnityEngine.Vector3, $axis: UnityEngine.Vector3) : number
            /** Returns the distance between a and b. */
            public static Distance ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3) : number
            /** Returns a copy of vector with its magnitude clamped to maxLength. */
            public static ClampMagnitude ($vector: UnityEngine.Vector3, $maxLength: number) : UnityEngine.Vector3
            public static Magnitude ($vector: UnityEngine.Vector3) : number
            public static SqrMagnitude ($vector: UnityEngine.Vector3) : number
            /** Returns a vector that is made from the smallest components of two vectors. */
            public static Min ($lhs: UnityEngine.Vector3, $rhs: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Returns a vector that is made from the largest components of two vectors. */
            public static Max ($lhs: UnityEngine.Vector3, $rhs: UnityEngine.Vector3) : UnityEngine.Vector3
            public static op_Addition ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3) : UnityEngine.Vector3
            public static op_Subtraction ($a: UnityEngine.Vector3, $b: UnityEngine.Vector3) : UnityEngine.Vector3
            public static op_UnaryNegation ($a: UnityEngine.Vector3) : UnityEngine.Vector3
            public static op_Multiply ($a: UnityEngine.Vector3, $d: number) : UnityEngine.Vector3
            public static op_Multiply ($d: number, $a: UnityEngine.Vector3) : UnityEngine.Vector3
            public static op_Division ($a: UnityEngine.Vector3, $d: number) : UnityEngine.Vector3
            public static op_Equality ($lhs: UnityEngine.Vector3, $rhs: UnityEngine.Vector3) : boolean
            public static op_Inequality ($lhs: UnityEngine.Vector3, $rhs: UnityEngine.Vector3) : boolean
            public ToString () : string
            /** Returns a nicely formatted string for this vector. */
            public ToString ($format: string) : string
            public constructor ($x: number, $y: number, $z: number)
            public constructor ($x: number, $y: number)
        }
        /** Representation of 2D vectors and points. */
        class Vector2 extends System.ValueType implements System.IEquatable$1<UnityEngine.Vector2>
        {
        }
        /** Controls IME input. */
        enum IMECompositionMode
        { Auto = 0, On = 1, Off = 2 }
        /** Describes physical orientation of the device as determined by the OS. */
        enum DeviceOrientation
        { Unknown = 0, Portrait = 1, PortraitUpsideDown = 2, LandscapeLeft = 3, LandscapeRight = 4, FaceUp = 5, FaceDown = 6 }
        /** Interface into location functionality. */
        class LocationService extends System.Object
        {
        }
        /** Interface into compass functionality. */
        class Compass extends System.Object
        {
        }
        /** Interface into the Gyroscope. */
        class Gyroscope extends System.Object
        {
        }
        /** Quaternions are used to represent rotations. */
        class Quaternion extends System.ValueType implements System.IEquatable$1<UnityEngine.Quaternion>
        {
        }
        /** Position, rotation and scale of an object. */
        class Transform extends UnityEngine.Component implements System.Collections.IEnumerable
        {
        /** The world space position of the Transform. */
            public get position(): UnityEngine.Vector3;
            public set position(value: UnityEngine.Vector3);
            /** Position of the transform relative to the parent transform. */
            public get localPosition(): UnityEngine.Vector3;
            public set localPosition(value: UnityEngine.Vector3);
            /** The rotation as Euler angles in degrees. */
            public get eulerAngles(): UnityEngine.Vector3;
            public set eulerAngles(value: UnityEngine.Vector3);
            /** The rotation as Euler angles in degrees relative to the parent transform's rotation. */
            public get localEulerAngles(): UnityEngine.Vector3;
            public set localEulerAngles(value: UnityEngine.Vector3);
            /** The red axis of the transform in world space. */
            public get right(): UnityEngine.Vector3;
            public set right(value: UnityEngine.Vector3);
            /** The green axis of the transform in world space. */
            public get up(): UnityEngine.Vector3;
            public set up(value: UnityEngine.Vector3);
            /** Returns a normalized vector representing the blue axis of the transform in world space. */
            public get forward(): UnityEngine.Vector3;
            public set forward(value: UnityEngine.Vector3);
            /** A Quaternion that stores the rotation of the Transform in world space. */
            public get rotation(): UnityEngine.Quaternion;
            public set rotation(value: UnityEngine.Quaternion);
            /** The rotation of the transform relative to the transform rotation of the parent. */
            public get localRotation(): UnityEngine.Quaternion;
            public set localRotation(value: UnityEngine.Quaternion);
            /** The scale of the transform relative to the GameObjects parent. */
            public get localScale(): UnityEngine.Vector3;
            public set localScale(value: UnityEngine.Vector3);
            /** The parent of the transform. */
            public get parent(): UnityEngine.Transform;
            public set parent(value: UnityEngine.Transform);
            /** Matrix that transforms a point from world space into local space (Read Only). */
            public get worldToLocalMatrix(): UnityEngine.Matrix4x4;
            /** Matrix that transforms a point from local space into world space (Read Only). */
            public get localToWorldMatrix(): UnityEngine.Matrix4x4;
            /** Returns the topmost transform in the hierarchy. */
            public get root(): UnityEngine.Transform;
            /** The number of children the parent Transform has. */
            public get childCount(): number;
            /** The global scale of the object (Read Only). */
            public get lossyScale(): UnityEngine.Vector3;
            /** Has the transform changed since the last time the flag was set to 'false'? */
            public get hasChanged(): boolean;
            public set hasChanged(value: boolean);
            /** The transform capacity of the transform's hierarchy data structure. */
            public get hierarchyCapacity(): number;
            public set hierarchyCapacity(value: number);
            /** The number of transforms in the transform's hierarchy data structure. */
            public get hierarchyCount(): number;
            /** Set the parent of the transform. * @param parent The parent Transform to use.
            * @param worldPositionStays If true, the parent-relative position, scale and rotation are modified such that the object keeps the same world space position, rotation and scale as before.
            */
            public SetParent ($p: UnityEngine.Transform) : void
            /** Set the parent of the transform. * @param parent The parent Transform to use.
            * @param worldPositionStays If true, the parent-relative position, scale and rotation are modified such that the object keeps the same world space position, rotation and scale as before.
            */
            public SetParent ($parent: UnityEngine.Transform, $worldPositionStays: boolean) : void
            /** Sets the world space position and rotation of the Transform component. */
            public SetPositionAndRotation ($position: UnityEngine.Vector3, $rotation: UnityEngine.Quaternion) : void
            /** Moves the transform in the direction and distance of translation. */
            public Translate ($translation: UnityEngine.Vector3, $relativeTo: UnityEngine.Space) : void
            /** Moves the transform in the direction and distance of translation. */
            public Translate ($translation: UnityEngine.Vector3) : void
            /** Moves the transform by x along the x axis, y along the y axis, and z along the z axis. */
            public Translate ($x: number, $y: number, $z: number, $relativeTo: UnityEngine.Space) : void
            /** Moves the transform by x along the x axis, y along the y axis, and z along the z axis. */
            public Translate ($x: number, $y: number, $z: number) : void
            /** Moves the transform in the direction and distance of translation. */
            public Translate ($translation: UnityEngine.Vector3, $relativeTo: UnityEngine.Transform) : void
            /** Moves the transform by x along the x axis, y along the y axis, and z along the z axis. */
            public Translate ($x: number, $y: number, $z: number, $relativeTo: UnityEngine.Transform) : void
            /** Applies a rotation of eulerAngles.z degrees around the z-axis, eulerAngles.x degrees around the x-axis, and eulerAngles.y degrees around the y-axis (in that order). * @param eulers The rotation to apply in euler angles.
            * @param relativeTo Determines whether to rotate the GameObject either locally to  the GameObject or relative to the Scene in world space.
            */
            public Rotate ($eulers: UnityEngine.Vector3, $relativeTo: UnityEngine.Space) : void
            /** Applies a rotation of eulerAngles.z degrees around the z-axis, eulerAngles.x degrees around the x-axis, and eulerAngles.y degrees around the y-axis (in that order). * @param eulers The rotation to apply in euler angles.
            */
            public Rotate ($eulers: UnityEngine.Vector3) : void
            /** The implementation of this method applies a rotation of zAngle degrees around the z axis, xAngle degrees around the x axis, and yAngle degrees around the y axis (in that order). * @param relativeTo Determines whether to rotate the GameObject either locally to the GameObject or relative to the Scene in world space.
            * @param xAngle Degrees to rotate the GameObject around the X axis.
            * @param yAngle Degrees to rotate the GameObject around the Y axis.
            * @param zAngle Degrees to rotate the GameObject around the Z axis.
            */
            public Rotate ($xAngle: number, $yAngle: number, $zAngle: number, $relativeTo: UnityEngine.Space) : void
            /** The implementation of this method applies a rotation of zAngle degrees around the z axis, xAngle degrees around the x axis, and yAngle degrees around the y axis (in that order). * @param xAngle Degrees to rotate the GameObject around the X axis.
            * @param yAngle Degrees to rotate the GameObject around the Y axis.
            * @param zAngle Degrees to rotate the GameObject around the Z axis.
            */
            public Rotate ($xAngle: number, $yAngle: number, $zAngle: number) : void
            /** Rotates the object around the given axis by the number of degrees defined by the given angle. * @param angle The degrees of rotation to apply.
            * @param axis The axis to apply rotation to.
            * @param relativeTo Determines whether to rotate the GameObject either locally to the GameObject or relative to the Scene in world space.
            */
            public Rotate ($axis: UnityEngine.Vector3, $angle: number, $relativeTo: UnityEngine.Space) : void
            /** Rotates the object around the given axis by the number of degrees defined by the given angle. * @param axis The axis to apply rotation to.
            * @param angle The degrees of rotation to apply.
            */
            public Rotate ($axis: UnityEngine.Vector3, $angle: number) : void
            /** Rotates the transform about axis passing through point in world coordinates by angle degrees. */
            public RotateAround ($point: UnityEngine.Vector3, $axis: UnityEngine.Vector3, $angle: number) : void
            /** Rotates the transform so the forward vector points at target's current position. * @param target Object to point towards.
            * @param worldUp Vector specifying the upward direction.
            */
            public LookAt ($target: UnityEngine.Transform, $worldUp: UnityEngine.Vector3) : void
            /** Rotates the transform so the forward vector points at target's current position. * @param target Object to point towards.
            * @param worldUp Vector specifying the upward direction.
            */
            public LookAt ($target: UnityEngine.Transform) : void
            /** Rotates the transform so the forward vector points at worldPosition. * @param worldPosition Point to look at.
            * @param worldUp Vector specifying the upward direction.
            */
            public LookAt ($worldPosition: UnityEngine.Vector3, $worldUp: UnityEngine.Vector3) : void
            /** Rotates the transform so the forward vector points at worldPosition. * @param worldPosition Point to look at.
            * @param worldUp Vector specifying the upward direction.
            */
            public LookAt ($worldPosition: UnityEngine.Vector3) : void
            /** Transforms direction from local space to world space. */
            public TransformDirection ($direction: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Transforms direction x, y, z from local space to world space. */
            public TransformDirection ($x: number, $y: number, $z: number) : UnityEngine.Vector3
            /** Transforms a direction from world space to local space. The opposite of Transform.TransformDirection. */
            public InverseTransformDirection ($direction: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Transforms the direction x, y, z from world space to local space. The opposite of Transform.TransformDirection. */
            public InverseTransformDirection ($x: number, $y: number, $z: number) : UnityEngine.Vector3
            /** Transforms vector from local space to world space. */
            public TransformVector ($vector: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Transforms vector x, y, z from local space to world space. */
            public TransformVector ($x: number, $y: number, $z: number) : UnityEngine.Vector3
            /** Transforms a vector from world space to local space. The opposite of Transform.TransformVector. */
            public InverseTransformVector ($vector: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Transforms the vector x, y, z from world space to local space. The opposite of Transform.TransformVector. */
            public InverseTransformVector ($x: number, $y: number, $z: number) : UnityEngine.Vector3
            /** Transforms position from local space to world space. */
            public TransformPoint ($position: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Transforms the position x, y, z from local space to world space. */
            public TransformPoint ($x: number, $y: number, $z: number) : UnityEngine.Vector3
            /** Transforms position from world space to local space. */
            public InverseTransformPoint ($position: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Transforms the position x, y, z from world space to local space. The opposite of Transform.TransformPoint. */
            public InverseTransformPoint ($x: number, $y: number, $z: number) : UnityEngine.Vector3
            public DetachChildren () : void
            public SetAsFirstSibling () : void
            public SetAsLastSibling () : void
            /** Sets the sibling index. * @param index Index to set.
            */
            public SetSiblingIndex ($index: number) : void
            public GetSiblingIndex () : number
            /** Finds a child by n and returns it.
            * @param n Name of child to be found.
            * @returns The returned child transform or null if no child is found. 
            */
            public Find ($n: string) : UnityEngine.Transform
            /** Is this transform a child of parent? */
            public IsChildOf ($parent: UnityEngine.Transform) : boolean
            public GetEnumerator () : System.Collections.IEnumerator
            /** Returns a transform child by index.
            * @param index Index of the child transform to return. Must be smaller than Transform.childCount.
            * @returns Transform child by index. 
            */
            public GetChild ($index: number) : UnityEngine.Transform
        }
        /** Bit mask that controls object destruction, saving and visibility in inspectors. */
        enum HideFlags
        { None = 0, HideInHierarchy = 1, HideInInspector = 2, DontSaveInEditor = 4, NotEditable = 8, DontSaveInBuild = 16, DontUnloadUnusedAsset = 32, DontSave = 52, HideAndDontSave = 61 }
        /** Base class for all entities in Unity Scenes. */
        class GameObject extends UnityEngine.Object
        {
        /** The Transform attached to this GameObject. */
            public get transform(): UnityEngine.Transform;
            /** The layer the game object is in. */
            public get layer(): number;
            public set layer(value: number);
            /** The local active state of this GameObject. (Read Only) */
            public get activeSelf(): boolean;
            /** Defines whether the GameObject is active in the Scene. */
            public get activeInHierarchy(): boolean;
            /** Gets and sets the GameObject's StaticEditorFlags. */
            public get isStatic(): boolean;
            public set isStatic(value: boolean);
            /** The tag of this game object. */
            public get tag(): string;
            public set tag(value: string);
            /** Scene that the GameObject is part of. */
            public get scene(): UnityEngine.SceneManagement.Scene;
            /** Scene culling mask Unity uses to determine which scene to render the GameObject in. */
            public get sceneCullingMask(): bigint;
            public get gameObject(): UnityEngine.GameObject;
            /** Creates a game object with a primitive mesh renderer and appropriate collider. * @param type The type of primitive object to create.
            */
            public static CreatePrimitive ($type: UnityEngine.PrimitiveType) : UnityEngine.GameObject
            /** Returns the component of Type type if the game object has one attached, null if it doesn't. * @param type The type of Component to retrieve.
            */
            public GetComponent ($type: System.Type) : UnityEngine.Component
            /** Returns the component with name type if the game object has one attached, null if it doesn't. * @param type The type of Component to retrieve.
            */
            public GetComponent ($type: string) : UnityEngine.Component
            /** Returns the component of Type type in the GameObject or any of its children using depth first search.
            * @param type The type of Component to retrieve.
            * @returns A component of the matching type, if found. 
            */
            public GetComponentInChildren ($type: System.Type, $includeInactive: boolean) : UnityEngine.Component
            /** Returns the component of Type type in the GameObject or any of its children using depth first search.
            * @param type The type of Component to retrieve.
            * @returns A component of the matching type, if found. 
            */
            public GetComponentInChildren ($type: System.Type) : UnityEngine.Component
            /** Retrieves the component of Type type in the GameObject or any of its parents.
            * @param type Type of component to find.
            * @returns Returns a component if a component matching the type is found. Returns null otherwise. 
            */
            public GetComponentInParent ($type: System.Type) : UnityEngine.Component
            /** Returns all components of Type type in the GameObject. * @param type The type of component to retrieve.
            */
            public GetComponents ($type: System.Type) : System.Array$1<UnityEngine.Component>
            public GetComponents ($type: System.Type, $results: System.Collections.Generic.List$1<UnityEngine.Component>) : void
            /** Returns all components of Type type in the GameObject or any of its children. * @param type The type of Component to retrieve.
            * @param includeInactive Should Components on inactive GameObjects be included in the found set?
            */
            public GetComponentsInChildren ($type: System.Type) : System.Array$1<UnityEngine.Component>
            /** Returns all components of Type type in the GameObject or any of its children. * @param type The type of Component to retrieve.
            * @param includeInactive Should Components on inactive GameObjects be included in the found set?
            */
            public GetComponentsInChildren ($type: System.Type, $includeInactive: boolean) : System.Array$1<UnityEngine.Component>
            public GetComponentsInParent ($type: System.Type) : System.Array$1<UnityEngine.Component>
            /** Returns all components of Type type in the GameObject or any of its parents. * @param type The type of Component to retrieve.
            * @param includeInactive Should inactive Components be included in the found set?
            */
            public GetComponentsInParent ($type: System.Type, $includeInactive: boolean) : System.Array$1<UnityEngine.Component>
            /** Gets the component of the specified type, if it exists.
            * @param type The type of component to retrieve.
            * @param component The output argument that will contain the component or null.
            * @returns Returns true if the component is found, false otherwise. 
            */
            public TryGetComponent ($type: System.Type, $component: $Ref<UnityEngine.Component>) : boolean
            /** Returns one active GameObject tagged tag. Returns null if no GameObject was found. * @param tag The tag to search for.
            */
            public static FindWithTag ($tag: string) : UnityEngine.GameObject
            public SendMessageUpwards ($methodName: string, $options: UnityEngine.SendMessageOptions) : void
            public SendMessage ($methodName: string, $options: UnityEngine.SendMessageOptions) : void
            public BroadcastMessage ($methodName: string, $options: UnityEngine.SendMessageOptions) : void
            /** Adds a component class of type componentType to the game object. C# Users can use a generic version. */
            public AddComponent ($componentType: System.Type) : UnityEngine.Component
            /** ActivatesDeactivates the GameObject, depending on the given true or false/ value. * @param value Activate or deactivate the object, where true activates the GameObject and false deactivates the GameObject.
            */
            public SetActive ($value: boolean) : void
            /** Is this game object tagged with tag ? * @param tag The tag to compare.
            */
            public CompareTag ($tag: string) : boolean
            public static FindGameObjectWithTag ($tag: string) : UnityEngine.GameObject
            /** Returns an array of active GameObjects tagged tag. Returns empty array if no GameObject was found. * @param tag The name of the tag to search GameObjects for.
            */
            public static FindGameObjectsWithTag ($tag: string) : System.Array$1<UnityEngine.GameObject>
            /** Calls the method named methodName on every MonoBehaviour in this game object and on every ancestor of the behaviour. * @param methodName The name of the method to call.
            * @param value An optional parameter value to pass to the called method.
            * @param options Should an error be raised if the method doesn't exist on the target object?
            */
            public SendMessageUpwards ($methodName: string, $value: any, $options: UnityEngine.SendMessageOptions) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object and on every ancestor of the behaviour. * @param methodName The name of the method to call.
            * @param value An optional parameter value to pass to the called method.
            * @param options Should an error be raised if the method doesn't exist on the target object?
            */
            public SendMessageUpwards ($methodName: string, $value: any) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object and on every ancestor of the behaviour. * @param methodName The name of the method to call.
            * @param value An optional parameter value to pass to the called method.
            * @param options Should an error be raised if the method doesn't exist on the target object?
            */
            public SendMessageUpwards ($methodName: string) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object. * @param methodName The name of the method to call.
            * @param value An optional parameter value to pass to the called method.
            * @param options Should an error be raised if the method doesn't exist on the target object?
            */
            public SendMessage ($methodName: string, $value: any, $options: UnityEngine.SendMessageOptions) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object. * @param methodName The name of the method to call.
            * @param value An optional parameter value to pass to the called method.
            * @param options Should an error be raised if the method doesn't exist on the target object?
            */
            public SendMessage ($methodName: string, $value: any) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object. * @param methodName The name of the method to call.
            * @param value An optional parameter value to pass to the called method.
            * @param options Should an error be raised if the method doesn't exist on the target object?
            */
            public SendMessage ($methodName: string) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object or any of its children. */
            public BroadcastMessage ($methodName: string, $parameter: any, $options: UnityEngine.SendMessageOptions) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object or any of its children. */
            public BroadcastMessage ($methodName: string, $parameter: any) : void
            /** Calls the method named methodName on every MonoBehaviour in this game object or any of its children. */
            public BroadcastMessage ($methodName: string) : void
            /** Finds a GameObject by name and returns it. */
            public static Find ($name: string) : UnityEngine.GameObject
            public constructor ($name: string)
            public constructor ()
            public constructor ($name: string, ...components: System.Type[])
        }
        /** The various primitives that can be created using the GameObject.CreatePrimitive function. */
        enum PrimitiveType
        { Sphere = 0, Capsule = 1, Cylinder = 2, Cube = 3, Plane = 4, Quad = 5 }
        /** Options for how to send a message. */
        enum SendMessageOptions
        { RequireReceiver = 0, DontRequireReceiver = 1 }
        /** A standard 4x4 transformation matrix. */
        class Matrix4x4 extends System.ValueType implements System.IEquatable$1<UnityEngine.Matrix4x4>
        {
        }
        /** The coordinate space in which to operate. */
        enum Space
        { World = 0, Self = 1 }
        /** Control of an object's position through physics simulation. */
        class Rigidbody extends UnityEngine.Component
        {
        /** The velocity vector of the rigidbody. It represents the rate of change of Rigidbody position. */
            public get velocity(): UnityEngine.Vector3;
            public set velocity(value: UnityEngine.Vector3);
            /** The angular velocity vector of the rigidbody measured in radians per second. */
            public get angularVelocity(): UnityEngine.Vector3;
            public set angularVelocity(value: UnityEngine.Vector3);
            /** The drag of the object. */
            public get drag(): number;
            public set drag(value: number);
            /** The angular drag of the object. */
            public get angularDrag(): number;
            public set angularDrag(value: number);
            /** The mass of the rigidbody. */
            public get mass(): number;
            public set mass(value: number);
            /** Controls whether gravity affects this rigidbody. */
            public get useGravity(): boolean;
            public set useGravity(value: boolean);
            /** Maximum velocity of a rigidbody when moving out of penetrating state. */
            public get maxDepenetrationVelocity(): number;
            public set maxDepenetrationVelocity(value: number);
            /** Controls whether physics affects the rigidbody. */
            public get isKinematic(): boolean;
            public set isKinematic(value: boolean);
            /** Controls whether physics will change the rotation of the object. */
            public get freezeRotation(): boolean;
            public set freezeRotation(value: boolean);
            /** Controls which degrees of freedom are allowed for the simulation of this Rigidbody. */
            public get constraints(): UnityEngine.RigidbodyConstraints;
            public set constraints(value: UnityEngine.RigidbodyConstraints);
            /** The Rigidbody's collision detection mode. */
            public get collisionDetectionMode(): UnityEngine.CollisionDetectionMode;
            public set collisionDetectionMode(value: UnityEngine.CollisionDetectionMode);
            /** The center of mass relative to the transform's origin. */
            public get centerOfMass(): UnityEngine.Vector3;
            public set centerOfMass(value: UnityEngine.Vector3);
            /** The center of mass of the rigidbody in world space (Read Only). */
            public get worldCenterOfMass(): UnityEngine.Vector3;
            /** The rotation of the inertia tensor. */
            public get inertiaTensorRotation(): UnityEngine.Quaternion;
            public set inertiaTensorRotation(value: UnityEngine.Quaternion);
            /** The diagonal inertia tensor of mass relative to the center of mass. */
            public get inertiaTensor(): UnityEngine.Vector3;
            public set inertiaTensor(value: UnityEngine.Vector3);
            /** Should collision detection be enabled? (By default always enabled). */
            public get detectCollisions(): boolean;
            public set detectCollisions(value: boolean);
            /** The position of the rigidbody. */
            public get position(): UnityEngine.Vector3;
            public set position(value: UnityEngine.Vector3);
            /** The rotation of the Rigidbody. */
            public get rotation(): UnityEngine.Quaternion;
            public set rotation(value: UnityEngine.Quaternion);
            /** Interpolation allows you to smooth out the effect of running physics at a fixed frame rate. */
            public get interpolation(): UnityEngine.RigidbodyInterpolation;
            public set interpolation(value: UnityEngine.RigidbodyInterpolation);
            /** The solverIterations determines how accurately Rigidbody joints and collision contacts are resolved. Overrides Physics.defaultSolverIterations. Must be positive. */
            public get solverIterations(): number;
            public set solverIterations(value: number);
            /** The mass-normalized energy threshold, below which objects start going to sleep. */
            public get sleepThreshold(): number;
            public set sleepThreshold(value: number);
            /** The maximimum angular velocity of the rigidbody measured in radians per second. (Default 7) range { 0, infinity }. */
            public get maxAngularVelocity(): number;
            public set maxAngularVelocity(value: number);
            /** The solverVelocityIterations affects how how accurately Rigidbody joints and collision contacts are resolved. Overrides Physics.defaultSolverVelocityIterations. Must be positive. */
            public get solverVelocityIterations(): number;
            public set solverVelocityIterations(value: number);
            /** Sets the mass based on the attached colliders assuming a constant density. */
            public SetDensity ($density: number) : void
            /** Moves the kinematic Rigidbody towards position. * @param position Provides the new position for the Rigidbody object.
            */
            public MovePosition ($position: UnityEngine.Vector3) : void
            /** Rotates the rigidbody to rotation. * @param rot The new rotation for the Rigidbody.
            */
            public MoveRotation ($rot: UnityEngine.Quaternion) : void
            public Sleep () : void
            public IsSleeping () : boolean
            public WakeUp () : void
            public ResetCenterOfMass () : void
            public ResetInertiaTensor () : void
            /** The velocity relative to the rigidbody at the point relativePoint. */
            public GetRelativePointVelocity ($relativePoint: UnityEngine.Vector3) : UnityEngine.Vector3
            /** The velocity of the rigidbody at the point worldPoint in global space. */
            public GetPointVelocity ($worldPoint: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Adds a force to the Rigidbody. * @param force Force vector in world coordinates.
            * @param mode Type of force to apply.
            */
            public AddForce ($force: UnityEngine.Vector3, $mode: UnityEngine.ForceMode) : void
            /** Adds a force to the Rigidbody. * @param force Force vector in world coordinates.
            * @param mode Type of force to apply.
            */
            public AddForce ($force: UnityEngine.Vector3) : void
            /** Adds a force to the Rigidbody. * @param x Size of force along the world x-axis.
            * @param y Size of force along the world y-axis.
            * @param z Size of force along the world z-axis.
            * @param mode Type of force to apply.
            */
            public AddForce ($x: number, $y: number, $z: number, $mode: UnityEngine.ForceMode) : void
            /** Adds a force to the Rigidbody. * @param x Size of force along the world x-axis.
            * @param y Size of force along the world y-axis.
            * @param z Size of force along the world z-axis.
            * @param mode Type of force to apply.
            */
            public AddForce ($x: number, $y: number, $z: number) : void
            /** Adds a force to the rigidbody relative to its coordinate system. * @param force Force vector in local coordinates.
            */
            public AddRelativeForce ($force: UnityEngine.Vector3, $mode: UnityEngine.ForceMode) : void
            /** Adds a force to the rigidbody relative to its coordinate system. * @param force Force vector in local coordinates.
            */
            public AddRelativeForce ($force: UnityEngine.Vector3) : void
            /** Adds a force to the rigidbody relative to its coordinate system. * @param x Size of force along the local x-axis.
            * @param y Size of force along the local y-axis.
            * @param z Size of force along the local z-axis.
            */
            public AddRelativeForce ($x: number, $y: number, $z: number, $mode: UnityEngine.ForceMode) : void
            /** Adds a force to the rigidbody relative to its coordinate system. * @param x Size of force along the local x-axis.
            * @param y Size of force along the local y-axis.
            * @param z Size of force along the local z-axis.
            */
            public AddRelativeForce ($x: number, $y: number, $z: number) : void
            /** Adds a torque to the rigidbody. * @param torque Torque vector in world coordinates.
            */
            public AddTorque ($torque: UnityEngine.Vector3, $mode: UnityEngine.ForceMode) : void
            /** Adds a torque to the rigidbody. * @param torque Torque vector in world coordinates.
            */
            public AddTorque ($torque: UnityEngine.Vector3) : void
            /** Adds a torque to the rigidbody. * @param x Size of torque along the world x-axis.
            * @param y Size of torque along the world y-axis.
            * @param z Size of torque along the world z-axis.
            */
            public AddTorque ($x: number, $y: number, $z: number, $mode: UnityEngine.ForceMode) : void
            /** Adds a torque to the rigidbody. * @param x Size of torque along the world x-axis.
            * @param y Size of torque along the world y-axis.
            * @param z Size of torque along the world z-axis.
            */
            public AddTorque ($x: number, $y: number, $z: number) : void
            /** Adds a torque to the rigidbody relative to its coordinate system. * @param torque Torque vector in local coordinates.
            */
            public AddRelativeTorque ($torque: UnityEngine.Vector3, $mode: UnityEngine.ForceMode) : void
            /** Adds a torque to the rigidbody relative to its coordinate system. * @param torque Torque vector in local coordinates.
            */
            public AddRelativeTorque ($torque: UnityEngine.Vector3) : void
            /** Adds a torque to the rigidbody relative to its coordinate system. * @param x Size of torque along the local x-axis.
            * @param y Size of torque along the local y-axis.
            * @param z Size of torque along the local z-axis.
            */
            public AddRelativeTorque ($x: number, $y: number, $z: number, $mode: UnityEngine.ForceMode) : void
            /** Adds a torque to the rigidbody relative to its coordinate system. * @param x Size of torque along the local x-axis.
            * @param y Size of torque along the local y-axis.
            * @param z Size of torque along the local z-axis.
            */
            public AddRelativeTorque ($x: number, $y: number, $z: number) : void
            /** Applies force at position. As a result this will apply a torque and force on the object. * @param force Force vector in world coordinates.
            * @param position Position in world coordinates.
            */
            public AddForceAtPosition ($force: UnityEngine.Vector3, $position: UnityEngine.Vector3, $mode: UnityEngine.ForceMode) : void
            /** Applies force at position. As a result this will apply a torque and force on the object. * @param force Force vector in world coordinates.
            * @param position Position in world coordinates.
            */
            public AddForceAtPosition ($force: UnityEngine.Vector3, $position: UnityEngine.Vector3) : void
            /** Applies a force to a rigidbody that simulates explosion effects. * @param explosionForce The force of the explosion (which may be modified by distance).
            * @param explosionPosition The centre of the sphere within which the explosion has its effect.
            * @param explosionRadius The radius of the sphere within which the explosion has its effect.
            * @param upwardsModifier Adjustment to the apparent position of the explosion to make it seem to lift objects.
            * @param mode The method used to apply the force to its targets.
            */
            public AddExplosionForce ($explosionForce: number, $explosionPosition: UnityEngine.Vector3, $explosionRadius: number, $upwardsModifier: number, $mode: UnityEngine.ForceMode) : void
            /** Applies a force to a rigidbody that simulates explosion effects. * @param explosionForce The force of the explosion (which may be modified by distance).
            * @param explosionPosition The centre of the sphere within which the explosion has its effect.
            * @param explosionRadius The radius of the sphere within which the explosion has its effect.
            * @param upwardsModifier Adjustment to the apparent position of the explosion to make it seem to lift objects.
            * @param mode The method used to apply the force to its targets.
            */
            public AddExplosionForce ($explosionForce: number, $explosionPosition: UnityEngine.Vector3, $explosionRadius: number, $upwardsModifier: number) : void
            /** Applies a force to a rigidbody that simulates explosion effects. * @param explosionForce The force of the explosion (which may be modified by distance).
            * @param explosionPosition The centre of the sphere within which the explosion has its effect.
            * @param explosionRadius The radius of the sphere within which the explosion has its effect.
            * @param upwardsModifier Adjustment to the apparent position of the explosion to make it seem to lift objects.
            * @param mode The method used to apply the force to its targets.
            */
            public AddExplosionForce ($explosionForce: number, $explosionPosition: UnityEngine.Vector3, $explosionRadius: number) : void
            /** The closest point to the bounding box of the attached colliders. */
            public ClosestPointOnBounds ($position: UnityEngine.Vector3) : UnityEngine.Vector3
            /** Tests if a rigidbody would collide with anything, if it was moved through the Scene.
            * @param direction The direction into which to sweep the rigidbody.
            * @param hitInfo If true is returned, hitInfo will contain more information about where the collider was hit (See Also: RaycastHit).
            * @param maxDistance The length of the sweep.
            * @param queryTriggerInteraction Specifies whether this query should hit Triggers.
            * @returns True when the rigidbody sweep intersects any collider, otherwise false. 
            */
            public SweepTest ($direction: UnityEngine.Vector3, $hitInfo: $Ref<UnityEngine.RaycastHit>, $maxDistance: number, $queryTriggerInteraction: UnityEngine.QueryTriggerInteraction) : boolean
            public SweepTest ($direction: UnityEngine.Vector3, $hitInfo: $Ref<UnityEngine.RaycastHit>, $maxDistance: number) : boolean
            public SweepTest ($direction: UnityEngine.Vector3, $hitInfo: $Ref<UnityEngine.RaycastHit>) : boolean
            /** Like Rigidbody.SweepTest, but returns all hits.
            * @param direction The direction into which to sweep the rigidbody.
            * @param maxDistance The length of the sweep.
            * @param queryTriggerInteraction Specifies whether this query should hit Triggers.
            * @returns An array of all colliders hit in the sweep. 
            */
            public SweepTestAll ($direction: UnityEngine.Vector3, $maxDistance: number, $queryTriggerInteraction: UnityEngine.QueryTriggerInteraction) : System.Array$1<UnityEngine.RaycastHit>
            public SweepTestAll ($direction: UnityEngine.Vector3, $maxDistance: number) : System.Array$1<UnityEngine.RaycastHit>
            public SweepTestAll ($direction: UnityEngine.Vector3) : System.Array$1<UnityEngine.RaycastHit>
            public constructor ()
        }
        /** Use these flags to constrain motion of Rigidbodies. */
        enum RigidbodyConstraints
        { None = 0, FreezePositionX = 2, FreezePositionY = 4, FreezePositionZ = 8, FreezeRotationX = 16, FreezeRotationY = 32, FreezeRotationZ = 64, FreezePosition = 14, FreezeRotation = 112, FreezeAll = 126 }
        /** The collision detection mode constants used for Rigidbody.collisionDetectionMode. */
        enum CollisionDetectionMode
        { Discrete = 0, Continuous = 1, ContinuousDynamic = 2, ContinuousSpeculative = 3 }
        /** Rigidbody interpolation mode. */
        enum RigidbodyInterpolation
        { None = 0, Interpolate = 1, Extrapolate = 2 }
        /** Use ForceMode to specify how to apply a force using Rigidbody.AddForce. */
        enum ForceMode
        { Force = 0, Acceleration = 5, Impulse = 1, VelocityChange = 2 }
        /** Structure used to get information back from a raycast. */
        class RaycastHit extends System.ValueType
        {
        }
        /** Overrides the global Physics.queriesHitTriggers. */
        enum QueryTriggerInteraction
        { UseGlobal = 0, Ignore = 1, Collide = 2 }
        /** A box-shaped primitive collider. */
        class BoxCollider extends UnityEngine.Collider
        {
        /** The center of the box, measured in the object's local space. */
            public get center(): UnityEngine.Vector3;
            public set center(value: UnityEngine.Vector3);
            /** The size of the box, measured in the object's local space. */
            public get size(): UnityEngine.Vector3;
            public set size(value: UnityEngine.Vector3);
            public constructor ()
        }
        /** Represents an axis aligned bounding box. */
        class Bounds extends System.ValueType implements System.IEquatable$1<UnityEngine.Bounds>
        {
        }
        /** Physics material describes how to handle colliding objects (friction, bounciness). */
        class PhysicMaterial extends UnityEngine.Object
        {
        }
        /** Representation of rays. */
        class Ray extends System.ValueType
        {
        }
        /** Class containing methods to ease debugging while developing a game. */
        class Debug extends System.Object
        {
        /** Get default debug logger. */
            public static get unityLogger(): UnityEngine.ILogger;
            /** Reports whether the development console is visible. The development console cannot be made to appear using: */
            public static get developerConsoleVisible(): boolean;
            public static set developerConsoleVisible(value: boolean);
            /** In the Build Settings dialog there is a check box called "Development Build". */
            public static get isDebugBuild(): boolean;
            /** Draws a line between specified start and end points. * @param start Point in world space where the line should start.
            * @param end Point in world space where the line should end.
            * @param color Color of the line.
            * @param duration How long the line should be visible for.
            * @param depthTest Should the line be obscured by objects closer to the camera?
            */
            public static DrawLine ($start: UnityEngine.Vector3, $end: UnityEngine.Vector3, $color: UnityEngine.Color, $duration: number) : void
            /** Draws a line between specified start and end points. * @param start Point in world space where the line should start.
            * @param end Point in world space where the line should end.
            * @param color Color of the line.
            * @param duration How long the line should be visible for.
            * @param depthTest Should the line be obscured by objects closer to the camera?
            */
            public static DrawLine ($start: UnityEngine.Vector3, $end: UnityEngine.Vector3, $color: UnityEngine.Color) : void
            /** Draws a line between specified start and end points. * @param start Point in world space where the line should start.
            * @param end Point in world space where the line should end.
            * @param color Color of the line.
            * @param duration How long the line should be visible for.
            * @param depthTest Should the line be obscured by objects closer to the camera?
            */
            public static DrawLine ($start: UnityEngine.Vector3, $end: UnityEngine.Vector3) : void
            /** Draws a line between specified start and end points. * @param start Point in world space where the line should start.
            * @param end Point in world space where the line should end.
            * @param color Color of the line.
            * @param duration How long the line should be visible for.
            * @param depthTest Should the line be obscured by objects closer to the camera?
            */
            public static DrawLine ($start: UnityEngine.Vector3, $end: UnityEngine.Vector3, $color: UnityEngine.Color, $duration: number, $depthTest: boolean) : void
            /** Draws a line from start to start + dir in world coordinates. * @param start Point in world space where the ray should start.
            * @param dir Direction and length of the ray.
            * @param color Color of the drawn line.
            * @param duration How long the line will be visible for (in seconds).
            * @param depthTest Should the line be obscured by other objects closer to the camera?
            */
            public static DrawRay ($start: UnityEngine.Vector3, $dir: UnityEngine.Vector3, $color: UnityEngine.Color, $duration: number) : void
            /** Draws a line from start to start + dir in world coordinates. * @param start Point in world space where the ray should start.
            * @param dir Direction and length of the ray.
            * @param color Color of the drawn line.
            * @param duration How long the line will be visible for (in seconds).
            * @param depthTest Should the line be obscured by other objects closer to the camera?
            */
            public static DrawRay ($start: UnityEngine.Vector3, $dir: UnityEngine.Vector3, $color: UnityEngine.Color) : void
            /** Draws a line from start to start + dir in world coordinates. * @param start Point in world space where the ray should start.
            * @param dir Direction and length of the ray.
            * @param color Color of the drawn line.
            * @param duration How long the line will be visible for (in seconds).
            * @param depthTest Should the line be obscured by other objects closer to the camera?
            */
            public static DrawRay ($start: UnityEngine.Vector3, $dir: UnityEngine.Vector3) : void
            /** Draws a line from start to start + dir in world coordinates. * @param start Point in world space where the ray should start.
            * @param dir Direction and length of the ray.
            * @param color Color of the drawn line.
            * @param duration How long the line will be visible for (in seconds).
            * @param depthTest Should the line be obscured by other objects closer to the camera?
            */
            public static DrawRay ($start: UnityEngine.Vector3, $dir: UnityEngine.Vector3, $color: UnityEngine.Color, $duration: number, $depthTest: boolean) : void
            public static Break () : void
            public static DebugBreak () : void
            /** Logs a message to the Unity Console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static Log ($message: any) : void
            /** Logs a message to the Unity Console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static Log ($message: any, $context: UnityEngine.Object) : void
            /** Logs a formatted message to the Unity Console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            * @param logType Type of message e.g. warn or error etc.
            * @param logOptions Option flags to treat the log message special.
            */
            public static LogFormat ($format: string, ...args: any[]) : void
            /** Logs a formatted message to the Unity Console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            * @param logType Type of message e.g. warn or error etc.
            * @param logOptions Option flags to treat the log message special.
            */
            public static LogFormat ($context: UnityEngine.Object, $format: string, ...args: any[]) : void
            /** Logs a formatted message to the Unity Console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            * @param logType Type of message e.g. warn or error etc.
            * @param logOptions Option flags to treat the log message special.
            */
            public static LogFormat ($logType: UnityEngine.LogType, $logOptions: UnityEngine.LogOption, $context: UnityEngine.Object, $format: string, ...args: any[]) : void
            /** A variant of Debug.Log that logs an error message to the console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static LogError ($message: any) : void
            /** A variant of Debug.Log that logs an error message to the console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static LogError ($message: any, $context: UnityEngine.Object) : void
            /** Logs a formatted error message to the Unity console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static LogErrorFormat ($format: string, ...args: any[]) : void
            /** Logs a formatted error message to the Unity console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static LogErrorFormat ($context: UnityEngine.Object, $format: string, ...args: any[]) : void
            public static ClearDeveloperConsole () : void
            /** A variant of Debug.Log that logs an error message to the console. * @param context Object to which the message applies.
            * @param exception Runtime Exception.
            */
            public static LogException ($exception: System.Exception) : void
            /** A variant of Debug.Log that logs an error message to the console. * @param context Object to which the message applies.
            * @param exception Runtime Exception.
            */
            public static LogException ($exception: System.Exception, $context: UnityEngine.Object) : void
            /** A variant of Debug.Log that logs a warning message to the console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static LogWarning ($message: any) : void
            /** A variant of Debug.Log that logs a warning message to the console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static LogWarning ($message: any, $context: UnityEngine.Object) : void
            /** Logs a formatted warning message to the Unity Console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static LogWarningFormat ($format: string, ...args: any[]) : void
            /** Logs a formatted warning message to the Unity Console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static LogWarningFormat ($context: UnityEngine.Object, $format: string, ...args: any[]) : void
            /** Assert a condition and logs an error message to the Unity console on failure. * @param condition Condition you expect to be true.
            * @param context Object to which the message applies.
            * @param message String or object to be converted to string representation for display.
            */
            public static Assert ($condition: boolean) : void
            /** Assert a condition and logs an error message to the Unity console on failure. * @param condition Condition you expect to be true.
            * @param context Object to which the message applies.
            * @param message String or object to be converted to string representation for display.
            */
            public static Assert ($condition: boolean, $context: UnityEngine.Object) : void
            /** Assert a condition and logs an error message to the Unity console on failure. * @param condition Condition you expect to be true.
            * @param context Object to which the message applies.
            * @param message String or object to be converted to string representation for display.
            */
            public static Assert ($condition: boolean, $message: any) : void
            public static Assert ($condition: boolean, $message: string) : void
            /** Assert a condition and logs an error message to the Unity console on failure. * @param condition Condition you expect to be true.
            * @param context Object to which the message applies.
            * @param message String or object to be converted to string representation for display.
            */
            public static Assert ($condition: boolean, $message: any, $context: UnityEngine.Object) : void
            public static Assert ($condition: boolean, $message: string, $context: UnityEngine.Object) : void
            /** Assert a condition and logs a formatted error message to the Unity console on failure. * @param condition Condition you expect to be true.
            * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static AssertFormat ($condition: boolean, $format: string, ...args: any[]) : void
            /** Assert a condition and logs a formatted error message to the Unity console on failure. * @param condition Condition you expect to be true.
            * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static AssertFormat ($condition: boolean, $context: UnityEngine.Object, $format: string, ...args: any[]) : void
            /** A variant of Debug.Log that logs an assertion message to the console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static LogAssertion ($message: any) : void
            /** A variant of Debug.Log that logs an assertion message to the console. * @param message String or object to be converted to string representation for display.
            * @param context Object to which the message applies.
            */
            public static LogAssertion ($message: any, $context: UnityEngine.Object) : void
            /** Logs a formatted assertion message to the Unity console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static LogAssertionFormat ($format: string, ...args: any[]) : void
            /** Logs a formatted assertion message to the Unity console. * @param format A composite format string.
            * @param args Format arguments.
            * @param context Object to which the message applies.
            */
            public static LogAssertionFormat ($context: UnityEngine.Object, $format: string, ...args: any[]) : void
            public constructor ()
        }
        interface ILogger extends UnityEngine.ILogHandler
        {
        }
        interface ILogHandler
        {
        }
        /** Representation of RGBA colors. */
        class Color extends System.ValueType implements System.IEquatable$1<UnityEngine.Color>
        {
        }
        /** The type of the log message in Debug.unityLogger.Log or delegate registered with Application.RegisterLogCallback. */
        enum LogType
        { Error = 0, Assert = 1, Warning = 2, Log = 3, Exception = 4 }
        /** Option flags for specifying special treatment of a log message. */
        enum LogOption
        { None = 0, NoStacktrace = 1 }
    }
    namespace System {
        class Object
        {
        }
        class String extends System.Object implements System.ICloneable, System.Collections.IEnumerable, System.IComparable, System.IComparable$1<string>, System.IConvertible, System.IEquatable$1<string>, System.Collections.Generic.IEnumerable$1<number>
        {
        }
        interface ICloneable
        {
        }
        interface IComparable
        {
        }
        interface IComparable$1<T>
        {
        }
        interface IConvertible
        {
        }
        interface IEquatable$1<T>
        {
        }
        class Char extends System.ValueType implements System.IComparable, System.IComparable$1<number>, System.IConvertible, System.IEquatable$1<number>
        {
        }
        class ValueType extends System.Object
        {
        }
        interface Action
        { () : void; }
        var Action: { new (func: () => void): Action; }
        class Void extends System.ValueType
        {
        }
        interface MulticastDelegate
        { (...args:any[]) : any; }
        var MulticastDelegate: { new (func: (...args:any[]) => any): MulticastDelegate; }
        class Delegate extends System.Object implements System.ICloneable, System.Runtime.Serialization.ISerializable
        {
        }
        interface Action$1<T>
        { (obj: T) : void; }
        class Type extends System.Reflection.MemberInfo implements System.Reflection.IReflect, System.Runtime.InteropServices._Type, System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
            public static FilterAttribute : System.Reflection.MemberFilter
            public static FilterName : System.Reflection.MemberFilter
            public static FilterNameIgnoreCase : System.Reflection.MemberFilter
            public static Missing : any
            public static Delimiter : number
            public static EmptyTypes : System.Array$1<System.Type>
            public get MemberType(): System.Reflection.MemberTypes;
            public get DeclaringType(): System.Type;
            public get DeclaringMethod(): System.Reflection.MethodBase;
            public get ReflectedType(): System.Type;
            public get StructLayoutAttribute(): System.Runtime.InteropServices.StructLayoutAttribute;
            public get GUID(): System.Guid;
            public static get DefaultBinder(): System.Reflection.Binder;
            public get Module(): System.Reflection.Module;
            public get Assembly(): System.Reflection.Assembly;
            public get TypeHandle(): System.RuntimeTypeHandle;
            public get FullName(): string;
            public get Namespace(): string;
            public get AssemblyQualifiedName(): string;
            public get BaseType(): System.Type;
            public get TypeInitializer(): System.Reflection.ConstructorInfo;
            public get IsNested(): boolean;
            public get Attributes(): System.Reflection.TypeAttributes;
            public get GenericParameterAttributes(): System.Reflection.GenericParameterAttributes;
            public get IsVisible(): boolean;
            public get IsNotPublic(): boolean;
            public get IsPublic(): boolean;
            public get IsNestedPublic(): boolean;
            public get IsNestedPrivate(): boolean;
            public get IsNestedFamily(): boolean;
            public get IsNestedAssembly(): boolean;
            public get IsNestedFamANDAssem(): boolean;
            public get IsNestedFamORAssem(): boolean;
            public get IsAutoLayout(): boolean;
            public get IsLayoutSequential(): boolean;
            public get IsExplicitLayout(): boolean;
            public get IsClass(): boolean;
            public get IsInterface(): boolean;
            public get IsValueType(): boolean;
            public get IsAbstract(): boolean;
            public get IsSealed(): boolean;
            public get IsEnum(): boolean;
            public get IsSpecialName(): boolean;
            public get IsImport(): boolean;
            public get IsSerializable(): boolean;
            public get IsAnsiClass(): boolean;
            public get IsUnicodeClass(): boolean;
            public get IsAutoClass(): boolean;
            public get IsArray(): boolean;
            public get IsGenericType(): boolean;
            public get IsGenericTypeDefinition(): boolean;
            public get IsConstructedGenericType(): boolean;
            public get IsGenericParameter(): boolean;
            public get GenericParameterPosition(): number;
            public get ContainsGenericParameters(): boolean;
            public get IsByRef(): boolean;
            public get IsPointer(): boolean;
            public get IsPrimitive(): boolean;
            public get IsCOMObject(): boolean;
            public get HasElementType(): boolean;
            public get IsContextful(): boolean;
            public get IsMarshalByRef(): boolean;
            public get GenericTypeArguments(): System.Array$1<System.Type>;
            public get IsSecurityCritical(): boolean;
            public get IsSecuritySafeCritical(): boolean;
            public get IsSecurityTransparent(): boolean;
            public get UnderlyingSystemType(): System.Type;
            public get IsSZArray(): boolean;
            public static GetType ($typeName: string, $assemblyResolver: System.Func$2<System.Reflection.AssemblyName, System.Reflection.Assembly>, $typeResolver: System.Func$4<System.Reflection.Assembly, string, boolean, System.Type>) : System.Type
            public static GetType ($typeName: string, $assemblyResolver: System.Func$2<System.Reflection.AssemblyName, System.Reflection.Assembly>, $typeResolver: System.Func$4<System.Reflection.Assembly, string, boolean, System.Type>, $throwOnError: boolean) : System.Type
            public static GetType ($typeName: string, $assemblyResolver: System.Func$2<System.Reflection.AssemblyName, System.Reflection.Assembly>, $typeResolver: System.Func$4<System.Reflection.Assembly, string, boolean, System.Type>, $throwOnError: boolean, $ignoreCase: boolean) : System.Type
            public MakePointerType () : System.Type
            public MakeByRefType () : System.Type
            public MakeArrayType () : System.Type
            public MakeArrayType ($rank: number) : System.Type
            public static GetTypeFromProgID ($progID: string) : System.Type
            public static GetTypeFromProgID ($progID: string, $throwOnError: boolean) : System.Type
            public static GetTypeFromProgID ($progID: string, $server: string) : System.Type
            public static GetTypeFromProgID ($progID: string, $server: string, $throwOnError: boolean) : System.Type
            public static GetTypeFromCLSID ($clsid: System.Guid) : System.Type
            public static GetTypeFromCLSID ($clsid: System.Guid, $throwOnError: boolean) : System.Type
            public static GetTypeFromCLSID ($clsid: System.Guid, $server: string) : System.Type
            public static GetTypeFromCLSID ($clsid: System.Guid, $server: string, $throwOnError: boolean) : System.Type
            public static GetTypeCode ($type: System.Type) : System.TypeCode
            public InvokeMember ($name: string, $invokeAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $target: any, $args: System.Array$1<any>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>, $culture: System.Globalization.CultureInfo, $namedParameters: System.Array$1<string>) : any
            public InvokeMember ($name: string, $invokeAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $target: any, $args: System.Array$1<any>, $culture: System.Globalization.CultureInfo) : any
            public InvokeMember ($name: string, $invokeAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $target: any, $args: System.Array$1<any>) : any
            public static GetTypeHandle ($o: any) : System.RuntimeTypeHandle
            public GetArrayRank () : number
            public GetConstructor ($bindingAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $callConvention: System.Reflection.CallingConventions, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.ConstructorInfo
            public GetConstructor ($bindingAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.ConstructorInfo
            public GetConstructor ($types: System.Array$1<System.Type>) : System.Reflection.ConstructorInfo
            public GetConstructors () : System.Array$1<System.Reflection.ConstructorInfo>
            public GetConstructors ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.ConstructorInfo>
            public GetMethod ($name: string, $bindingAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $callConvention: System.Reflection.CallingConventions, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.MethodInfo
            public GetMethod ($name: string, $bindingAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.MethodInfo
            public GetMethod ($name: string, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.MethodInfo
            public GetMethod ($name: string, $types: System.Array$1<System.Type>) : System.Reflection.MethodInfo
            public GetMethod ($name: string, $bindingAttr: System.Reflection.BindingFlags) : System.Reflection.MethodInfo
            public GetMethod ($name: string) : System.Reflection.MethodInfo
            public GetMethods () : System.Array$1<System.Reflection.MethodInfo>
            public GetMethods ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.MethodInfo>
            public GetField ($name: string, $bindingAttr: System.Reflection.BindingFlags) : System.Reflection.FieldInfo
            public GetField ($name: string) : System.Reflection.FieldInfo
            public GetFields () : System.Array$1<System.Reflection.FieldInfo>
            public GetFields ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.FieldInfo>
            public GetInterface ($name: string) : System.Type
            public GetInterface ($name: string, $ignoreCase: boolean) : System.Type
            public GetInterfaces () : System.Array$1<System.Type>
            public FindInterfaces ($filter: System.Reflection.TypeFilter, $filterCriteria: any) : System.Array$1<System.Type>
            public GetEvent ($name: string) : System.Reflection.EventInfo
            public GetEvent ($name: string, $bindingAttr: System.Reflection.BindingFlags) : System.Reflection.EventInfo
            public GetEvents () : System.Array$1<System.Reflection.EventInfo>
            public GetEvents ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.EventInfo>
            public GetProperty ($name: string, $bindingAttr: System.Reflection.BindingFlags, $binder: System.Reflection.Binder, $returnType: System.Type, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.PropertyInfo
            public GetProperty ($name: string, $returnType: System.Type, $types: System.Array$1<System.Type>, $modifiers: System.Array$1<System.Reflection.ParameterModifier>) : System.Reflection.PropertyInfo
            public GetProperty ($name: string, $bindingAttr: System.Reflection.BindingFlags) : System.Reflection.PropertyInfo
            public GetProperty ($name: string, $returnType: System.Type, $types: System.Array$1<System.Type>) : System.Reflection.PropertyInfo
            public GetProperty ($name: string, $types: System.Array$1<System.Type>) : System.Reflection.PropertyInfo
            public GetProperty ($name: string, $returnType: System.Type) : System.Reflection.PropertyInfo
            public GetProperty ($name: string) : System.Reflection.PropertyInfo
            public GetProperties ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.PropertyInfo>
            public GetProperties () : System.Array$1<System.Reflection.PropertyInfo>
            public GetNestedTypes () : System.Array$1<System.Type>
            public GetNestedTypes ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Type>
            public GetNestedType ($name: string) : System.Type
            public GetNestedType ($name: string, $bindingAttr: System.Reflection.BindingFlags) : System.Type
            public GetMember ($name: string) : System.Array$1<System.Reflection.MemberInfo>
            public GetMember ($name: string, $bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.MemberInfo>
            public GetMember ($name: string, $type: System.Reflection.MemberTypes, $bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.MemberInfo>
            public GetMembers () : System.Array$1<System.Reflection.MemberInfo>
            public GetMembers ($bindingAttr: System.Reflection.BindingFlags) : System.Array$1<System.Reflection.MemberInfo>
            public GetDefaultMembers () : System.Array$1<System.Reflection.MemberInfo>
            public FindMembers ($memberType: System.Reflection.MemberTypes, $bindingAttr: System.Reflection.BindingFlags, $filter: System.Reflection.MemberFilter, $filterCriteria: any) : System.Array$1<System.Reflection.MemberInfo>
            public GetGenericParameterConstraints () : System.Array$1<System.Type>
            public MakeGenericType (...typeArguments: System.Type[]) : System.Type
            public GetElementType () : System.Type
            public GetGenericArguments () : System.Array$1<System.Type>
            public GetGenericTypeDefinition () : System.Type
            public GetEnumNames () : System.Array$1<string>
            public GetEnumValues () : System.Array
            public GetEnumUnderlyingType () : System.Type
            public IsEnumDefined ($value: any) : boolean
            public GetEnumName ($value: any) : string
            public IsSubclassOf ($c: System.Type) : boolean
            public IsInstanceOfType ($o: any) : boolean
            public IsAssignableFrom ($c: System.Type) : boolean
            public IsEquivalentTo ($other: System.Type) : boolean
            public static GetTypeArray ($args: System.Array$1<any>) : System.Array$1<System.Type>
            public Equals ($o: any) : boolean
            public Equals ($o: System.Type) : boolean
            public static op_Equality ($left: System.Type, $right: System.Type) : boolean
            public static op_Inequality ($left: System.Type, $right: System.Type) : boolean
            public GetInterfaceMap ($interfaceType: System.Type) : System.Reflection.InterfaceMapping
            public GetType () : System.Type
            public static GetType ($typeName: string) : System.Type
            public static GetType ($typeName: string, $throwOnError: boolean) : System.Type
            public static GetType ($typeName: string, $throwOnError: boolean, $ignoreCase: boolean) : System.Type
            public static ReflectionOnlyGetType ($typeName: string, $throwIfNotFound: boolean, $ignoreCase: boolean) : System.Type
            public static GetTypeFromHandle ($handle: System.RuntimeTypeHandle) : System.Type
        }
        class Boolean extends System.ValueType implements System.IComparable, System.IComparable$1<boolean>, System.IConvertible, System.IEquatable$1<boolean>
        {
        }
        class Enum extends System.ValueType implements System.IComparable, System.IConvertible, System.IFormattable
        {
        }
        interface IFormattable
        {
        }
        interface Func$2<T, TResult>
        { (arg: T) : TResult; }
        interface Func$4<T1, T2, T3, TResult>
        { (arg1: T1, arg2: T2, arg3: T3) : TResult; }
        class Attribute extends System.Object implements System.Runtime.InteropServices._Attribute
        {
        }
        class Int32 extends System.ValueType implements System.IComparable, System.IComparable$1<number>, System.IConvertible, System.IEquatable$1<number>, System.IFormattable
        {
        }
        class Guid extends System.ValueType implements System.IComparable, System.IComparable$1<System.Guid>, System.IEquatable$1<System.Guid>, System.IFormattable
        {
        }
        enum TypeCode
        { Empty = 0, Object = 1, DBNull = 2, Boolean = 3, Char = 4, SByte = 5, Byte = 6, Int16 = 7, UInt16 = 8, Int32 = 9, UInt32 = 10, Int64 = 11, UInt64 = 12, Single = 13, Double = 14, Decimal = 15, DateTime = 16, String = 18 }
        class Array extends System.Object implements System.ICloneable, System.Collections.IEnumerable, System.Collections.IList, System.Collections.IStructuralComparable, System.Collections.IStructuralEquatable, System.Collections.ICollection
        {
        }
        interface IFormatProvider
        {
        }
        class RuntimeTypeHandle extends System.ValueType implements System.Runtime.Serialization.ISerializable
        {
        }
        class Single extends System.ValueType implements System.IComparable, System.IComparable$1<number>, System.IConvertible, System.IEquatable$1<number>, System.IFormattable
        {
        }
        class UInt64 extends System.ValueType implements System.IComparable, System.IComparable$1<bigint>, System.IConvertible, System.IEquatable$1<bigint>, System.IFormattable
        {
        }
        class Exception extends System.Object implements System.Runtime.InteropServices._Exception, System.Runtime.Serialization.ISerializable
        {
        }
    }
    namespace System.Collections {
        interface IEnumerable
        {
        }
        interface IList extends System.Collections.IEnumerable, System.Collections.ICollection
        {
        }
        interface ICollection extends System.Collections.IEnumerable
        {
        }
        interface IStructuralComparable
        {
        }
        interface IStructuralEquatable
        {
        }
        interface IEnumerator
        {
        }
    }
    namespace System.Collections.Generic {
        interface IEnumerable$1<T> extends System.Collections.IEnumerable
        {
        }
        interface IList$1<T> extends System.Collections.IEnumerable, System.Collections.Generic.ICollection$1<T>, System.Collections.Generic.IEnumerable$1<T>
        {
        }
        interface ICollection$1<T> extends System.Collections.IEnumerable, System.Collections.Generic.IEnumerable$1<T>
        {
        }
        interface IReadOnlyCollection$1<T> extends System.Collections.IEnumerable, System.Collections.Generic.IEnumerable$1<T>
        {
        }
        interface IReadOnlyList$1<T> extends System.Collections.IEnumerable, System.Collections.Generic.IReadOnlyCollection$1<T>, System.Collections.Generic.IEnumerable$1<T>
        {
        }
        class List$1<T> extends System.Object implements System.Collections.IEnumerable, System.Collections.Generic.IList$1<T>, System.Collections.Generic.IReadOnlyCollection$1<T>, System.Collections.Generic.IReadOnlyList$1<T>, System.Collections.IList, System.Collections.Generic.ICollection$1<T>, System.Collections.ICollection, System.Collections.Generic.IEnumerable$1<T>
        {
        }
    }
    namespace System.Runtime.Serialization {
        interface ISerializable
        {
        }
        interface IDeserializationCallback
        {
        }
    }
    namespace System.Reflection {
        class MemberInfo extends System.Object implements System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
        }
        interface ICustomAttributeProvider
        {
        }
        interface IReflect
        {
        }
        interface MemberFilter
        { (m: System.Reflection.MemberInfo, filterCriteria: any) : boolean; }
        var MemberFilter: { new (func: (m: System.Reflection.MemberInfo, filterCriteria: any) => boolean): MemberFilter; }
        enum MemberTypes
        { Constructor = 1, Event = 2, Field = 4, Method = 8, Property = 16, TypeInfo = 32, Custom = 64, NestedType = 128, All = 191 }
        class MethodBase extends System.Reflection.MemberInfo implements System.Runtime.InteropServices._MethodBase, System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
        }
        class AssemblyName extends System.Object implements System.ICloneable, System.Runtime.Serialization.IDeserializationCallback, System.Runtime.InteropServices._AssemblyName, System.Runtime.Serialization.ISerializable
        {
        }
        class Assembly extends System.Object implements System.Security.IEvidenceFactory, System.Runtime.InteropServices._Assembly, System.Reflection.ICustomAttributeProvider, System.Runtime.Serialization.ISerializable
        {
        }
        class Binder extends System.Object
        {
        }
        enum BindingFlags
        { Default = 0, IgnoreCase = 1, DeclaredOnly = 2, Instance = 4, Static = 8, Public = 16, NonPublic = 32, FlattenHierarchy = 64, InvokeMethod = 256, CreateInstance = 512, GetField = 1024, SetField = 2048, GetProperty = 4096, SetProperty = 8192, PutDispProperty = 16384, PutRefDispProperty = 32768, ExactBinding = 65536, SuppressChangeType = 131072, OptionalParamBinding = 262144, IgnoreReturn = 16777216 }
        class ParameterModifier extends System.ValueType
        {
        }
        class Module extends System.Object implements System.Runtime.InteropServices._Module, System.Reflection.ICustomAttributeProvider, System.Runtime.Serialization.ISerializable
        {
        }
        class ConstructorInfo extends System.Reflection.MethodBase implements System.Runtime.InteropServices._MethodBase, System.Runtime.InteropServices._ConstructorInfo, System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
        }
        enum CallingConventions
        { Standard = 1, VarArgs = 2, Any = 3, HasThis = 32, ExplicitThis = 64 }
        class MethodInfo extends System.Reflection.MethodBase implements System.Runtime.InteropServices._MethodBase, System.Runtime.InteropServices._MethodInfo, System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
        }
        class FieldInfo extends System.Reflection.MemberInfo implements System.Runtime.InteropServices._FieldInfo, System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
        }
        interface TypeFilter
        { (m: System.Type, filterCriteria: any) : boolean; }
        var TypeFilter: { new (func: (m: System.Type, filterCriteria: any) => boolean): TypeFilter; }
        class EventInfo extends System.Reflection.MemberInfo implements System.Runtime.InteropServices._EventInfo, System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._MemberInfo
        {
        }
        class PropertyInfo extends System.Reflection.MemberInfo implements System.Reflection.ICustomAttributeProvider, System.Runtime.InteropServices._PropertyInfo, System.Runtime.InteropServices._MemberInfo
        {
        }
        enum TypeAttributes
        { VisibilityMask = 7, NotPublic = 0, Public = 1, NestedPublic = 2, NestedPrivate = 3, NestedFamily = 4, NestedAssembly = 5, NestedFamANDAssem = 6, NestedFamORAssem = 7, LayoutMask = 24, AutoLayout = 0, SequentialLayout = 8, ExplicitLayout = 16, ClassSemanticsMask = 32, Class = 0, Interface = 32, Abstract = 128, Sealed = 256, SpecialName = 1024, Import = 4096, Serializable = 8192, WindowsRuntime = 16384, StringFormatMask = 196608, AnsiClass = 0, UnicodeClass = 65536, AutoClass = 131072, CustomFormatClass = 196608, CustomFormatMask = 12582912, BeforeFieldInit = 1048576, ReservedMask = 264192, RTSpecialName = 2048, HasSecurity = 262144 }
        enum GenericParameterAttributes
        { None = 0, VarianceMask = 3, Covariant = 1, Contravariant = 2, SpecialConstraintMask = 28, ReferenceTypeConstraint = 4, NotNullableValueTypeConstraint = 8, DefaultConstructorConstraint = 16 }
        class InterfaceMapping extends System.ValueType
        {
        }
    }
    namespace System.Runtime.InteropServices {
        interface _MemberInfo
        {
        }
        interface _Type
        {
        }
        interface _MethodBase
        {
        }
        interface _AssemblyName
        {
        }
        interface _Assembly
        {
        }
        class StructLayoutAttribute extends System.Attribute implements System.Runtime.InteropServices._Attribute
        {
        }
        interface _Attribute
        {
        }
        interface _Module
        {
        }
        interface _ConstructorInfo
        {
        }
        interface _MethodInfo
        {
        }
        interface _FieldInfo
        {
        }
        interface _EventInfo
        {
        }
        interface _PropertyInfo
        {
        }
        interface _Exception
        {
        }
    }
    namespace System.Security {
        interface IEvidenceFactory
        {
        }
    }
    namespace System.Globalization {
        class CultureInfo extends System.Object implements System.ICloneable, System.IFormatProvider
        {
        }
    }
    namespace UnityEngine.SceneManagement {
        /** Run-time data structure for *.unity file. */
        class Scene extends System.ValueType
        {
        }
    }
}
