
export function createPairKey(userId1, userId2) {
    return [userId1.toString(), userId2.toString()]
        .sort()
        .join(":");
}

export function getUtcDateKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function getPreviousUtcDateKey(date = new Date()) {
    const previous = new Date(date);
    previous.setUTCDate(previous.getUTCDate() - 1);

    return getUtcDateKey(previous);
}

export function getUtcDayRange(date = new Date()) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
}