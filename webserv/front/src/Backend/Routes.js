import React, { useState } from 'react';
import useGlobalState from './useGlobalState'
import Context from './Context'
import App from '../Layout';
import Login from '../Layout/Login'
import { auth, fs } from '../index'
import { SnackbarProvider } from 'notistack';

function Routes() {
    const [authState, setAuthState] = useState(true)
    const [userState, setUserState] = useState()
    const [userPrivilege, setUserPrivilege] = useState()

    auth.onAuthStateChanged(function (user) {
        if (user) {
            setUserState(user)
            fs.collection("user_privilege").doc(user.uid)
            .onSnapshot(function(doc) {
                setUserPrivilege(doc.data().privilege)
                setAuthState(true)
            });            
        } else {
            setAuthState(false)
        }
    });
    const store = useGlobalState();
    return (
        <>
            <Context.Provider value={store}>
                <SnackbarProvider maxSnack={4}>
                    {authState ? <App privilege={userPrivilege} user={userState} /> : <Login />}
                </SnackbarProvider>
            </Context.Provider>
        </>
    )
}

export default Routes;