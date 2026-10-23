/**
 * VoiceOrb GLSL Shaders
 * 
 * Vertex Shader:
 * - 3D Simplex/Perlin noise displacement
 * - Traveling harmonic waves along circular path (radius ~1)
 * - Scaled by uAmplitude, uScale, and real-time uAudioLevel
 * 
 * Fragment Shader:
 * - Color gradient: #22d3ee (cyan) -> #3b82f6 (blue) -> #2dd4bf (teal)
 * - Brighter white-cyan highlight on edges and overlapping crossings
 * - Fresnel-style edge glow
 * - Volumetric translucency
 */

export const vertexShader = `
uniform float uTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uScale;
uniform float uAudioLevel;
uniform float uTwist;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;
varying float vAngle;

// 3D Simplex noise functions
vec4 permute(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Compute circular angle and radius
    float angle = atan(position.y, position.x);
    vAngle = angle;

    // Time driven by uSpeed
    float t = uTime * uSpeed;

    // Symmetrical traveling sine waves (keeps circular base geometry)
    float wave1 = sin(angle * 3.0 - t * 2.2) * 0.09;
    float wave2 = cos(angle * 4.0 + t * 1.6) * 0.06;
    float wave3 = sin(angle * 2.0 - t * 1.0) * 0.05;

    // 3D Simplex noise for fluid organic silk ripple
    vec3 noiseCoord = vec3(position.xy * 1.6, t * 0.7);
    float noiseVal = snoise(noiseCoord) * 0.12;

    // Total displacement modulated by amplitude and audio level
    float dynamicAmp = uAmplitude + uAudioLevel * 0.75;
    float totalDisplacement = (wave1 + wave2 + wave3 + noiseVal) * dynamicAmp;
    vDisplacement = totalDisplacement;

    // Displace along normal + radial direction
    vec3 displacedPos = position + normal * (totalDisplacement * 0.85);
    vec2 radialDir = normalize(position.xy);
    displacedPos.xy += radialDir * (totalDisplacement * 0.65);

    // Apply speech scale
    displacedPos *= uScale;

    vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const fragmentShader = `
uniform vec3 uColorCyan;
uniform vec3 uColorBlue;
uniform vec3 uColorTeal;
uniform float uTime;
uniform float uAudioLevel;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;
varying float vAngle;

void main() {
    // View direction and Fresnel edge glow
    vec3 viewDir = normalize(vViewPosition);
    vec3 norm = normalize(vNormal);
    float NdotV = abs(dot(viewDir, norm));
    float fresnel = pow(1.0 - NdotV, 2.4);

    // Continuous circular color gradient around ring:
    // Cyan (#22d3ee) -> Blue (#3b82f6) -> Teal (#2dd4bf) -> Cyan
    float normAngle = (vAngle + 3.14159265) / (2.0 * 3.14159265);
    float gradPos = fract(normAngle + vDisplacement * 0.4);

    vec3 color;
    if (gradPos < 0.33) {
        float f = gradPos / 0.33;
        color = mix(uColorCyan, uColorBlue, f);
    } else if (gradPos < 0.66) {
        float f = (gradPos - 0.33) / 0.33;
        color = mix(uColorBlue, uColorTeal, f);
    } else {
        float f = (gradPos - 0.66) / 0.34;
        color = mix(uColorTeal, uColorCyan, f);
    }

    // Brighter white-cyan highlight on edges and wave crossings
    vec3 highlightColor = vec3(0.88, 0.98, 1.0);
    float crossingGlow = max(0.0, vDisplacement * 3.2);
    float edgeHighlight = pow(fresnel, 2.8) * 0.85 + crossingGlow * 0.35;
    color = mix(color, highlightColor, clamp(edgeHighlight, 0.0, 0.85));

    // Volumetric translucency with soft additive fade
    float alpha = clamp(fresnel * 0.65 + 0.28 + uAudioLevel * 0.25, 0.0, 0.95);

    gl_FragColor = vec4(color, alpha);
}
`;
