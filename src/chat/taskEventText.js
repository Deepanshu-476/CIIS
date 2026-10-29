// Translate only the known legacy system templates, preserving user-written titles.
export const taskEventText = message => {
    const text = String(message?.text || "");
    if (message?.messageType !== "system") return text;
    switch (message.systemEvent?.type) {
        case "task_created":
            return text.replace(/^(.+) ne ‘([\s\S]*)’ task create kiya\. Assigned to: ([\s\S]*)\.$/, "$1 created task ‘$2’. Assigned to: $3.");
        case "task_status_changed":
            return text.replace(/^(.+) ne ‘([\s\S]*)’ ka status (.+) → (.+) kiya\.$/, "$1 changed the status of ‘$2’ from $3 to $4.");
        case "task_mentioned":
            return text.replace(/^(.+) ne (.+) ko ‘([\s\S]*)’ task mein mention kiya\.$/, "$1 mentioned $2 in task ‘$3’.");
        default:
            return text;
    }
};
