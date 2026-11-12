export const RECAPTCHA_SITE_KEY = '6Lc6OvktAAAAAG_MY9fqQQogy0LLckQGliFYTGkq';

declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

/**
 * Execute Google reCAPTCHA Enterprise with retry wait for script load
 * Non-blocking: returns null gracefully if domain is invalid or not yet whitelisted
 * @param action - Action name (e.g. 'LOGIN', 'HOMEPAGE', 'TEST')
 * @returns Token string or null
 */
export async function executeRecaptcha(action: string = 'LOGIN'): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    // Safety timeout: Never hang UI more than 2 seconds if domain is invalid
    const timer = setTimeout(() => {
      resolve(null);
    }, 2000);

    try {
      if (!window.grecaptcha?.enterprise) {
        clearTimeout(timer);
        resolve(null);
        return;
      }

      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha!.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
          clearTimeout(timer);
          resolve(token);
        } catch (err) {
          clearTimeout(timer);
          console.warn('[reCAPTCHA Enterprise] Notice (Domain may need to be added to Google Cloud Console):', err);
          resolve(null);
        }
      });
    } catch (e) {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

// Automatically trigger reCAPTCHA on boot to satisfy Google Cloud Console verification
export function triggerRecaptchaOnBoot() {
  if (typeof window !== 'undefined') {
    // Delay slightly so script loads cleanly
    setTimeout(() => {
      executeRecaptcha('HOMEPAGE').then((tok) => {
        if (tok) {
          console.log('[reCAPTCHA Enterprise] Boot trigger completed with token.');
        }
      });
    }, 1200);
  }
}
