import React, { useContext, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import env from '../../env.json';
import Context from '../../Backend/Context'
import { fs, db, base } from '../../index'
import { Dialog, Grid, Paper, ListItem, ListItemText, List, ListItemSecondaryAction } from '@material-ui/core'
import InfoCard from '../InfoCard'
import { useSnackbar } from 'notistack';
import Legends from './Legends'
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import { red } from '@material-ui/core/colors';
import { Button } from '@material-ui/core';
var moment = require('moment-timezone')

const useStyles = makeStyles((theme) => ({
    root: {
        maxWidth: 600,
    },
    media: {
        height: 0,
        paddingTop: '56.25%', // 16:9
        minWidth: 600
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
    avatar: {
        backgroundColor: red[500],
    },
}));

const style = [
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    }
]

export default function Maps(props) {
    const classes = useStyles();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { state, actions } = useContext(Context)
    const [bridgeLists, setBridgeLists] = useState([])
    const [exist, setExist] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [open, setOpen] = useState(false)
    const [openSnapshot, setOpenSnapshot] = useState(false)
    const [bridgeInfo, setBridgeInfo] = useState()
    const [notification, setNotification] = useState([])
    const Danger = { url: require("../../Asset/pin/danger.png"), scaledSize: { width: 30, height: 30 } }
    const Warning = { url: require("../../Asset/pin/warning.png"), scaledSize: { width: 30, height: 30 } }
    const Healthy = { url: require("../../Asset/pin/healthy.png"), scaledSize: { width: 30, height: 30 } }
    const Maintenance = { url: require("../../Asset/pin/maintenance.png"), scaledSize: { width: 30, height: 30 } }
    const Unusable = { url: require("../../Asset/pin/unusable.png"), scaledSize: { width: 30, height: 30 } }
    // const Sensor = { url: require("../../Asset/pin/sensor.png"), scaledSize: { width: 30, height: 30 } }
    const handleCloseCard = () => {
        setOpen(false);
    };
    const handleCloseSnapshot = () => {
        setOpenSnapshot(false);
    };
    React.useEffect(() => {
        var messaging = base.messaging()
        messaging
            .requestPermission()
            .then(() => {
                console.log("Notification permission granted.", messaging.getToken());
                messaging.onMessage((payload) => {
                    console.log('Message received. ', payload)
                    enqueueSnackbar(payload.data['"title"'].replace(/"/g, ''), {
                        key: payload.collapse_key + payload.data['"timestamp"'].replace(/"/g, ''), variant: 'warning', onClick: () => {
                            setOpen(false)
                            setOpenSnapshot(true)
                            closeSnackbar(payload.collapse_key + payload.data['"timestamp"'].replace(/"/g, ''))
                            setBridgeInfo(payload.data['"article_data"'].replace(/"/g, ''))
                            fs.collection('Bridge').doc(payload.data['"article_data"'].replace(/"/g, '')).update({
                                "notificationLastSeen": payload.data['"timestamp"'].replace(/"/g, '')
                            })
                        }
                    });
                });
                return messaging.getToken()
            })
            .then((token) => {
                console.log(props.user.uid);
                db.ref('users/' + props.user.uid).once('value', (snapshot) => {
                    if (snapshot.val()) {
                        if (snapshot.val().FCMToken !== token) {
                            db.ref('users/' + props.user.uid).set({
                                FCMToken: token,
                                subscribed: false
                            })
                        } else {
                            db.ref('users/' + props.user.uid).set({
                                FCMToken: token,
                                subscribed: false
                            })
                        }
                    }
                })
            })
            .catch((err) => {
                console.log("Unable to get permission to notify.", err);
            });
        messaging.onTokenRefresh(() => {
            messaging.getToken().then((refreshedToken) => {
                db.ref('users/' + props.user.uid).once('value', (snapshot) => {
                    if (snapshot.val().FCMToken !== refreshedToken) {
                        db.ref('users/' + props.user.uid).set({
                            FCMToken: refreshedToken,
                            subscribed: false
                        })
                    }
                })
            }).catch((err) => {
                console.log('Unable to retrieve refreshed token ', err)
            });
        });
    }, [])
    React.useEffect(() => {
        if (loaded) {
            enqueueSnackbar('Markers fetched.', { key: 'fetched', variant: 'success', onClick: () => closeSnackbar('fetched') });
        } else if (!loaded) {
            enqueueSnackbar('Fetching markers....', { key: 'fetching', variant: 'info', onClick: () => closeSnackbar('fetching') });
        }
    }, [enqueueSnackbar, loaded, closeSnackbar]);
    if (!exist) {
        var bridgeList = {}
        if (state.mapInstance) {
            fs.collection("Bridge").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    var newData = doc.data()
                    newData.id = doc.id
                    bridgeList[doc.id] = newData
                });
                if (bridgeList.length !== 0) {
                    setBridgeLists(bridgeList)
                    setExist(true)
                }
            }).catch((e) => { enqueueSnackbar('Failed fetching the markers. Please reload the page.', { variant: 'error' }) });
        }
    }
    React.useEffect(() => {
        if (exist && bridgeLists.length !== 0) {
            Object.keys(bridgeLists).forEach(function (key) {
                fs.collection("Bridge").doc(key)
                    .onSnapshot((snapshot) => {
                        bridgeLists[key] = snapshot.data()
                        bridgeLists[key].id = key
                        setBridgeLists({
                            ...bridgeLists,
                            [key]: bridgeLists[key]
                        })
                    })
                if (Object.keys(bridgeLists).length !== 0) {
                    setLoaded(true)
                }
            });
        }
    }, [exist])
    React.useEffect(() => {
        if (typeof bridgeInfo !== 'undefined' && typeof bridgeLists[bridgeInfo] !== 'undefined') {
            console.log(bridgeLists[bridgeInfo].notificationLastSeen);

            fs.collection('notification_history')
                .where("bridge_id", "==", bridgeInfo)
                .where('timestamp', '==', parseInt(bridgeLists[bridgeInfo].notificationLastSeen))
                .orderBy('time').limitToLast(1)
                .get()
                .then((snapshot) => {
                    console.log('active');

                    var notifications = {}
                    snapshot.forEach(element => {
                        var temp = element.data()
                        temp.id = element.id
                        notifications[element.data().timestamp] = temp
                    });
                    setNotification(notifications)
                    console.log(notifications)
                });
        }
    }, [bridgeInfo, bridgeLists])
    return (
        <>
            <div>
                <Dialog scroll={'body'} open={open} onClose={handleCloseCard} aria-labelledby="form-dialog-title">
                    <InfoCard privilege={props.privilege} user={props.user} data={bridgeLists[bridgeInfo]} />
                </Dialog>
                <Dialog scroll={'body'} open={openSnapshot} onClose={handleCloseSnapshot} aria-labelledby="form-dialog-title">
                    {bridgeInfo ? (
                        <>
                            <Card className={classes.root}>
                                <CardMedia
                                    className={classes.media}
                                    image={bridgeLists[bridgeInfo].image}
                                    title={bridgeLists[bridgeInfo].name}
                                />
                                <CardHeader
                                    title={bridgeLists[bridgeInfo].name}
                                    subheader={'List notifikasi'}
                                />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        {Object.keys(notification).length !== 0 ? (
                                            Object.keys(notification).map((value, i) => (
                                                <React.Fragment key={i}>
                                                    {console.log(notification[value])}
                                                    <Grid item xs={12} md={12}>
                                                        <Paper elevation={4}>
                                                            <List>
                                                                <ListItem>
                                                                    <ListItemText primary={
                                                                        notification[value].sensor_id
                                                                    } secondary={notification[value].detail} />
                                                                </ListItem>
                                                                <ListItemSecondaryAction>
                                                                    {notification[value].time}
                                                                </ListItemSecondaryAction>
                                                            </List>
                                                        </Paper>
                                                    </Grid>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                                <>
                                                    <Grid item xs={12} md={12}>
                                                        <Paper elevation={4}>
                                                            <List>
                                                                <ListItem>
                                                                    <ListItemText primary={
                                                                        'Tidak ada notifikasi'
                                                                    } secondary={'Notifikasi baru akan tampil secara otomatis.'} />
                                                                </ListItem>
                                                            </List>
                                                        </Paper>
                                                    </Grid>
                                                </>
                                            )
                                        }
                                    </Grid>
                                </CardContent>
                                <CardActions disableSpacing>
                                    <Button variant="outlined" fullWidth color="primary" onClick={() => {
                                        setOpenSnapshot(false);
                                        state.mapInstance.panTo({
                                            lat: bridgeLists[bridgeInfo].latitude,
                                            lng: bridgeLists[bridgeInfo].longitude
                                        })
                                        setTimeout(function () {
                                            state.mapInstance.setZoom(17)
                                            setTimeout(function () {
                                                setOpen(true)
                                            }, 1000)
                                        }, 500)

                                    }}>
                                        Bridge Detail
                            </Button>
                                </CardActions>
                            </Card>
                        </>
                    ) : ''}
                </Dialog>
                <Legends privilege={props.privilege} />
            </div>
            <LoadScript
                id="script-loader"
                googleMapsApiKey={env.mapsApi}
            >
                <GoogleMap
                    mapContainerStyle={{
                        height: "100%",
                        width: "100%"
                    }}
                    options={{ styles: style, disableDefaultUI: 'True' }}
                    clickableIcons={false}
                    zoom={state.mapZoom}
                    center={state.mapCenter}
                    onLoad={map => {
                        actions({
                            type: 'setState',
                            payload: {
                                ...state,
                                mapInstance: map
                            }
                        })
                    }}
                >
                    {
                        Object.keys(bridgeLists).map((key) => (
                            <React.Fragment key={key}>
                                <Marker
                                    key={key}
                                    title={bridgeLists[key].name}
                                    onClick={(event) => {
                                        setBridgeInfo(key)
                                        setOpen(true)
                                    }}
                                    icon={
                                        props.privilege > 2 ? (
                                            bridgeLists[key].status === 1 ? Danger : bridgeLists[key].status === 2 ? Warning : bridgeLists[key].status === 3 ? Healthy : bridgeLists[key].status === 4 ? Maintenance : bridgeLists[key].status === 5 ? Unusable : ''
                                        ) : (
                                                bridgeLists[key].status === 1 ? Danger : bridgeLists[key].status === 2 ? Warning : bridgeLists[key].status === 3 ? Healthy : bridgeLists[key].status === 4 ? Maintenance : bridgeLists[key].status === 5 ? Unusable : ''
                                            )
                                    }
                                    position={{
                                        lat: bridgeLists[key].latitude,
                                        lng: bridgeLists[key].longitude
                                    }}
                                />
                            </React.Fragment>
                        ))
                    }
                </GoogleMap>
            </LoadScript>
        </>
    )
}
