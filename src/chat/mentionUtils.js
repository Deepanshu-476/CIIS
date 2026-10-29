export const memberId = member => String(member?._id || member?.id || member?.userId || member || "");

export function mentionMembers(sources, knownUsers = []) {
    const known = new Map(knownUsers.filter(user => user?.name).map(user => [memberId(user), user]));
    const unique = new Map();
    for (const source of sources || []) {
        const user = source?.name ? source : known.get(memberId(source));
        if (!user?.name?.trim() || user.isActive === false) continue;
        unique.set(memberId(user), { ...user, _id: memberId(user), name: user.name.trim() });
    }
    return [...unique.values()];
}

export function mentionTrigger(text, caret, mentions = []) {
    if (!Number.isInteger(caret) || caret < 0 || caret > text.length) return null;
    const match = text.slice(0, caret).match(/(?:^|[\s([{])@([^\n@]{0,80})$/u);
    if (!match || /\s$/u.test(match[1])) return null;
    const start = caret - match[1].length - 1;
    if (mentions.some(mention => start >= mention.start && start < mention.end)) return null;
    const remaining = text.slice(caret).match(/^[^\s@,!?;:]*/u)?.[0] || "";
    return { start, end: caret + remaining.length, query: match[1] };
}

export function reconcileMentions(before, after, mentions) {
    if (before === after) return mentions;
    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) start++;
    let oldEnd = before.length, newEnd = after.length;
    while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) { oldEnd--; newEnd--; }
    const delta = newEnd - oldEnd;
    return mentions.flatMap(mention => {
        let next;
        if (oldEnd <= mention.start) next = { ...mention, start: mention.start + delta, end: mention.end + delta };
        else if (start >= mention.end) next = mention;
        else return [];
        return after.slice(next.start, next.end) === `@${next.label}` ? [next] : [];
    });
}

export function insertMention(text, mentions, trigger, member) {
    const label = member.name.trim();
    const token = `@${label}`;
    const suffix = text.slice(trigger.end);
    const separator = /^\s/u.test(suffix) ? "" : " ";
    const value = `${text.slice(0, trigger.start)}${token}${separator}${suffix}`;
    const shifted = reconcileMentions(text, value, mentions);
    const mention = { user: memberId(member), label, start: trigger.start, end: trigger.start + token.length };
    return { value, mentions: [...shifted, mention].sort((a, b) => a.start - b.start), caret: mention.end + 1 };
}

export function mentionSegments(text, mentions = []) {
    const parts = [];
    let cursor = 0;
    for (const mention of [...mentions].sort((a, b) => a.start - b.start)) {
        if (!Number.isInteger(mention.start) || !Number.isInteger(mention.end) || mention.start < cursor
            || text.slice(mention.start, mention.end) !== `@${mention.label}`) continue;
        if (mention.start > cursor) parts.push({ text: text.slice(cursor, mention.start) });
        parts.push({ text: text.slice(mention.start, mention.end), user: memberId(mention.user) });
        cursor = mention.end;
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor) });
    return parts;
}
