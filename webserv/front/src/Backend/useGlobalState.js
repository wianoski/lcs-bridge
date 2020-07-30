import { useState } from 'react';

const useGlobalState = () => {
    const [state, setState] = useState({
        accountState: {
            email: '',
            username: '',
            logged: false
        },
        key: '',
        currentPage: 'root',
        bridgeId: '',
        bridgeData:[],
        mapInstance: null,
        mapCenter: {
            lat: -0.789275,
            lng: 113.921327
        },
        mapZoom: 5
    })

    const actions = (action) => {
        const { type, payload } = action;
        switch (type) {
            case 'setState':
                return setState(payload)
            default:
                return state;
        }
    }
    return { state, actions }
}

export default useGlobalState;