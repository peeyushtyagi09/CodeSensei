import React, { createContext, useEffect, useState } from 'react';
import { getMe, logoutUser } from '../lib/auth'; 

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading]= useState(true);
    const [authReady, setAuthReady] = useState(false);

    // load user on app start
    useEffect(() => {
        const fetchUser = async () => {
            try{
                const res = await getMe();
                setUser(res.data.data);
            }catch(err) {
                setUser(null);
            }finally {
                setLoading(false);
                setAuthReady(true);
            }
        };
        fetchUser();
    }, []);

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return(
        <AuthContext.Provider 
            value={{
                user, 
                setUser, 
                loading,
                authReady, 
                logout,
            }}
        ></AuthContext.Provider>
    );
};

export default AuthProvider;