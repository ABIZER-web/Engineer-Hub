// frontend/src/contexts/CookieConsentContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'engineer_hub_cookie_consent';

const CookieConsentContext = createContext();

export const useCookieConsent = () => {
    const context = useContext(CookieConsentContext);
    if (!context) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
};

export const CookieConsentProvider = ({ children }) => {
    const [consentState, setConsentState] = useState({
        given: false,
        necessary: true,      // Always true
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
    });
    const [showBanner, setShowBanner] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load stored consent on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setConsentState(parsed);
                setShowBanner(false);
            } else {
                setShowBanner(true);
            }
        } catch {
            setShowBanner(true);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveConsent = (newState) => {
        const updated = {
            ...newState,
            given: true,
            necessary: true,
            timestamp: new Date().toISOString(),
        };
        setConsentState(updated);
        setShowBanner(false);
        try {
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updated));
        } catch {
            console.error('Failed to save cookie consent to localStorage');
        }
    };

    // Accept all cookies
    const acceptAll = () => {
        saveConsent({ necessary: true, analytics: true, marketing: true, preferences: true });
    };

    // Accept only necessary cookies
    const acceptNecessary = () => {
        saveConsent({ necessary: true, analytics: false, marketing: false, preferences: false });
    };

    // Accept custom selection
    const acceptCustom = (choices) => {
        saveConsent({ necessary: true, ...choices });
    };

    // Withdraw consent (reset)
    const withdrawConsent = () => {
        const reset = { given: false, necessary: true, analytics: false, marketing: false, preferences: false, timestamp: null };
        setConsentState(reset);
        setShowBanner(true);
        localStorage.removeItem(COOKIE_CONSENT_KEY);
    };

    const value = {
        consentState,
        showBanner,
        isLoaded,
        acceptAll,
        acceptNecessary,
        acceptCustom,
        withdrawConsent,
        hasConsent: consentState.given,
        analyticsAllowed: consentState.analytics,
        marketingAllowed: consentState.marketing,
        preferencesAllowed: consentState.preferences,
    };

    return (
        <CookieConsentContext.Provider value={value}>
            {children}
        </CookieConsentContext.Provider>
    );
};

export default CookieConsentContext;
