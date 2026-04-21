function getRequiredEnv(name) {
    const value = (process.env[name] || '').trim();
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

function isFeatureEnabled(name, defaultValue = false) {
    const raw = process.env[name];
    if (raw === undefined || raw === null || raw === '') {
        return defaultValue;
    }
    return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

function maskName(name) {
    if (!name) return '';
    if (name.length === 1) return `${name}*`;
    if (name.length === 2) return `${name[0]}*`;
    return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 3))}${name[name.length - 1]}`;
}

module.exports = {
    getRequiredEnv,
    isFeatureEnabled,
    maskName
};
