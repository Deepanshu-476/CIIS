import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Check,
  RotateCw,
  RefreshCw,
  Crop,
  Loader2,
} from "lucide-react";
import "./InstagramImageCropper.css";

const STAGE_SIZE = 280;
const OUTPUT_SIZE = 400;

export default function InstagramImageCropper({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  isSaving = false,
  title = "Crop Profile Picture",
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const dragRef = useRef(null);

  // Load natural dimensions whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setImageSize({ width: 0, height: 0 });
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || STAGE_SIZE;
      const h = img.naturalHeight || img.height || STAGE_SIZE;
      setImageSize({ width: w, height: h });
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Handle ESC and Arrow Keys for keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
        return;
      }

      const STEP = e.shiftKey ? 25 : 10;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPosition((p) => ({ ...p, y: p.y - STEP }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setPosition((p) => ({ ...p, y: p.y + STEP }));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPosition((p) => ({ ...p, x: p.x - STEP }));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPosition((p) => ({ ...p, x: p.x + STEP }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Base cover scale calculation
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const effectiveWidth = isRotated90or270 ? imageSize.height : imageSize.width;
  const effectiveHeight = isRotated90or270 ? imageSize.width : imageSize.height;

  const baseScale = effectiveWidth && effectiveHeight
    ? Math.max(STAGE_SIZE / effectiveWidth, STAGE_SIZE / effectiveHeight)
    : 1;

  const currentW = (effectiveWidth || STAGE_SIZE) * baseScale * zoom;
  const currentH = (effectiveHeight || STAGE_SIZE) * baseScale * zoom;

  // Generous boundaries so user can freely pan to any portion
  const maxOffsetX = Math.max(400, (currentW / 2) + 120);
  const maxOffsetY = Math.max(400, (currentH / 2) + 120);
  const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, position.x));
  const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, position.y));

  // Optional mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0018;
    setZoom((prev) => Math.min(3.5, Math.max(1, +(prev + delta).toFixed(3))));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [isOpen, handleWheel]);

  // Drag interaction with PointerEvents (works smoothly on both touch and mouse)
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  // 90-degree clockwise rotation
  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
    setPosition({ x: 0, y: 0 });
  };

  // Reset to original center & 1x
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Generate crisp cropped canvas
  const handleSaveCrop = () => {
    if (!imageSrc || isSaving) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const ratio = OUTPUT_SIZE / STAGE_SIZE;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill white background for safety
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Translate to canvas center
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply translation (pan offset)
      const rad = (-rotation * Math.PI) / 180;
      const transX = (clampedX * Math.cos(rad) - clampedY * Math.sin(rad)) * ratio;
      const transY = (clampedX * Math.sin(rad) + clampedY * Math.cos(rad)) * ratio;
      ctx.translate(transX, transY);

      // Scale
      const drawScale = baseScale * zoom * ratio;
      const drawWidth = imageSize.width * drawScale;
      const drawHeight = imageSize.height * drawScale;

      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      // Export as high quality JPEG, compressed to safe payload size
      let dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      if (dataUrl.length > 95000) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      }
      if (dataUrl.length > 95000) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.68);
      }

      onSave(dataUrl);
    };
    img.src = imageSrc;
  };

  if (!isOpen || !imageSrc) return null;

  const renderedWidth = imageSize.width * baseScale;
  const renderedHeight = imageSize.height * baseScale;

  return (
    <div className="insta-crop-overlay" onClick={isSaving ? undefined : onClose}>
      <div
        className="insta-crop-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="insta-crop-header">
          <div className="insta-crop-header-left">
            <span className="insta-crop-header-icon">
              <Crop size={18} />
            </span>
            <div>
              <h2 className="insta-crop-title">{title}</h2>
              <p className="insta-crop-subtitle">Drag photo to adjust position</p>
            </div>
          </div>
          <button
            type="button"
            className="insta-crop-close-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Stage (Clean Light Studio Theme - NO BLACK) */}
        <div
          ref={containerRef}
          className={`insta-crop-stage-container ${isDragging ? "is-dragging" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="insta-crop-stage">
            {/* Image */}
            <img
              src={imageSrc}
              alt="Crop target"
              className="insta-crop-image"
              style={{
                width: `${renderedWidth}px`,
                height: `${renderedHeight}px`,
                transform: `translate(-50%, -50%) translate(${clampedX}px, ${clampedY}px) rotate(${rotation}deg) scale(${zoom})`,
              }}
              draggable="false"
            />

            {/* Subtle Rule-of-Thirds Grid */}
            <div className={`insta-crop-grid ${isDragging ? "is-visible" : ""}`} />
          </div>
        </div>

        {/* Quick Tools: Rotate & Reset (Slider Removed) */}
        <div className="insta-crop-tools-bar">
          <button
            type="button"
            className="insta-crop-tool-btn"
            onClick={handleRotate}
            disabled={isSaving}
            title="Rotate 90° clockwise"
          >
            <RotateCw size={15} />
            <span>Rotate 90°</span>
          </button>

          <button
            type="button"
            className="insta-crop-tool-btn"
            onClick={handleReset}
            disabled={isSaving || (zoom === 1 && rotation === 0 && position.x === 0 && position.y === 0)}
            title="Reset position and rotation"
          >
            <RefreshCw size={15} />
            <span>Reset</span>
          </button>
        </div>

        {/* Footer Actions - Crisp, High-Contrast */}
        <div className="insta-crop-footer">
          <button
            type="button"
            className="insta-crop-cancel-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="insta-crop-save-btn"
            onClick={handleSaveCrop}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="insta-crop-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Apply & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
