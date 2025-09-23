// This file augments the auth-context types to fix TypeScript errors

// Declare module augmentation to add the missing emailConfirmationRequired type
declare module "./auth-context" {
  // Extend the SignUpResult interface
  interface SignUpResult {
    error: any | null;
    profilePromise?: Promise<void>;
    refreshPromise?: Promise<void>;
    emailConfirmationRequired?: boolean;
  }
}

export {}; // Export an empty object to make this a module
