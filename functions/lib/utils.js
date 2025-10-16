"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashEmail = hashEmail;
const crypto = require("crypto");
/**
 * Hash an email address using SHA-256
 * @param email Email address to hash
 * @returns SHA-256 hash of the lowercase email
 */
function hashEmail(email) {
    // Normalize email by converting to lowercase
    const normalizedEmail = email.toLowerCase();
    // Create SHA-256 hash
    const hash = crypto.createHash('sha256');
    hash.update(normalizedEmail);
    // Return hex digest
    return hash.digest('hex');
}
//# sourceMappingURL=utils.js.map