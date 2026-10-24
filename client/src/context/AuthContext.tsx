import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppUser,
  signInWithGoogleService,
  registerWithEmailService,
  loginWithEmailService,
  logoutUserService,
  isFirebaseConfigured,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  getStoredFirebaseConfig,
  FirebaseConfigParams
} from '../services/firebase';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseLive: boolean;
  firebaseConfig: FirebaseConfigParams;
  updateFirebaseConfig: (config: FirebaseConfigParams) => boolean;
  resetFirebaseConfig: () => void;
  signInWithGoogle: (role?: 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN') => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    name: string,
    email: string,
    pass: string,
    role: 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN',
    agency?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN') => void;
  loadDemoProfile: (profileKey: 'coordinator' | 'doctor' | 'responder' | 'citizen') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'sahaaysetu_auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(isFirebaseConfigured);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfigParams>(getStoredFirebaseConfig());

  // Load persisted session on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AppUser = JSON.parse(stored);
        setUser(parsed);
      } else {
        // User starts unauthenticated if no stored session, allowing direct evaluation of Login and Registration flows
        setUser(null);
      }
    } catch (err) {
      console.warn('Session load note:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFirebaseConfigHandler = (newConfig: FirebaseConfigParams): boolean => {
    const success = saveCustomFirebaseConfig(newConfig);
    setFirebaseConfig(newConfig);
    setIsFirebaseLive(success);
    return success;
  };

  const resetFirebaseConfigHandler = () => {
    clearCustomFirebaseConfig();
    const def = getStoredFirebaseConfig();
    setFirebaseConfig(def);
    setIsFirebaseLive(isFirebaseConfigured);
  };

  const saveUserSession = (newUser: AppUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const signInWithGoogle = async (role?: 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN') => {
    setIsLoading(true);
    try {
      const loggedUser = await signInWithGoogleService(role);
      saveUserSession(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await loginWithEmailService(email, pass);
      saveUserSession(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    role: 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN',
    agency?: string
  ) => {
    setIsLoading(true);
    try {
      const newUser = await registerWithEmailService(name, email, pass, role, agency);
      saveUserSession(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await logoutUserService();
      saveUserSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN') => {
    if (!user) return;
    const roleTitle = newRole === 'COORDINATOR'
      ? 'District Disaster Management Authority (DDMA)'
      : newRole === 'FIRST_RESPONDER'
      ? 'Emergency Medical Services (108 / 112)'
      : 'Verified Citizen First Reporter';

    const updated: AppUser = {
      ...user,
      role: newRole,
      roleTitle
    };
    saveUserSession(updated);
  };

  const loadDemoProfile = (profileKey: 'coordinator' | 'doctor' | 'responder' | 'citizen') => {
    let demoUser: AppUser;
    switch (profileKey) {
      case 'doctor':
        demoUser = {
          uid: 'usr-demo-dr-ananya',
          email: 'dr.ananya.roy@trauma.sahaaysetu.org',
          displayName: 'Dr. Ananya Roy, MD',
          photoURL: 'https://ui-avatars.com/api/?name=Ananya+Roy&background=0d9488&color=fff',
          role: 'FIRST_RESPONDER',
          roleTitle: 'Chief Medical Officer / Trauma Resuscitation',
          agency: '108 Advanced Cardiac Life Support (ACLS)',
          authProvider: 'demo',
          createdAt: new Date().toISOString()
        };
        break;
      case 'responder':
        demoUser = {
          uid: 'usr-demo-fire-officer',
          email: 'officer.jadhav@fire.sahaaysetu.gov.in',
          displayName: 'Station Officer Nilesh Jadhav',
          photoURL: 'https://ui-avatars.com/api/?name=Nilesh+Jadhav&background=ea580c&color=fff',
          role: 'FIRST_RESPONDER',
          roleTitle: 'Fire & Rescue Incident Commander',
          agency: 'Municipal Fire Brigade & HazMat Response (101)',
          authProvider: 'demo',
          createdAt: new Date().toISOString()
        };
        break;
      case 'citizen':
        demoUser = {
          uid: 'usr-demo-citizen',
          email: 'priya.sharma@gmail.com',
          displayName: 'Priya Sharma',
          photoURL: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=6366f1&color=fff',
          role: 'CITIZEN',
          roleTitle: 'Verified Community Eyewitness',
          agency: 'Civic Neighbourhood Volunteer',
          authProvider: 'demo',
          createdAt: new Date().toISOString()
        };
        break;
      case 'coordinator':
      default:
        demoUser = {
          uid: 'usr-demo-vikram',
          email: 'vikram.deshmukh@sahaaysetu.gov.in',
          displayName: 'Vikramaditya Deshmukh',
          photoURL: 'https://ui-avatars.com/api/?name=Vikramaditya+Deshmukh&background=0284c7&color=fff',
          role: 'COORDINATOR',
          roleTitle: 'District Disaster Management Authority (DDMA)',
          agency: 'State Emergency Operations Centre',
          authProvider: 'google',
          createdAt: new Date().toISOString()
        };
        break;
    }
    saveUserSession(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isFirebaseLive,
        firebaseConfig,
        updateFirebaseConfig: updateFirebaseConfigHandler,
        resetFirebaseConfig: resetFirebaseConfigHandler,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        signOut,
        switchRole,
        loadDemoProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
