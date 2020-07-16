import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import CloudIcon from '@material-ui/icons/Cloud';
import { Dialog, DialogTitle, DialogContent, Grid, DialogActions, Button, Card, CardContent, CardActions, Paper } from '@material-ui/core';
import { red, orange, green, blue } from '@material-ui/core/colors';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import moment from 'moment-timezone'
import SettingsRemoteIcon from '@material-ui/icons/SettingsRemote';
import AssessmentIcon from '@material-ui/icons/Assessment';
import Chart from '../Chart'
import Threshold from '../Threshold'

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        maxWidth: 360,
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
}));

export default function FolderList(props) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const handleCloseLayout = () => {
        setOpen(false);
    };
    return (
        <>
            <Dialog
                fullScreen={true}
                open={open}
                onClose={handleCloseLayout}
            >
                <DialogTitle>{props.name}</DialogTitle>
                <DialogContent style={{ display: 'flex', overflowY: 'hidden' }}>
                    <Grid container
                        spacing={2}
                        align="center"
                        justify="center"
                        direction="column"
                    >
                        <Grid item xs={12} md={10}>
                            <Chart concentrator={props.concentrator} section={props.section} sensor={props.sensor} id={props.id} unit={props.unit} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Threshold privilege={props.privilege} concentrator={props.concentrator} section={props.section} sensor={props.sensor} id={props.id} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button color="primary" onClick={() => setOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            <Card elevation={4}>
                <CardContent>
                    <List className={classes.root}>
                        {props.name ? (
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar className={classes.maintenance}>
                                        <SettingsRemoteIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={props.name} secondary={'Last update: ' + moment(parseInt(Date.now())).format('DD-MM-YYYY hh:mm:ss').toString()} />
                            </ListItem>
                        ) : ''}
                        <ListItem>
                            <ListItemAvatar>
                                <Avatar className={props.connectivity === 0 ? classes.danger : classes.healthy}>
                                    {props.connectivity === 0 ? <CloudOffIcon /> : <CloudIcon />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Konektivitas" secondary={props.connectivity === 0 ? 'Offline' : 'Online'} />
                        </ListItem>
                        <ListItem>
                            <ListItemAvatar>
                                <Avatar>
                                    <AssessmentIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Average Value" secondary={33} />
                        </ListItem>
                        <ListItem>
                            <ListItemAvatar>
                                <Avatar>
                                    <AssessmentIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Maximum Value" secondary={100} />
                        </ListItem>

                        <ListItem>
                            <ListItemAvatar>
                                <Avatar>
                                    <AssessmentIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Minimum Value" secondary={20} />
                        </ListItem>
                    </List>
                </CardContent>
                <CardActions>
                    <Button variant={'contained'} color={'primary'} fullWidth onClick={() => setOpen(true)}>Show Graph</Button>
                </CardActions>

            </Card>
        </>
    );
}
