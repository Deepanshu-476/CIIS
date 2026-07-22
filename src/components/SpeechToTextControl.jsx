import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import "./SpeechToTextControl.css";

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "tel",
  "url",
]);

const getSpeechRecognition = () => (
  window.SpeechRecognition || window.webkitSpeechRecognition || null
);

const isEditableTextTarget = (element) => {
  if (!element) return false;
  if (element.isContentEditable) return true;

  const tagName = element.tagName?.toLowerCase();
  if (tagName === "textarea") return !element.disabled && !element.readOnly;
  if (tagName !== "input") return false;

  const type = (element.getAttribute("type") || "text").toLowerCase();
  return TEXT_INPUT_TYPES.has(type) && !element.disabled && !element.readOnly;
};

const setElementValue = (element, value) => {
  if (element.isContentEditable) {
    element.textContent = value;
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    return;
  }

  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const insertTranscript = (element, transcript, snapshot) => {
  if (!element || !snapshot) return snapshot;

  if (element.isContentEditable) {
    const spacer = snapshot.value && transcript && !/\s$/.test(snapshot.value) ? " " : "";
    const nextValue = `${snapshot.value}${spacer}${transcript}`;
    setElementValue(element, nextValue);
    return {
      value: nextValue,
      start: nextValue.length,
      end: nextValue.length,
    };
  }

  const before = snapshot.value.slice(0, snapshot.start);
  const after = snapshot.value.slice(snapshot.end);
  const spacer = before && transcript && !/\s$/.test(before) ? " " : "";
  const nextValue = `${before}${spacer}${transcript}${after}`;
  const cursor = before.length + spacer.length + transcript.length;

  setElementValue(element, nextValue);
  element.focus();

  if (typeof element.setSelectionRange === "function") {
    element.setSelectionRange(cursor, cursor);
  }

  return {
    value: nextValue,
    start: cursor,
    end: cursor,
  };
};

const SpeechToTextControl = () => {
  const [target, setTarget] = useState(null);
  const [position, setPosition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef(null);
  const targetRef = useRef(null);
  const snapshotRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const restartTimerRef = useRef(null);

  const updatePosition = () => {
    const element = targetRef.current;
    if (!isEditableTextTarget(element)) {
      setPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      setPosition(null);
      return;
    }

    setPosition({
      top: rect.top + rect.height / 2,
      left: Math.max(8, rect.right - 38),
    });
  };

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()));
  }, []);

  useEffect(() => {
    const handleFocusIn = (event) => {
      if (!isEditableTextTarget(event.target)) return;
      targetRef.current = event.target;
      setTarget(event.target);
      requestAnimationFrame(updatePosition);
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement?.closest?.(".speech-to-text-control")) return;
        if (isListening) return;
        targetRef.current = isEditableTextTarget(activeElement) ? activeElement : null;
        setTarget(targetRef.current);
        updatePosition();
      }, 120);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isListening]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const stopListening = () => {
    shouldKeepListeningRef.current = false;
    window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startListening = (reuseCurrentTarget = false) => {
    const element = targetRef.current || document.activeElement;
    if (!isEditableTextTarget(element)) return;

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setIsSupported(false);
      setNotice("Speech to text is not supported in this browser.");
      window.setTimeout(() => setNotice(""), 3500);
      return;
    }

    window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort?.();
    targetRef.current = element;
    setTarget(element);

    if (!reuseCurrentTarget || !snapshotRef.current) {
      snapshotRef.current = {
        value: element.isContentEditable ? element.textContent || "" : element.value || "",
        start: typeof element.selectionStart === "number" ? element.selectionStart : (element.textContent || "").length,
        end: typeof element.selectionEnd === "number" ? element.selectionEnd : (element.textContent || "").length,
      };
    }

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    shouldKeepListeningRef.current = true;

    recognition.onstart = () => {
      setNotice("");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript || "")
        .join("")
        .trim();

      if (transcript) {
        snapshotRef.current = insertTranscript(targetRef.current, transcript, snapshotRef.current);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        setNotice("Microphone permission denied.");
        window.setTimeout(() => setNotice(""), 3500);
        return;
      }

      if (event.error !== "no-speech") {
        setNotice("Speech capture paused, reconnecting...");
        window.setTimeout(() => setNotice(""), 2500);
      }
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current && isEditableTextTarget(targetRef.current)) {
        restartTimerRef.current = window.setTimeout(() => startListening(true), 250);
        return;
      }

      setIsListening(false);
      updatePosition();
    };

    recognition.start();
  };

  useEffect(() => () => {
    shouldKeepListeningRef.current = false;
    window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort?.();
  }, []);

  if (!target || !position || !isSupported) return notice ? <div className="speech-to-text-notice">{notice}</div> : null;

  return (
    <>
      <button
        type="button"
        className={`speech-to-text-control ${isListening ? "listening" : ""}`}
        style={{ top: position.top, left: position.left }}
        onPointerDown={(event) => event.preventDefault()}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? "Stop speech to text" : "Speak to text"}
        aria-label={isListening ? "Stop speech to text" : "Speak to text"}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      {notice && <div className="speech-to-text-notice">{notice}</div>}
    </>
  );
};

export default SpeechToTextControl;
