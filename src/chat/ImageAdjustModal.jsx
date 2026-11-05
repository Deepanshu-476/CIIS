import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Minus, Plus, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import "./ImageAdjustModal.css";

const VIEWPORT_SIZE = 320;
const CROP_DIAMETER = 260; // Circular aperture diameter in px
const CENTER = VIEWPORT_SIZE / 2; // 160
const RADIUS = CROP_DIAMETER / 2; // 130
const EXPORT_SIZE = 512;

const ImageAdjustModal = ({
    imageFile,
    onConfirm,
    onCancel,
    title = "Adjust group picture"
}) => {
    const [imageSrc, setImageSrc] = useState("");
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1.0);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const imgRef = useRef(null);
    const viewportRef = useRef(null);
    const pointerStateRef = useRef({
        activePointers: new Map(),
        startOffset: { x: 0, y: 0 },
        initialDistance: 0,
        initialZoom: 1.0,
    });

    // Create object URL for the input file
    useEffect(() => {
        if (!imageFile) return;
        const objectUrl = URL.createObjectURL(imageFile);
        setImageSrc(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [imageFile]);

    // Handle image load
    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setImageDimensions({ width: naturalWidth, height: naturalHeight });
        setZoom(1.0);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    };

    // Calculate base scale so the image fully covers the crop circle at zoom 1.0
    const getBaseScale = useCallback((rot = rotation) => {
        if (!imageDimensions.width || !imageDimensions.height) return 1;
        const isSwapped = (rot % 180 !== 0);
        const w = isSwapped ? imageDimensions.height : imageDimensions.width;
        const h = isSwapped ? imageDimensions.width : imageDimensions.height;
        return Math.max(CROP_DIAMETER / w, CROP_DIAMETER / h);
    }, [imageDimensions, rotation]);

    // Calculate maximum pan bounds
    const getPanBounds = useCallback((curZoom, curRot) => {
        if (!imageDimensions.width || !imageDimensions.height) {
            return { maxX: 0, maxY: 0 };
        }
        const baseScale = getBaseScale(curRot);
        const isSwapped = (curRot % 180 !== 0);
        const w = (isSwapped ? imageDimensions.height : imageDimensions.width) * baseScale * curZoom;
        const h = (isSwapped ? imageDimensions.width : imageDimensions.height) * baseScale * curZoom;

        const maxX = Math.max(0, (w - CROP_DIAMETER) / 2);
        const maxY = Math.max(0, (h - CROP_DIAMETER) / 2);
        return { maxX, maxY };
    }, [imageDimensions, getBaseScale]);

    // Clamp offset within allowed pan bounds
    const clampOffset = useCallback((x, y, curZoom, curRot) => {
        const { maxX, maxY } = getPanBounds(curZoom, curRot);
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        };
    }, [getPanBounds]);

    // Keep offset clamped whenever zoom or rotation changes
    useEffect(() => {
        setOffset(prev => clampOffset(prev.x, prev.y, zoom, rotation));
    }, [zoom, rotation, clampOffset]);

    // Rotate 90 degrees clockwise
    const handleRotate = () => {
        setRotation(prev => {
            const next = (prev + 90) % 360;
            return next;
        });
    };

    // Reset back to initial fit
    const handleReset = () => {
        setZoom(1.0);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    };

    // Pointer events for dragging & multi-touch pinch
    const handlePointerDown = (e) => {
        e.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport) return;

        try {
            viewport.setPointerCapture(e.pointerId);
        } catch {
            // ignore if pointer capture fails
        }

        const pointers = pointerStateRef.current.activePointers;
        pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

        if (pointers.size === 1) {
            pointerStateRef.current.startOffset = { ...offset };
            setIsDragging(true);
        } else if (pointers.size === 2) {
            const pts = Array.from(pointers.values());
            pointerStateRef.current.initialDistance = Math.hypot(
                pts[0].clientX - pts[1].clientX,
                pts[0].clientY - pts[1].clientY
            );
            pointerStateRef.current.initialZoom = zoom;
            setIsDragging(false);
        }
    };

    const handlePointerMove = (e) => {
        const pointers = pointerStateRef.current.activePointers;
        if (!pointers.has(e.pointerId)) return;

        pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

        if (pointers.size === 1 && isDragging) {
            const pts = Array.from(pointers.values())[0];
            const start = pointerStateRef.current.startOffset;
            const dx = e.clientX - pts.clientX; // using delta
            // Better tracking: store initial client position
        }
    };

    // Refined drag listener using native clientX tracking
    const dragTrackerRef = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

    const onPointerDownTrack = (e) => {
        e.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport) return;
        try {
            viewport.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }

        const pointers = pointerStateRef.current.activePointers;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 1) {
            dragTrackerRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startOffsetX: offset.x,
                startOffsetY: offset.y,
            };
            setIsDragging(true);
        } else if (pointers.size === 2) {
            const pts = Array.from(pointers.values());
            pointerStateRef.current.initialDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            pointerStateRef.current.initialZoom = zoom;
            setIsDragging(false);
        }
    };

    const onPointerMoveTrack = (e) => {
        const pointers = pointerStateRef.current.activePointers;
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 1 && isDragging) {
            const dx = e.clientX - dragTrackerRef.current.startX;
            const dy = e.clientY - dragTrackerRef.current.startY;
            const targetX = dragTrackerRef.current.startOffsetX + dx;
            const targetY = dragTrackerRef.current.startOffsetY + dy;
            setOffset(clampOffset(targetX, targetY, zoom, rotation));
        } else if (pointers.size === 2) {
            const pts = Array.from(pointers.values());
            const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pointerStateRef.current.initialDistance > 0) {
                const ratio = currentDist / pointerStateRef.current.initialDistance;
                const newZoom = Math.max(1.0, Math.min(3.5, pointerStateRef.current.initialZoom * ratio));
                setZoom(Number(newZoom.toFixed(2)));
            }
        }
    };

    const onPointerUpTrack = (e) => {
        const pointers = pointerStateRef.current.activePointers;
        pointers.delete(e.pointerId);
        if (pointers.size === 0) {
            setIsDragging(false);
        } else if (pointers.size === 1) {
            const remaining = Array.from(pointers.values())[0];
            dragTrackerRef.current = {
                startX: remaining.x,
                startY: remaining.y,
                startOffsetX: offset.x,
                startOffsetY: offset.y,
            };
            setIsDragging(true);
        }
    };

    // Mouse wheel zoom
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.08 : -0.08;
            setZoom(prev => {
                const next = Math.max(1.0, Math.min(3.5, Number((prev + delta).toFixed(2))));
                return next;
            });
        };

        viewport.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            viewport.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Keyboard ESC to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onCancel?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    // Perform crop and export
    const handleConfirm = async () => {
        if (!imgRef.current || !imageDimensions.width || !imageDimensions.height || isProcessing) return;
        setIsProcessing(true);

        try {
            const canvas = document.createElement("canvas");
            canvas.width = EXPORT_SIZE;
            canvas.height = EXPORT_SIZE;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not create canvas context");

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            const isPng = imageFile?.type === "image/png";
            if (!isPng) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
            }

            const K = EXPORT_SIZE / CROP_DIAMETER;
            const baseScale = getBaseScale(rotation);

            ctx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2);
            ctx.translate(offset.x * K, offset.y * K);
            ctx.rotate((rotation * Math.PI) / 180);

            const totalScale = baseScale * zoom * K;
            ctx.scale(totalScale, totalScale);

            ctx.drawImage(
                imgRef.current,
                -imageDimensions.width / 2,
                -imageDimensions.height / 2,
                imageDimensions.width,
                imageDimensions.height
            );

            const exportMime = isPng ? "image/png" : "image/jpeg";
            const exportQuality = 0.95;

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        setIsProcessing(false);
                        return;
                    }
                    const ext = isPng ? "png" : "jpg";
                    const originalName = imageFile?.name
                        ? imageFile.name.replace(/\.[^/.]+$/, "")
                        : "group-avatar";
                    const croppedFile = new File([blob], `${originalName}-cropped.${ext}`, {
                        type: exportMime,
                        lastModified: Date.now(),
                    });
                    const previewUrl = URL.createObjectURL(blob);
                    onConfirm?.(croppedFile, previewUrl);
                    setIsProcessing(false);
                },
                exportMime,
                exportQuality
            );
        } catch (error) {
            console.error("Error cropping image:", error);
            setIsProcessing(false);
        }
    };

    const baseScale = getBaseScale(rotation);
    const scaledW = imageDimensions.width * baseScale * zoom;
    const scaledH = imageDimensions.height * baseScale * zoom;

    // Grid coordinates for rule of thirds
    const grid1 = CENTER - RADIUS / 3;
    const grid2 = CENTER + RADIUS / 3;

    return (
        <div className="image-adjust-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
            <div className="image-adjust-card" role="dialog" aria-modal="true" aria-labelledby="image-adjust-title">
                {/* Header */}
                <div className="image-adjust-header">
                    <div>
                        <h3 id="image-adjust-title">{title}</h3>
                        <div className="image-adjust-subtitle">Drag to reposition, pinch or scroll to zoom</div>
                    </div>
                    <button
                        type="button"
                        className="image-adjust-close-btn"
                        onClick={onCancel}
                        title="Close"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Viewport */}
                <div className="image-adjust-viewport-wrap">
                    <div
                        ref={viewportRef}
                        className={`image-adjust-viewport ${isDragging ? "is-dragging" : ""}`}
                        onPointerDown={onPointerDownTrack}
                        onPointerMove={onPointerMoveTrack}
                        onPointerUp={onPointerUpTrack}
                        onPointerCancel={onPointerUpTrack}
                    >
                        {imageSrc && (
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Adjusting"
                                className="image-adjust-img"
                                onLoad={handleImageLoad}
                                style={{
                                    width: scaledW ? `${scaledW}px` : "auto",
                                    height: scaledH ? `${scaledH}px` : "auto",
                                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
                                }}
                            />
                        )}

                        {/* WhatsApp-style circular mask with border and rule-of-thirds grid */}
                        <svg
                            className="image-adjust-overlay-svg"
                            viewBox={`0 0 ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`}
                        >
                            <defs>
                                <mask id="group-avatar-mask">
                                    <rect width={VIEWPORT_SIZE} height={VIEWPORT_SIZE} fill="#ffffff" />
                                    <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#000000" />
                                </mask>
                                <clipPath id="group-avatar-circle-clip">
                                    <circle cx={CENTER} cy={CENTER} r={RADIUS} />
                                </clipPath>
                            </defs>

                            {/* Shroud covering area outside the circular aperture */}
                            <rect
                                width={VIEWPORT_SIZE}
                                height={VIEWPORT_SIZE}
                                fill="rgba(11, 20, 26, 0.78)"
                                mask="url(#group-avatar-mask)"
                            />

                            {/* Rule of thirds grid lines clipped inside circle */}
                            <g clipPath="url(#group-avatar-circle-clip)" className="image-adjust-grid" opacity={isDragging ? 0.6 : 0.3}>
                                <line x1={grid1} y1="0" x2={grid1} y2={VIEWPORT_SIZE} stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                                <line x1={grid2} y1="0" x2={grid2} y2={VIEWPORT_SIZE} stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                                <line x1="0" y1={grid1} x2={VIEWPORT_SIZE} y2={grid1} stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                                <line x1="0" y1={grid2} x2={VIEWPORT_SIZE} y2={grid2} stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                            </g>

                            {/* Crisp circular crop stencil border */}
                            <circle
                                cx={CENTER}
                                cy={CENTER}
                                r={RADIUS}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.85)"
                                strokeWidth="2"
                            />
                        </svg>
                    </div>
                </div>

                {/* Controls */}
                <div className="image-adjust-controls">
                    {/* Zoom slider bar */}
                    <div className="image-adjust-zoom-row">
                        <button
                            type="button"
                            className="image-adjust-icon-btn"
                            title="Zoom out"
                            onClick={() => setZoom(prev => Math.max(1.0, Number((prev - 0.2).toFixed(2))))}
                            disabled={zoom <= 1.0}
                        >
                            <ZoomOut size={16} />
                        </button>
                        <input
                            type="range"
                            min="1.0"
                            max="3.5"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="image-adjust-slider"
                            aria-label="Zoom level"
                        />
                        <button
                            type="button"
                            className="image-adjust-icon-btn"
                            title="Zoom in"
                            onClick={() => setZoom(prev => Math.min(3.5, Number((prev + 0.2).toFixed(2))))}
                            disabled={zoom >= 3.5}
                        >
                            <ZoomIn size={16} />
                        </button>
                        <span className="image-adjust-zoom-val">{zoom.toFixed(1)}x</span>
                    </div>

                    {/* Quick tool pills: Rotate & Reset */}
                    <div className="image-adjust-actions-row">
                        <button
                            type="button"
                            className="image-adjust-pill-btn"
                            onClick={handleRotate}
                            title="Rotate 90° clockwise"
                        >
                            <RotateCw size={14} /> Rotate
                        </button>
                        <button
                            type="button"
                            className="image-adjust-pill-btn"
                            onClick={handleReset}
                            title="Reset position and zoom"
                            disabled={zoom === 1.0 && rotation === 0 && offset.x === 0 && offset.y === 0}
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="image-adjust-footer">
                    <button
                        type="button"
                        className="image-adjust-cancel-btn"
                        onClick={onCancel}
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="image-adjust-confirm-btn"
                        onClick={handleConfirm}
                        disabled={isProcessing || !imageDimensions.width}
                    >
                        <Check size={16} /> {isProcessing ? "Processing..." : "Done"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageAdjustModal;

