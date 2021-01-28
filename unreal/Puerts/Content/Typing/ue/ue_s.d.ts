/// <reference path="puerts.d.ts" />
declare module "ue" {
    class Guid {
        constructor();
        constructor(InA: number, InB: number, InC: number, InD: number);
        A: number;
        B: number;
        C: number;
        D: number;
        set_Item(Index: number): $Ref<number>;
        get_Item(Index: number): number;
        Invalidate(): void;
        IsValid(): boolean;
        ToString(): string;
        ToString(Format: number): string;
        static NewGuid(): Guid;
        static Parse(GuidString: string, OutGuid: $Ref<Guid>): boolean;
        static ParseExact(GuidString: string, Format: number, OutGuid: $Ref<Guid>): boolean;
        
        static StaticClass(): Class;
        
    }
    class Box2D {
        constructor();
        constructor(Param1: number);
        constructor(InMin: Vector2D, InMax: Vector2D);
        constructor(Points: Vector2D, Count: number);
        Min: Vector2D;
        Max: Vector2D;
        bIsValid: boolean;
        op_Equality(Other: Box2D): boolean;
        op_Inequality(Other: Box2D): boolean;
        op_Addition(Other: Vector2D): Box2D;
        op_Addition(Other: Box2D): Box2D;
        set_Item(Index: number): $Ref<Vector2D>;
        ComputeSquaredDistanceToPoint(Point: Vector2D): number;
        ExpandBy(W: number): Box2D;
        GetArea(): number;
        GetCenter(): Vector2D;
        GetCenterAndExtents(center: $Ref<Vector2D>, Extents: $Ref<Vector2D>): void;
        GetClosestPointTo(Point: Vector2D): Vector2D;
        GetExtent(): Vector2D;
        GetSize(): Vector2D;
        Init(): void;
        Intersect(other: Box2D): boolean;
        IsInside(TestPoint: Vector2D): boolean;
        IsInside(Other: Box2D): boolean;
        ShiftBy(Offset: Vector2D): Box2D;
        ToString(): string;
        
        static StaticClass(): Class;
        
    }
    class Color {
        constructor();
        constructor(Param1: number);
        constructor(InR: number, InG: number, InB: number, InA: number);
        constructor(InColor: number);
        DWColor(): $Ref<number>;
        DWColor(): number;
        op_Equality(C: Color): boolean;
        op_Inequality(C: Color): boolean;
        FromRGBE(): LinearColor;
        static FromHex(HexString: string): Color;
        static MakeRandomColor(): Color;
        static MakeRedToGreenColorFromScalar(Scalar: number): Color;
        static MakeFromColorTemperature(Temp: number): Color;
        WithAlpha(Alpha: number): Color;
        ReinterpretAsLinear(): LinearColor;
        ToHex(): string;
        ToString(): string;
        InitFromString(InSourceString: string): boolean;
        ToPackedARGB(): number;
        ToPackedABGR(): number;
        ToPackedRGBA(): number;
        ToPackedBGRA(): number;
        
        static StaticClass(): Class;
        
    }
    class LinearColor {
        constructor();
        constructor(Param1: number);
        constructor(InR: number, InG: number, InB: number, InA: number);
        constructor(Color: Color);
        constructor(Vector: Vector);
        constructor(Vector: Vector4);
        R: number;
        G: number;
        B: number;
        A: number;
        ToRGBE(): Color;
        static FromSRGBColor(Color: Color): LinearColor;
        static FromPow22Color(Color: Color): LinearColor;
        Component(Index: number): $Ref<number>;
        Component(Index: number): number;
        op_Addition(ColorB: LinearColor): LinearColor;
        op_Subtraction(ColorB: LinearColor): LinearColor;
        op_Multiply(ColorB: LinearColor): LinearColor;
        op_Multiply(Scalar: number): LinearColor;
        op_Division(ColorB: LinearColor): LinearColor;
        op_Division(Scalar: number): LinearColor;
        GetClamped(InMin: number, InMax: number): LinearColor;
        op_Equality(ColorB: LinearColor): boolean;
        op_Inequality(Other: LinearColor): boolean;
        Equals(ColorB: LinearColor, Tolerance: number): boolean;
        CopyWithNewOpacity(NewOpacicty: number): LinearColor;
        static MakeRandomColor(): LinearColor;
        static MakeFromColorTemperature(Temp: number): LinearColor;
        static Dist(V1: LinearColor, V2: LinearColor): number;
        LinearRGBToHSV(): LinearColor;
        HSVToLinearRGB(): LinearColor;
        static LerpUsingHSV(From: LinearColor, To: LinearColor, Progress: number): LinearColor;
        Quantize(): Color;
        QuantizeRound(): Color;
        ToFColor(bSRGB: boolean): Color;
        Desaturate(Desaturation: number): LinearColor;
        ComputeLuminance(): number;
        GetMax(): number;
        IsAlmostBlack(): boolean;
        GetMin(): number;
        GetLuminance(): number;
        ToString(): string;
        InitFromString(InSourceString: string): boolean;
        
        static StaticClass(): Class;
        
    }
    class Quat {
        constructor();
        constructor(Param1: number);
        constructor(InX: number, InY: number, InZ: number, InW: number);
        constructor(R: Rotator);
        constructor(Axis: Vector, AngleRad: number);
        X: number;
        Y: number;
        Z: number;
        W: number;
        op_Addition(Q: Quat): Quat;
        op_Subtraction(Q: Quat): Quat;
        Equals(Q: Quat, Tolerance: number): boolean;
        IsIdentity(Tolerance: number): boolean;
        op_Multiply(Q: Quat): Quat;
        op_Multiply(V: Vector): Vector;
        op_Multiply(Scale: number): Quat;
        op_Division(Scale: number): Quat;
        op_Equality(Q: Quat): boolean;
        op_Inequality(Q: Quat): boolean;
        op_BitwiseOr(Q: Quat): number;
        static MakeFromEuler(Euler: Vector): Quat;
        Euler(): Vector;
        Normalize(Tolerance: number): void;
        GetNormalized(Tolerance: number): Quat;
        IsNormalized(): boolean;
        Size(): number;
        SizeSquared(): number;
        GetAngle(): number;
        ToAxisAndAngle(Axis: $Ref<Vector>, Angle: $Ref<number>): void;
        ToSwingTwist(InTwistAxis: Vector, OutSwing: $Ref<Quat>, OutTwist: $Ref<Quat>): void;
        RotateVector(V: Vector): Vector;
        UnrotateVector(V: Vector): Vector;
        Log(): Quat;
        Exp(): Quat;
        Inverse(): Quat;
        EnforceShortestArcWith(OtherQuat: Quat): void;
        GetAxisX(): Vector;
        GetAxisY(): Vector;
        GetAxisZ(): Vector;
        GetForwardVector(): Vector;
        GetRightVector(): Vector;
        GetUpVector(): Vector;
        Vector(): Vector;
        Rotator(): Rotator;
        GetRotationAxis(): Vector;
        AngularDistance(Q: Quat): number;
        ContainsNaN(): boolean;
        ToString(): string;
        InitFromString(InSourceString: string): boolean;
        DiagnosticCheckNaN(): void;
        static FindBetween(Vector1: Vector, Vector2: Vector): Quat;
        static FindBetweenNormals(Normal1: Vector, Normal2: Vector): Quat;
        static FindBetweenVectors(Vector1: Vector, Vector2: Vector): Quat;
        static Error(Q1: Quat, Q2: Quat): number;
        static ErrorAutoNormalize(A: Quat, B: Quat): number;
        static FastLerp(A: Quat, B: Quat, Alpha: number): Quat;
        static FastBilerp(P00: Quat, P10: Quat, P01: Quat, P11: Quat, FracX: number, FracY: number): Quat;
        static Slerp_NotNormalized(Quat1: Quat, Quat2: Quat, Slerp: number): Quat;
        static Slerp(Quat1: Quat, Quat2: Quat, Slerp: number): Quat;
        static SlerpFullPath_NotNormalized(quat1: Quat, quat2: Quat, Alpha: number): Quat;
        static SlerpFullPath(quat1: Quat, quat2: Quat, Alpha: number): Quat;
        static Squad(quat1: Quat, tang1: Quat, quat2: Quat, tang2: Quat, Alpha: number): Quat;
        static SquadFullPath(quat1: Quat, tang1: Quat, quat2: Quat, tang2: Quat, Alpha: number): Quat;
        static CalcTangents(PrevP: Quat, P: Quat, NextP: Quat, Tension: number, OutTan: $Ref<Quat>): void;
        
        static StaticClass(): Class;
        
    }
    class Rotator {
        constructor();
        constructor(InF: number);
        constructor(InPitch: number, InYaw: number, InRoll: number);
        constructor(Param1: number);
        constructor(Quat: Quat);
        Pitch: number;
        Yaw: number;
        Roll: number;
        DiagnosticCheckNaN(): void;
        op_Addition(R: Rotator): Rotator;
        op_Subtraction(R: Rotator): Rotator;
        op_Multiply(Scale: number): Rotator;
        op_Equality(R: Rotator): boolean;
        op_Inequality(V: Rotator): boolean;
        IsNearlyZero(Tolerance: number): boolean;
        IsZero(): boolean;
        Equals(R: Rotator, Tolerance: number): boolean;
        Add(DeltaPitch: number, DeltaYaw: number, DeltaRoll: number): Rotator;
        GetInverse(): Rotator;
        GridSnap(RotGrid: Rotator): Rotator;
        Vector(): Vector;
        Quaternion(): Quat;
        Euler(): Vector;
        RotateVector(V: Vector): Vector;
        UnrotateVector(V: Vector): Vector;
        Clamp(): Rotator;
        GetNormalized(): Rotator;
        GetDenormalized(): Rotator;
        GetComponentForAxis(Axis: number): number;
        SetComponentForAxis(Axis: number, Component: number): void;
        Normalize(): void;
        GetWindingAndRemainder(Winding: $Ref<Rotator>, Remainder: $Ref<Rotator>): void;
        GetManhattanDistance(Rotator: Rotator): number;
        GetEquivalentRotator(): Rotator;
        SetClosestToMe(MakeClosest: $Ref<Rotator>): void;
        ToString(): string;
        ToCompactString(): string;
        InitFromString(InSourceString: string): boolean;
        ContainsNaN(): boolean;
        static ClampAxis(Angle: number): number;
        static NormalizeAxis(Angle: number): number;
        static CompressAxisToByte(Angle: number): number;
        static DecompressAxisFromByte(Angle: number): number;
        static CompressAxisToShort(Angle: number): number;
        static DecompressAxisFromShort(Angle: number): number;
        static MakeFromEuler(Euler: Vector): Rotator;
        
        static StaticClass(): Class;
        
    }
    class Transform {
        constructor();
        constructor(InTranslation: Vector);
        constructor(InRotation: Quat);
        constructor(InRotation: Rotator);
        constructor(InRotation: Quat, InTranslation: Vector, InScale3D: Vector);
        constructor(InRotation: Rotator, InTranslation: Vector, InScale3D: Vector);
        constructor(Param1: number);
        constructor(InX: Vector, InY: Vector, InZ: Vector, InTranslation: Vector);
        DiagnosticCheckNaN_Translate(): void;
        DiagnosticCheckNaN_Rotate(): void;
        DiagnosticCheckNaN_Scale3D(): void;
        DiagnosticCheckNaN_All(): void;
        DiagnosticCheck_IsValid(): void;
        DebugPrint(): void;
        ToHumanReadableString(): string;
        ToString(): string;
        InitFromString(InSourceString: string): boolean;
        Inverse(): Transform;
        Blend(Atom1: Transform, Atom2: Transform, Alpha: number): void;
        BlendWith(OtherAtom: Transform, Alpha: number): void;
        op_Addition(Atom: Transform): Transform;
        op_Multiply(Other: Transform): Transform;
        op_Multiply(Other: Quat): Transform;
        static AnyHasNegativeScale(InScale3D: Vector, InOtherScale3D: Vector): boolean;
        ScaleTranslation(InScale3D: Vector): void;
        ScaleTranslation(Scale: number): void;
        RemoveScaling(Tolerance: number): void;
        GetMaximumAxisScale(): number;
        GetMinimumAxisScale(): number;
        GetRelativeTransform(Other: Transform): Transform;
        GetRelativeTransformReverse(Other: Transform): Transform;
        SetToRelativeTransform(ParentTransform: Transform): void;
        TransformFVector4(V: Vector4): Vector4;
        TransformFVector4NoScale(V: Vector4): Vector4;
        TransformPosition(V: Vector): Vector;
        TransformPositionNoScale(V: Vector): Vector;
        InverseTransformPosition(V: Vector): Vector;
        InverseTransformPositionNoScale(V: Vector): Vector;
        TransformVector(V: Vector): Vector;
        TransformVectorNoScale(V: Vector): Vector;
        InverseTransformVector(V: Vector): Vector;
        InverseTransformVectorNoScale(V: Vector): Vector;
        TransformRotation(Q: Quat): Quat;
        InverseTransformRotation(Q: Quat): Quat;
        GetScaled(Scale: number): Transform;
        GetScaled(Scale: Vector): Transform;
        GetScaledAxis(InAxis: number): Vector;
        GetUnitAxis(InAxis: number): Vector;
        Mirror(MirrorAxis: number, FlipAxis: number): void;
        static GetSafeScaleReciprocal(InScale: Vector, Tolerance: number): Vector;
        GetLocation(): Vector;
        Rotator(): Rotator;
        GetDeterminant(): number;
        SetLocation(Origin: Vector): void;
        ContainsNaN(): boolean;
        IsValid(): boolean;
        static AreRotationsEqual(A: Transform, B: Transform, Tolerance: number): boolean;
        static AreTranslationsEqual(A: Transform, B: Transform, Tolerance: number): boolean;
        static AreScale3DsEqual(A: Transform, B: Transform, Tolerance: number): boolean;
        RotationEquals(Other: Transform, Tolerance: number): boolean;
        TranslationEquals(Other: Transform, Tolerance: number): boolean;
        Scale3DEquals(Other: Transform, Tolerance: number): boolean;
        Equals(Other: Transform, Tolerance: number): boolean;
        EqualsNoScale(Other: Transform, Tolerance: number): boolean;
        static Multiply(OutTransform: Transform, A: Transform, B: Transform): void;
        SetComponents(InRotation: Quat, InTranslation: Vector, InScale3D: Vector): void;
        SetIdentity(): void;
        MultiplyScale3D(Scale3DMultiplier: Vector): void;
        SetTranslation(NewTranslation: Vector): void;
        CopyTranslation(Other: Transform): void;
        ConcatenateRotation(DeltaRotation: Quat): void;
        AddToTranslation(DeltaTranslation: Vector): void;
        static AddTranslations(A: Transform, B: Transform): Vector;
        static SubtractTranslations(A: Transform, B: Transform): Vector;
        SetRotation(NewRotation: Quat): void;
        CopyRotation(Other: Transform): void;
        SetScale3D(NewScale3D: Vector): void;
        CopyScale3D(Other: Transform): void;
        SetTranslationAndScale3D(NewTranslation: Vector, NewScale3D: Vector): void;
        Accumulate(SourceAtom: Transform): void;
        NormalizeRotation(): void;
        IsRotationNormalized(): boolean;
        GetRotation(): Quat;
        GetTranslation(): Vector;
        GetScale3D(): Vector;
        CopyRotationPart(SrcBA: Transform): void;
        CopyTranslationAndScale3D(SrcBA: Transform): void;
        
        static StaticClass(): Class;
        
    }
    class Vector {
        constructor();
        constructor(InF: number);
        constructor(InX: number, InY: number, InZ: number);
        constructor(V: Vector2D, InZ: number);
        constructor(V: Vector4);
        constructor(InColor: LinearColor);
        constructor(InVector: IntVector);
        constructor(A: IntPoint);
        constructor(Param1: number);
        X: number;
        Y: number;
        Z: number;
        DiagnosticCheckNaN(): void;
        op_ExclusiveOr(V: Vector): Vector;
        static CrossProduct(A: Vector, B: Vector): Vector;
        op_BitwiseOr(V: Vector): number;
        static DotProduct(A: Vector, B: Vector): number;
        op_Addition(V: Vector): Vector;
        op_Addition(Bias: number): Vector;
        op_Subtraction(V: Vector): Vector;
        op_Subtraction(Bias: number): Vector;
        op_Multiply(Scale: number): Vector;
        op_Multiply(V: Vector): Vector;
        op_Division(Scale: number): Vector;
        op_Division(V: Vector): Vector;
        op_Equality(V: Vector): boolean;
        op_Inequality(V: Vector): boolean;
        Equals(V: Vector, Tolerance: number): boolean;
        AllComponentsEqual(Tolerance: number): boolean;
        op_UnaryNegation(): Vector;
        set_Item(Index: number): $Ref<number>;
        get_Item(Index: number): number;
        Component(Index: number): $Ref<number>;
        Component(Index: number): number;
        GetComponentForAxis(Axis: number): number;
        SetComponentForAxis(Axis: number, Component: number): void;
        Set(InX: number, InY: number, InZ: number): void;
        GetMax(): number;
        GetAbsMax(): number;
        GetMin(): number;
        GetAbsMin(): number;
        ComponentMin(Other: Vector): Vector;
        ComponentMax(Other: Vector): Vector;
        GetAbs(): Vector;
        Size(): number;
        SizeSquared(): number;
        Size2D(): number;
        SizeSquared2D(): number;
        IsNearlyZero(Tolerance: number): boolean;
        IsZero(): boolean;
        IsUnit(LengthSquaredTolerance: number): boolean;
        IsNormalized(): boolean;
        Normalize(Tolerance: number): boolean;
        GetUnsafeNormal(): Vector;
        GetSafeNormal(Tolerance: number): Vector;
        GetSafeNormal2D(Tolerance: number): Vector;
        ToDirectionAndLength(OutDir: $Ref<Vector>, OutLength: $Ref<number>): void;
        GetSignVector(): Vector;
        Projection(): Vector;
        GetUnsafeNormal2D(): Vector;
        GridSnap(GridSz: number): Vector;
        BoundToCube(Radius: number): Vector;
        BoundToBox(Min: Vector, Max: Vector): Vector;
        GetClampedToSize(Min: number, Max: number): Vector;
        GetClampedToSize2D(Min: number, Max: number): Vector;
        GetClampedToMaxSize(MaxSize: number): Vector;
        GetClampedToMaxSize2D(MaxSize: number): Vector;
        AddBounded(V: Vector, Radius: number): void;
        Reciprocal(): Vector;
        IsUniform(Tolerance: number): boolean;
        MirrorByVector(MirrorNormal: Vector): Vector;
        MirrorByPlane(Plane: FPlane): Vector;
        RotateAngleAxis(AngleDeg: number, Axis: Vector): Vector;
        CosineAngle2D(B: Vector): number;
        ProjectOnTo(A: Vector): Vector;
        ProjectOnToNormal(Normal: Vector): Vector;
        ToOrientationRotator(): Rotator;
        ToOrientationQuat(): Quat;
        Rotation(): Rotator;
        FindBestAxisVectors(Axis1: $Ref<Vector>, Axis2: $Ref<Vector>): void;
        UnwindEuler(): void;
        ContainsNaN(): boolean;
        ToString(): string;
        ToText(): string;
        ToCompactString(): string;
        ToCompactText(): string;
        InitFromString(InSourceString: string): boolean;
        UnitCartesianToSpherical(): Vector2D;
        HeadingAngle(): number;
        static CreateOrthonormalBasis(XAxis: $Ref<Vector>, YAxis: $Ref<Vector>, ZAxis: $Ref<Vector>): void;
        static PointsAreSame(P: Vector, Q: Vector): boolean;
        static PointsAreNear(Point1: Vector, Point2: Vector, Dist: number): boolean;
        static PointPlaneDist(Point: Vector, PlaneBase: Vector, PlaneNormal: Vector): number;
        static PointPlaneProject(Point: Vector, Plane: FPlane): Vector;
        static PointPlaneProject(Point: Vector, A: Vector, B: Vector, C: Vector): Vector;
        static PointPlaneProject(Point: Vector, PlaneBase: Vector, PlaneNormal: Vector): Vector;
        static VectorPlaneProject(V: Vector, PlaneNormal: Vector): Vector;
        static Dist(V1: Vector, V2: Vector): number;
        static Distance(V1: Vector, V2: Vector): number;
        static DistXY(V1: Vector, V2: Vector): number;
        static Dist2D(V1: Vector, V2: Vector): number;
        static DistSquared(V1: Vector, V2: Vector): number;
        static DistSquaredXY(V1: Vector, V2: Vector): number;
        static DistSquared2D(V1: Vector, V2: Vector): number;
        static BoxPushOut(Normal: Vector, Size: Vector): number;
        static Parallel(Normal1: Vector, Normal2: Vector, ParallelCosineThreshold: number): boolean;
        static Coincident(Normal1: Vector, Normal2: Vector, ParallelCosineThreshold: number): boolean;
        static Orthogonal(Normal1: Vector, Normal2: Vector, OrthogonalCosineThreshold: number): boolean;
        static Coplanar(Base1: Vector, Normal1: Vector, Base2: Vector, Normal2: Vector, ParallelCosineThreshold: number): boolean;
        static Triple(X: Vector, Y: Vector, Z: Vector): number;
        static RadiansToDegrees(RadVector: Vector): Vector;
        static DegreesToRadians(DegVector: Vector): Vector;
        
        static StaticClass(): Class;
        
    }
    class Vector2D {
        constructor();
        constructor(InX: number, InY: number);
        constructor(InPos: IntPoint);
        constructor(Param1: number);
        constructor(Param1: number);
        constructor(V: Vector);
        constructor(V: Vector4);
        X: number;
        Y: number;
        op_Addition(V: Vector2D): Vector2D;
        op_Addition(A: number): Vector2D;
        op_Subtraction(V: Vector2D): Vector2D;
        op_Subtraction(A: number): Vector2D;
        op_Multiply(Scale: number): Vector2D;
        op_Multiply(V: Vector2D): Vector2D;
        op_Division(Scale: number): Vector2D;
        op_Division(V: Vector2D): Vector2D;
        op_BitwiseOr(V: Vector2D): number;
        op_ExclusiveOr(V: Vector2D): number;
        op_Equality(V: Vector2D): boolean;
        op_Inequality(V: Vector2D): boolean;
        op_UnaryNegation(): Vector2D;
        set_Item(Index: number): $Ref<number>;
        get_Item(Index: number): number;
        Component(Index: number): $Ref<number>;
        Component(Index: number): number;
        static DotProduct(A: Vector2D, B: Vector2D): number;
        static DistSquared(V1: Vector2D, V2: Vector2D): number;
        static Distance(V1: Vector2D, V2: Vector2D): number;
        static CrossProduct(A: Vector2D, B: Vector2D): number;
        Equals(V: Vector2D, Tolerance: number): boolean;
        Set(InX: number, InY: number): void;
        GetMax(): number;
        GetAbsMax(): number;
        GetMin(): number;
        Size(): number;
        SizeSquared(): number;
        GetRotated(AngleDeg: number): Vector2D;
        GetSafeNormal(Tolerance: number): Vector2D;
        Normalize(Tolerance: number): void;
        IsNearlyZero(Tolerance: number): boolean;
        ToDirectionAndLength(OutDir: $Ref<Vector2D>, OutLength: $Ref<number>): void;
        IsZero(): boolean;
        IntPoint(): IntPoint;
        RoundToVector(): Vector2D;
        ClampAxes(MinAxisVal: number, MaxAxisVal: number): Vector2D;
        GetSignVector(): Vector2D;
        GetAbs(): Vector2D;
        ToString(): string;
        InitFromString(InSourceString: string): boolean;
        DiagnosticCheckNaN(): void;
        ContainsNaN(): boolean;
        SphericalToUnitCartesian(): Vector;
        
        static StaticClass(): Class;
        
    }
    class Vector4 {
        constructor(InVector: Vector, InW: number);
        constructor(InColor: LinearColor);
        constructor(InX: number, InY: number, InZ: number, InW: number);
        constructor(InXY: Vector2D, InZW: Vector2D);
        constructor(Param1: number);
        X: number;
        Y: number;
        Z: number;
        W: number;
        set_Item(ComponentIndex: number): $Ref<number>;
        get_Item(ComponentIndex: number): number;
        op_UnaryNegation(): Vector4;
        op_Addition(V: Vector4): Vector4;
        op_Subtraction(V: Vector4): Vector4;
        op_Multiply(Scale: number): Vector4;
        op_Multiply(V: Vector4): Vector4;
        op_Division(Scale: number): Vector4;
        op_Division(V: Vector4): Vector4;
        op_Equality(V: Vector4): boolean;
        op_Inequality(V: Vector4): boolean;
        op_ExclusiveOr(V: Vector4): Vector4;
        Component(Index: number): $Ref<number>;
        Component(Index: number): number;
        Equals(V: Vector4, Tolerance: number): boolean;
        IsUnit3(LengthSquaredTolerance: number): boolean;
        ToString(): string;
        InitFromString(InSourceString: string): boolean;
        GetSafeNormal(Tolerance: number): Vector4;
        GetUnsafeNormal3(): Vector4;
        ToOrientationRotator(): Rotator;
        ToOrientationQuat(): Quat;
        Rotation(): Rotator;
        Set(InX: number, InY: number, InZ: number, InW: number): void;
        Size3(): number;
        SizeSquared3(): number;
        Size(): number;
        SizeSquared(): number;
        ContainsNaN(): boolean;
        IsNearlyZero3(Tolerance: number): boolean;
        Reflect3(Normal: Vector4): Vector4;
        FindBestAxisVectors3(Axis1: $Ref<Vector4>, Axis2: $Ref<Vector4>): void;
        DiagnosticCheckNaN(): void;
        
        static StaticClass(): Class;
        
    }
    class IntPoint {
        constructor();
        constructor(InX: number, InY: number);
        constructor(Param1: number);
        X: number;
        Y: number;
        op_Equality(Other: IntPoint): boolean;
        op_Inequality(Other: IntPoint): boolean;
        op_Multiply(Scale: number): IntPoint;
        op_Division(Divisor: number): IntPoint;
        op_Division(Other: IntPoint): IntPoint;
        op_Addition(Other: IntPoint): IntPoint;
        op_Subtraction(Other: IntPoint): IntPoint;
        set_Item(Index: number): $Ref<number>;
        get_Item(Index: number): number;
        ComponentMin(Other: IntPoint): IntPoint;
        ComponentMax(Other: IntPoint): IntPoint;
        GetMax(): number;
        GetMin(): number;
        Size(): number;
        SizeSquared(): number;
        ToString(): string;
        static DivideAndRoundUp(lhs: IntPoint, Divisor: number): IntPoint;
        static DivideAndRoundUp(lhs: IntPoint, Divisor: IntPoint): IntPoint;
        static DivideAndRoundDown(lhs: IntPoint, Divisor: number): IntPoint;
        static Num(): number;
        
        static StaticClass(): Class;
        
    }
    class IntVector {
        constructor();
        constructor(InX: number, InY: number, InZ: number);
        constructor(InValue: number);
        constructor(InVector: Vector);
        constructor(Param1: number);
        X: number;
        Y: number;
        Z: number;
        get_Item(ComponentIndex: number): number;
        set_Item(ComponentIndex: number): $Ref<number>;
        op_Equality(Other: IntVector): boolean;
        op_Inequality(Other: IntVector): boolean;
        op_Multiply(Scale: number): IntVector;
        op_Division(Divisor: number): IntVector;
        op_Addition(Other: IntVector): IntVector;
        op_Subtraction(Other: IntVector): IntVector;
        IsZero(): boolean;
        GetMax(): number;
        GetMin(): number;
        Size(): number;
        ToString(): string;
        static DivideAndRoundUp(lhs: IntVector, Divisor: number): IntVector;
        static Num(): number;
        
        static StaticClass(): Class;
        
    }
    class FMatrix {
        constructor();
        
        static StaticClass(): Class;
        
    }
    namespace FStructuredArchive {
    class FSlot {
        constructor();
        
        static StaticClass(): Class;
        
    }
    }
    class FArchive {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class TSizedDefaultAllocator<T> {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class FPlane {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class FFloat16Color {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class UPackageMap {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class FIntVector4 {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class VectorRegister {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class ScalarRegister {
        constructor();
        
        static StaticClass(): Class;
        
    }
    class FOutputDevice {
        constructor();
        
        static StaticClass(): Class;
        
    }

}