import React, { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import "./chatMentions.css";
import { insertMention, mentionTrigger } from "./mentionUtils";

const ChatMentionInput = forwardRef(function ChatMentionInput({ value, mentions, members, onMentionSelect, onChange, onKeyDown, ...props }, forwardedRef) {
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const listId = useId();
    const [caret, setCaret] = useState(value.length);
    const [focused, setFocused] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    useImperativeHandle(forwardedRef, () => inputRef.current);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        input.style.height = "auto";
        const nextHeight = Math.min(input.scrollHeight, 144);
        input.style.height = `${nextHeight}px`;
        input.style.overflowY = input.scrollHeight > 144 ? "auto" : "hidden";
    }, [value]);

    const trigger = focused && !dismissed ? mentionTrigger(value, caret, mentions) : null;
    const options = trigger ? members.filter(member => member.name.toLocaleLowerCase().includes(trigger.query.trim().toLocaleLowerCase())) : [];
    const selectedIndex = Math.min(activeIndex, Math.max(0, options.length - 1));

    useEffect(() => {
        listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest" });
    }, [selectedIndex, trigger?.query]);

    const choose = member => {
        const next = insertMention(value, mentions, trigger, member);
        onMentionSelect(next.value, next.mentions);
        setCaret(next.caret);
        setDismissed(true);
        requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(next.caret, next.caret);
        });
    };

    return <div className="chat-mention-composer">
        {trigger && options.length > 0 && <div className="chat-mention-dropdown" role="listbox" id={listId} aria-label="Mention a member" ref={listRef}>
            {options.length ? options.map((member, index) => <button
                key={member._id} id={`${listId}-${index}`} type="button" role="option"
                aria-selected={index === selectedIndex} className="chat-mention-option"
                onMouseDown={event => event.preventDefault()}
                onPointerDown={event => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(member)}>
                <span className="chat-mention-avatar" aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</span>
                <span><strong>{member.name}</strong>{member.email && <small>{member.email}</small>}</span>
            </button>) : <div className="chat-mention-empty" role="status">No matching members</div>}
        </div>}
        <textarea {...props} className={`chat-input ${props.className || ""}`.trim()} ref={inputRef} value={value} rows={1} role="combobox" aria-autocomplete="list"
            aria-expanded={Boolean(trigger && options.length)} aria-controls={trigger && options.length ? listId : undefined}
            aria-activedescendant={trigger && options.length ? `${listId}-${selectedIndex}` : undefined}
            autoComplete="off"
            onFocus={(e) => {
                setFocused(true);
                props.onFocus?.(e);
            }}
            onBlur={(e) => {
                setFocused(false);
                props.onBlur?.(e);
            }}
            onSelect={event => {
                const nextCaret = event.currentTarget.selectionStart;
                if (nextCaret !== caret) { setCaret(nextCaret); setActiveIndex(0); }
            }}
            onChange={event => {
                setCaret(event.target.selectionStart); setActiveIndex(0); setDismissed(false);
                onChange(event);
            }} onKeyDown={event => {
                if (event.nativeEvent.isComposing) return;
                if (trigger) {
                    if (options.length && ["ArrowDown", "ArrowUp"].includes(event.key)) {
                        event.preventDefault();
                        setActiveIndex((selectedIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
                        return;
                    }
                    if (options.length && ["Enter", "Tab"].includes(event.key)) {
                        event.preventDefault(); choose(options[selectedIndex]); return;
                    }
                    if (event.key === "Escape") { event.preventDefault(); setDismissed(true); return; }
                }
                onKeyDown?.(event);
            }} />
    </div>;
});

export default ChatMentionInput;
