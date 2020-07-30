import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Paper, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core';
import Status from './Status'
import Rangka from '../../../Asset/rangka.png'
import Accelorometer from '../../../Asset/icon/ic_acc.png'
import Anemometer from '../../../Asset/icon/ic_anemometer.png'
import Displacement from '../../../Asset/icon/ic_displacement.jpg'
import Gyroscope from '../../../Asset/icon/ic_gyro.png'
import ic_humidity from '../../../Asset/icon/ic_humidity.png'
import Inclinometer from '../../../Asset/icon/ic_inclinometer.png'
import Placement from '../../../Asset/icon/ic_placement.png'
import StrainGauge from '../../../Asset/icon/ic_straingauge.jpg'
import Thermistor from '../../../Asset/icon/ic_thermistor.png'

export default function FileSystemNavigator(props) {
    const [openInfo, setOpenInfo] = React.useState(false);
    const [sensorDatas, setSensorDatas] = React.useState();

    const handleClose = () => {
        setOpenInfo(false);
    };
    const sensorData = props.data
    const icons = {
        'Accelorometer': Accelorometer,
        'Anemometer': Anemometer,
        'Displacement': Displacement,
        'Gyroscope': Gyroscope,
        'Humidity': ic_humidity,
        'Inclinometer': Inclinometer,
        'Placement': Placement,
        'Strain': StrainGauge,
        'Temperature': Thermistor
    }
    return (
        <>
            {sensorDatas ? (
                <Dialog
                    open={openInfo}
                    onClose={handleClose}
                    maxWidth={'lg'}
                >
                    <DialogTitle>{'Daftar Sensor'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            {sensorDatas.map((value, i) => (
                                <Grid key={i} item xs={sensorDatas.length === 1 ? 12 : 6} md={sensorDatas.length === 1 ? 12 : 6}>
                                    <Status connectivity={value.status_sensor} name={value.alias} concentrator={value.concentrator} section={value.sensor} rtu={value.rtu} sensor={'Main'} id={props.id} unit={value.unit} />
                                </Grid>
                            ))}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button color="primary" variant={'contained'} onClick={() => setOpenInfo(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            ) : ''}

            <Grid container spacing={2} >

                <Grid item xs={12} md={10} style={{ display: 'flex' }}>
                    <Grid
                        container
                        spacing={0}
                        align="center"
                        justify="center"
                        direction="column"
                    >
                        <Grid item>
                            <img
                                id={'layout'}
                                src={Rangka}
                                alt=''
                            />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} md={2}>
                    <Grid container spacing={2}>
                        {
                            Object.keys(sensorData).map((keys, index) => (
                                <React.Fragment key={index}>
                                    <Grid item xs={6} md={12}>
                                        <Paper elevation={5}>
                                            <ListItem button onClick={() => {
                                                setOpenInfo(true)
                                                setSensorDatas(sensorData[keys])
                                            }}>
                                                <ListItemAvatar>
                                                    <img alt={''} src={icons[keys]} style={{ width: 50, height: 50 }} />
                                                </ListItemAvatar>
                                                <ListItemText primary={keys} secondary={'Jumlah Sensor: ' + sensorData[keys].length} />
                                                {/* <Typography>A</Typography> */}
                                            </ListItem>
                                        </Paper>
                                    </Grid>
                                </React.Fragment>
                            ))
                        }
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
}
