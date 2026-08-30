'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, getCurrentUserToken } from '@/lib/firebase/auth';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isOrgAdmin: boolean;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (firebaseUid: string, userToken: string) => {
    try {
      const response = await fetch(`/api/users/${firebaseUid}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      } else {
        console.error('Failed to fetch user profile');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUserData) => {
      setFirebaseUser(firebaseUserData);

      if (firebaseUserData) {
        // User is signed in
        const userToken = await getCurrentUserToken();
        setToken(userToken);

        if (userToken) {
          await fetchUserProfile(firebaseUserData.uid, userToken);
        }
      } else {
        // User is signed out
        setUser(null);
        setToken(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const userToken = await getCurrentUserToken();
      if (userToken) {
        await fetchUserProfile(firebaseUser.uid, userToken);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        token,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
