const db = require('../config/db');

const getSecuritySettings = () => {
    return new Promise((resolve) => {
        db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('password_min_length', 'password_require_special', 'session_timeout')", (err, results) => {
            if (err || !results) {
                return resolve({
                    password_min_length: 8,
                    password_require_special: 'false',
                    session_timeout: 30
                });
            }
            
            const settings = {
                password_min_length: 8,
                password_require_special: 'false',
                session_timeout: 30
            };

            results.forEach(row => {
                if (row.setting_key === 'password_min_length') settings.password_min_length = parseInt(row.setting_value) || 8;
                if (row.setting_key === 'password_require_special') settings.password_require_special = row.setting_value;
                // Hardcode session timeout to 30 minutes as requested
                if (row.setting_key === 'session_timeout') settings.session_timeout = 30;
            });
            
            // Safety enforcement to guarantee 30 minutes even if missing from DB
            settings.session_timeout = 30;
            resolve(settings);
        });
    });
};

const validatePassword = async (password) => {
    // Skip empty passwords (for updates where password is not changed)
    if (!password) return { isValid: true };

    const settings = await getSecuritySettings();
    
    if (password.length < settings.password_min_length) {
        return { isValid: false, message: `Password must be at least ${settings.password_min_length} characters long.` };
    }
    
    if (settings.password_require_special === 'true') {
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_]/;
        if (!specialCharRegex.test(password)) {
            return { isValid: false, message: `Password must contain at least one special character (!@#$).` };
        }
    }
    
    return { isValid: true };
};

module.exports = { getSecuritySettings, validatePassword };
