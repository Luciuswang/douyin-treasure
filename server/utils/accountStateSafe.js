function getRegistrationStatus(user) {
    return user?.registration?.status || 'approved';
}

function getIdentityStatus(user) {
    return user?.identityVerification?.status || 'unverified';
}

function getLoginBlock(user) {
    if (!user) {
        return {
            status: 401,
            message: 'Invalid account or token.',
            code: 'INVALID_ACCOUNT'
        };
    }

    if (!user.isActive) {
        return {
            status: 403,
            message: 'Account is disabled.',
            code: 'ACCOUNT_DISABLED'
        };
    }

    const registrationStatus = getRegistrationStatus(user);
    if (registrationStatus === 'pending') {
        return {
            status: 403,
            message: 'Registration request is pending approval.',
            code: 'ACCOUNT_PENDING_APPROVAL'
        };
    }

    if (registrationStatus === 'rejected') {
        const note = user.registration?.note?.trim();
        return {
            status: 403,
            message: note
                ? `Registration request was rejected: ${note}`
                : 'Registration request was rejected.',
            code: 'ACCOUNT_REJECTED'
        };
    }

    return null;
}

module.exports = {
    getRegistrationStatus,
    getIdentityStatus,
    getLoginBlock
};
