/**
 * AuthContext — provides Firebase Authentication state across the app.
 *
 * Google Services used: Firebase Authentication, Google Sign-In provider.
 *
 * Why: Centralises auth logic so components can access the current user
 * without prop-drilling. Uses onAuthStateChanged for reactive updates.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app to supply user state and sign-in/out methods.
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /** Signs in with Google using a popup. */
  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      // Silently handle popup cancellations (user closed the popup)
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Sign-in error:', error.message);
      }
    }
  }, []);

  /** Signs out the current user. */
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error.message);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume auth state from any component. */
export function useAuth() {
  return useContext(AuthContext);
}
