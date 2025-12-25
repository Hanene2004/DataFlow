export type PIIType = 'email' | 'phone' | 'ssn' | 'unknown';

export interface PIIResult {
    column: string;
    type: PIIType;
    confidence: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
// Simple SSN-like pattern (9 digits, maybe dashed)
const SSN_REGEX = /^\d{3}-\d{2}-\d{4}$|^\d{9}$/;

export function detectPII(data: Record<string, unknown>[], columns: string[]): PIIResult[] {
    const results: PIIResult[] = [];
    const SAMPLE_SIZE = Math.min(data.length, 50);

    columns.forEach(col => {
        let emailCount = 0;
        let phoneCount = 0;
        let ssnCount = 0;
        let validSampleCount = 0;

        for (let i = 0; i < SAMPLE_SIZE; i++) {
            const val = String(data[i][col] || '').trim();
            if (!val) continue;

            validSampleCount++;
            if (EMAIL_REGEX.test(val)) emailCount++;
            else if (PHONE_REGEX.test(val)) phoneCount++;
            else if (SSN_REGEX.test(val)) ssnCount++;
        }

        if (validSampleCount === 0) return;

        if (emailCount / validSampleCount > 0.8) {
            results.push({ column: col, type: 'email', confidence: emailCount / validSampleCount });
        } else if (phoneCount / validSampleCount > 0.8) {
            results.push({ column: col, type: 'phone', confidence: phoneCount / validSampleCount });
        } else if (ssnCount / validSampleCount > 0.8) {
            results.push({ column: col, type: 'ssn', confidence: ssnCount / validSampleCount });
        }
    });

    return results;
}

export function maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '****';
    const maskedUser = user.length > 2 ? user[0] + '****' + user[user.length - 1] : '****';
    return `${maskedUser}@${domain}`;
}

export function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***-***-****';
    return `***-***-${digits.slice(-4)}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function redact(_val: unknown): string {
    return '[REDACTED]';
}
