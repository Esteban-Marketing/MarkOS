'use strict';

function evaluateValue(value) {
    if (value === null || value === undefined) {
        return 'Red';
    }

    if (Array.isArray(value)) {
        if (value.length === 0 || (value.length === 1 && value[0] === '')) return 'Red';
        if (value.length === 1) return 'Yellow';
        return 'Green';
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return 'Red';
        let emptyCount = 0;
        for (const k of keys) {
            if (!value[k]) emptyCount++;
        }
        if (emptyCount === keys.length) return 'Red';
        if (emptyCount > 0) return 'Yellow';
        return 'Green';
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) return 'Red';
        if (trimmed.length < 10) return 'Yellow';
        return 'Green';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return 'Green';
    }

    return 'Red';
}

function scoreFields(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === 'object') {
            return obj.map(item => scoreFields(item));
        }
        return obj; 
    }

    const scored = {};
    for (const [key, value] of Object.entries(obj)) {
        // Evaluate based on schema leaf nodes
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            scored[key] = scoreFields(value);
        } else {
            scored[key] = {
                value: value,
                score: evaluateValue(value)
            };
        }
    }
    return scored;
}

module.exports = { scoreFields };
