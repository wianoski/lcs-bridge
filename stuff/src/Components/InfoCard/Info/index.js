import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import { Paper, Grid, List } from '@material-ui/core';
import { red, orange, green, blue } from '@material-ui/core/colors';
import { Switch } from '@material-ui/core';
import Maintenance from '@material-ui/icons/Build';
import AccessibilityNewIcon from '@material-ui/icons/AccessibilityNew';
import { fs } from '../../../index'

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.background.paper,
    },
    maintenance: {
        backgroundColor: blue[500],
    },
    danger: {
        backgroundColor: red[500],
    },
    warning: {
        backgroundColor: orange[500],
    },
    healthy: {
        backgroundColor: green[500],
    },
    unusable: {
        backgroundColor: 'black',
    },
}));

export default function FolderList(props) {
    const classes = useStyles();
    const [isMaintenance, setIsMaintennce] = React.useState(props.data.status === 4);

    const toggleMaintenance = () => {
        if (props.data.status === 4) {
            fs.collection('Bridge').doc(props.data.id).update({
                "status": 3
            })
        } else {
            fs.collection('Bridge').doc(props.data.id).update({
                "status": 4
            })
        }
        setIsMaintennce((prev) => !prev);
    };
    const [isUsable, setIsUsable] = React.useState(!props.data.isUsable);
    const toggleUsable = () => {
        if (props.data.isUsable) {
            fs.collection('Bridge').doc(props.data.id).update({
                "isUsable": false
            })
        } else {
            fs.collection('Bridge').doc(props.data.id).update({
                "isUsable": true
            })
        }
        setIsUsable((prev) => !prev);
    };

    return (
        <>
            <Grid container spacing={2}>
                {props.first ? (
                    <>
                        <Grid item xs={6} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={12}>
                                    <Paper elevation={4}>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar className={props.data.status === 4 ? classes.maintenance : ''}>
                                                    <Maintenance />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary="Status Sistem" secondary={props.data.status === 4 ? 'Dalam Perbaikan' : 'Berfungsi'} />
                                            {props.privilege > 2 ? '' : (
                                                <Switch color={'primary'} checked={isMaintenance} onChange={toggleMaintenance} />
                                            )}
                                        </ListItem>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={6} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={12}>
                                    <Paper elevation={4}>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar className={props.data.isUsable ? classes.healthy : classes.unusable}>
                                                    <AccessibilityNewIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary="Status Layanan" secondary={props.data.isUsable ? 'Berfungsi' : 'Tidak Berfungsi'} />
                                            {props.privilege > 2 ? '' : (
                                                <Switch color={'primary'} checked={isUsable} onChange={toggleUsable} />
                                            )}
                                        </ListItem>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>
                    </>
                ) : (
                        <>
                            <Grid item xs={12} md={12}>
                                <Paper elevation={4}>
                                    <List>
                                        <ListItem>
                                            <ListItemText primary={'Alamat'} secondary={props.data.address} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary={'Provinsi'} secondary={props.data.province} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary={'Nomor Jembatan'} secondary={props.data.bridge_number} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary={'Tahun Pembangunan'} secondary={props.data.year_construction} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary={'Latitude'} secondary={props.data.latitude} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary={'Longitude'} secondary={props.data.longitude} />
                                        </ListItem>
                                    </List>
                                </Paper>
                            </Grid>
                        </>
                    )}
            </Grid>
        </>
    );
}
