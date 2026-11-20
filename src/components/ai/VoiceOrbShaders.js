/**
 * VoiceOrb GLSL Shaders
 * 
 * Recreates the exact ethereal, fluid circular aura ring from the reference image:
 * - Perfectly circular base geometry (XY frontal plane, zero 3D off-axis tilt)
 * - Low-frequency harmonic fluid waves along the circular path (frequencies 2, 3, 4)
 * - Smooth radial undulation (no high-frequency polygon distortion or spikes)
 * - Ethereal feathered edge falloff (smoky, soft-focus ribbon silhouette)
 * - Rich vibrant palette visible on both light and dark backgrounds:
 *   Electric Cyan (#05b8e0) -> Ocean Blue (#1e73f3) -> Royal Cobalt (#1440d1)
 * - NormalBlending with dense luminous core (alpha ~0.88) and feathered misty edges
 */

export const vertexShader = `
uniform float uTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uScale;
uniform float uAudioLevel;
uniform float uPhaseOffset;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vAngle;
varying float vDisplacement;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Angle around circular ring (-PI to PI)
    float angle = atan(position.y, position.x);
    vAngle = angle;

    float t = uTime * uSpeed + uPhaseOffset;

    // Harmonic fluid undulation waves along circle perimeter
    // Kept strictly low-frequency (2, 3, 4) to maintain the clean circular shape
    float wave1 = sin(angle * 3.0 - t * 2.0) * 0.075;
    float wave2 = cos(angle * 2.0 + t * 1.35) * 0.048;
    float wave3 = sin(angle * 4.0 - t * 0.85) * 0.028;

    float dynamicAmp = uAmplitude + uAudioLevel * 0.55;
    float totalWave = (wave1 + wave2 + wave3) * dynamicAmp;
    vDisplacement = totalWave;

    // Displace purely in radial direction from circle center (XY plane)
    vec2 radialDir = normalize(position.xy);
    vec3 displacedPos = position;
    displacedPos.xy += radialDir * totalWave;

    // Gentle out-of-plane Z depth modulation
    displacedPos.z += sin(angle * 3.0 + t * 1.6) * (0.055 * dynamicAmp);

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
uniform vec3 uColorDeepBlue;
uniform float uTime;
uniform float uAudioLevel;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vAngle;
varying float vDisplacement;

void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 norm = normalize(vNormal);

    // Facing factor: 1.0 at ribbon center (faces camera), 0.0 at inner/outer rims
    float NdotV = abs(dot(viewDir, norm));

    // Feathered smoky edge falloff:
    // Ribbon is dense and rich in the center, and softly dissolves into misty transparency
    // at the edges, eliminating hard polygon wireframe borders.
    float edgeFade = smoothstep(0.02, 0.42, NdotV);

    // Circular gradient progression around ring (Cyan -> Electric Blue -> Deep Ocean -> Teal)
    float normAngle = (vAngle + 3.14159265) / 6.2831853;
    float colorPos = fract(normAngle + uTime * 0.07);

    vec3 baseColor;
    if (colorPos < 0.33) {
        float f = colorPos / 0.33;
        baseColor = mix(uColorCyan, uColorBlue, f);
    } else if (colorPos < 0.66) {
        float f = (colorPos - 0.33) / 0.33;
        baseColor = mix(uColorBlue, uColorDeepBlue, f);
    } else {
        float f = (colorPos - 0.66) / 0.34;
        baseColor = mix(uColorDeepBlue, uColorCyan, f);
    }

    // Silky translucent internal ribbon folds & caustics
    float ribbonFolds = sin(vAngle * 4.0 - uTime * 1.4 + NdotV * 4.5) * 0.5 + 0.5;
    float fluidCaustic = sin(vUv.y * 12.566 + vAngle * 2.0 - uTime * 2.0) * 0.5 + 0.5;

    // Luminous frosty white-cyan core highlight along crests
    float coreGlow = pow(NdotV, 2.2) * 0.55 + pow(ribbonFolds, 3.0) * 0.35;
    vec3 highlightColor = vec3(0.90, 0.98, 1.0);
    vec3 finalColor = mix(baseColor, highlightColor, clamp(coreGlow * 0.55, 0.0, 0.70));

    // Volumetric smoky transparency: rich and dense in the center (alpha ~0.88),
    // feathered smoothly to 0 at the rims for misty softness.
    float alpha = edgeFade * (0.86 + fluidCaustic * 0.12 + uAudioLevel * 0.18);
    alpha = clamp(alpha, 0.0, 0.95);

    gl_FragColor = vec4(finalColor, alpha);
}
`;
