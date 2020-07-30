import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Avatar from '@material-ui/core/Avatar';
import { red, orange, green, blue, purple } from '@material-ui/core/colors';
import Healthy from '@material-ui/icons/Favorite';
import Danger from '@material-ui/icons/Error';
import Warning from '@material-ui/icons/Warning';
import Maintenance from '@material-ui/icons/Build';
import CloseIcon from '@material-ui/icons/Close';
import Info from './Info'
import { CardActions, Button, Dialog, DialogTitle, DialogContent, Grid, DialogActions, Paper } from '@material-ui/core';
import clsx from 'clsx';
import Collapse from '@material-ui/core/Collapse';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Sensors from './Sensors';
import {
    DatePicker,
} from '@material-ui/pickers';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import moment from 'moment-timezone'
import Report from './Report'

const useStyles = makeStyles((theme) => ({
    root: {
        minWidth: 600,
    },
    formControl: {
        margin: theme.spacing(3),
    },
    media: {
        height: 0,
        paddingTop: '56.25%',
    },
    expand: {
        transform: 'rotate(0deg)',
        margin: 0,
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
    sensor: {
        backgroundColor: purple[500],
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

export default function InfoCard(props) {
    const classes = useStyles();
    const [openLayout, setOpenLayout] = React.useState(false);
    const [openReport, setOpenReport] = React.useState(false);
    const [openReportView, setOpenReportView] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const [startDate, setStartDate] = React.useState(moment(moment(Date.now()).format('YYYY-MM-DD')).unix() * 1000);
    const [endDate, setEndDate] = React.useState((moment(moment(Date.now()).format('YYYY-MM-DD')).unix() * 1000) + 86399999);
    const handleStartDate = (event) => {
        setStartDate(moment(moment(event.unix() * 1000).format('YYYY-MM-DD')).unix() * 1000);
    };
    const handleEndDate = (event) => {
        setEndDate((moment(moment(event.unix() * 1000).format('YYYY-MM-DD')).unix() * 1000) + 86399999);
    };
    var sensorData = {}
    var sensorFilter = {}
    Object.keys(props.data.thresholds).forEach((keys) => {
        if (keys === 'concentratorOne') {
            Object.keys(props.data.thresholds[keys]).forEach((key) => {
                if (typeof props.data.thresholds[keys][key].rtu !== 'undefined') {
                    props.data.thresholds[keys][key]['concentrator'] = keys
                    props.data.thresholds[keys][key]['sensor'] = key
                    sensorFilter[props.data.thresholds[keys][key].group] = false
                    if (typeof sensorData[props.data.thresholds[keys][key].group] === 'undefined') {
                        sensorData[props.data.thresholds[keys][key].group] = [props.data.thresholds[keys][key]]
                    } else {
                        sensorData[props.data.thresholds[keys][key].group].push(props.data.thresholds[keys][key])
                    }
                }
            })
        }
    })
    const [state, setState] = React.useState(sensorFilter);

    const handleChange = (event) => {
        setState({ ...state, [event.target.name]: event.target.checked });
    };

    var sensorChecked = []
    Object.keys(state).forEach((value) => {
        sensorChecked.push(state[value])
    })
    const error = sensorChecked.filter((v) => v).length < 1;
    var filteredSensor = []
    Object.keys(sensorData).forEach((value, i) => {
        if (sensorChecked[i]) {
            filteredSensor.push(sensorData[value])
        }
    })

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };
    const handleCloseLayout = () => {
        setOpenLayout(false);
    };
    const handleClickOpenLayout = () => {
        setOpenLayout(true);
    };
    const handleCloseReport = () => {
        setOpenReport(false);
    };
    const handleClickOpenReport = () => {
        setOpenReport(true);
    };
    const handleCloseReportView = () => {
        setOpenReportView(false);
    };
    const handleClickOpenReportView = () => {
        setOpenReportView(true);
    };
    return (
        <>
            <Dialog
                open={openLayout}
                onClose={handleCloseLayout}
                fullScreen
            >
                <DialogTitle>{'Layout Sistem ' + props.data.name}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={5}>
                        <Grid item xs={12} md={12}>
                            <Sensors data={sensorData} id={props.data.id} privilege={props.privilege} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button color={'secondary'} variant={'contained'} onClick={handleClickOpenReport}>Report</Button>
                    <Button color={'primary'} variant={'contained'} onClick={handleCloseLayout}>Close</Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={openReportView}
                onClose={handleCloseReportView}
                fullScreen
            >
                <DialogTitle>{'Sensor Report dari ' + props.data.name}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={5}>
                        <Grid item xs={12} md={12}>
                            {Object.keys(filteredSensor).map((value, i) => (
                                <React.Fragment key={i}>
                                    <Report data={filteredSensor[value]} opened={openReportView} id={props.data.id} startDate={startDate} endDate={endDate} />
                                </React.Fragment>
                            ))}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button color={'secondary'} variant={'contained'} onClick={() => console.log('Print.')}>Print</Button>
                    <Button color={'primary'} variant={'contained'} onClick={handleCloseReportView}>Close</Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={openReport}
                onClose={handleCloseReport}
            >
                <DialogTitle>{'Report Filter'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={5}>
                                <FormControl required error={error} component="fieldset" className={classes.formControl}>
                                    <FormLabel component="legend">Data Sensor</FormLabel>
                                    <FormGroup>
                                        {
                                            Object.keys(sensorData).map((keys, index) => (
                                                <React.Fragment key={index}>
                                                    <FormControlLabel
                                                        control={<Checkbox checked={state[keys]} onChange={handleChange} name={keys} />}
                                                        label={keys}
                                                    />
                                                </React.Fragment>
                                            ))
                                        }
                                    </FormGroup>
                                    <FormHelperText>pilih minimal 1 sensor</FormHelperText>
                                </FormControl>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={12}>
                                    <Paper elevation={5}>
                                        <FormControl component="fieldset" className={classes.formControl}>
                                            <FormLabel component="legend">Batas Awal</FormLabel>
                                            <DatePicker maxDate={endDate} format='dddd, DD MMM YYYY' value={startDate} fullWidth onChange={handleStartDate} />
                                            <FormHelperText>batas awal pengambilan data</FormHelperText>
                                        </FormControl>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={12}>
                                    <Paper elevation={5}>
                                        <FormControl component="fieldset" className={classes.formControl}>
                                            <FormLabel component="legend">Batas Akhir</FormLabel>
                                            <DatePicker minDate={startDate} format='dddd, DD MMM YYYY' value={endDate} fullWidth onChange={handleEndDate} />
                                            <FormHelperText>batas akhir pengambilan data</FormHelperText>
                                        </FormControl>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button color={'secondary'} disabled={error} variant={'contained'} onClick={() => {
                        handleClickOpenReportView(true)
                    }}>
                        Generate Report
                    </Button>
                    <Button color={'primary'} variant={'contained'} onClick={handleCloseReport}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
            <Card className={classes.root}>
                <CardHeader
                    avatar={
                        <Avatar
                            className={props.privilege > 2 ? (
                                props.data.isUsable ? (props.data.status === 1 ? classes.danger : props.data.status === 2 ? classes.warning : props.data.status === 3 ? classes.healthy : props.data.status === 4 ? classes.maintenance : props.data.status === 5 ? classes.danger : '') : classes.unusable
                            ) : (
                                    props.data.isUsable ? (props.data.status === 1 ? classes.danger : props.data.status === 2 ? classes.warning : props.data.status === 3 ? classes.healthy : props.data.status === 4 ? classes.maintenance : props.data.status === 5 ? classes.sensor : '') : classes.unusable
                                )
                            }
                        >
                            {
                                props.privilege > 2 ? (
                                    props.data.status === 1 ? <Danger /> : props.data.status === 2 ? <Warning /> : props.data.status === 3 ? <Healthy /> : props.data.status === 4 ? <Maintenance /> : props.data.status === 5 ? <CloseIcon /> : ''
                                ) : (
                                        props.data.status === 1 ? <Danger /> : props.data.status === 2 ? <Warning /> : props.data.status === 3 ? <Healthy /> : props.data.status === 4 ? <Maintenance /> : props.data.status === 5 ? <CloseIcon /> : ''
                                    )
                            }
                        </Avatar>
                    }
                    title={props.data.name}
                    subheader={props.data.bridge_number}
                />
                <CardMedia
                    className={classes.media}
                    image={props.data.image}
                    title={props.data.name}
                />
                <CardContent>
                    <Info
                        first={true}
                        data={props.data}
                        privilege={props.privilege}
                    />
                </CardContent>
                <CardActions disableSpacing>
                    <Button
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label="Show more"
                        color='primary'
                        fullWidth
                        variant='outlined'
                    >
                        <ExpandMoreIcon
                            className={clsx(classes.expand, {
                                [classes.expandOpen]: expanded,
                            })}
                        />
                    </Button>
                </CardActions>
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <CardContent>
                        <Info
                            first={false}
                            data={props.data}
                            privilege={props.privilege}
                        />
                    </CardContent>
                    <CardActions>
                        <Button variant={'contained'} fullWidth color={'primary'} onClick={() => handleClickOpenLayout()}>Details</Button>
                    </CardActions>
                </Collapse>
            </Card>
        </>
    );
}