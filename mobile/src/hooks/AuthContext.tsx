import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

type AuthContextType = {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const value = useMemo(
        () => ({ isAuthenticated, setIsAuthenticated }),
        [isAuthenticated]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }
    return context;
};
