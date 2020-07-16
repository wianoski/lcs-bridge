import React from 'react';
import TextField from '@material-ui/core/TextField';
import Chip from './Chip'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { db } from '../../../../index'
import { Grid, Button, Typography } from '@material-ui/core';

export default function BasicTextFields(props) {
    const [max, setMax] = React.useState(0)
    const [min, setMin] = React.useState(0)
    const [maxActual, setMaxActual] = React.useState(0)
    const [minActual, setMinActual] = React.useState(0)
    React.useEffect(() => {
        var concentrator;
        if (props.concentrator === 'concentratorOne') {
            concentrator = 'concentrator_1'
            db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section).once('value').then(function (snapshot) {
                setMin(parseFloat(snapshot.val().min))
                setMinActual(parseFloat(snapshot.val().min));
                setMax(parseFloat(snapshot.val().max));
                setMaxActual(parseFloat(snapshot.val().max));
                console.log(snapshot.val());

            })
        } else {
            concentrator = 'concentrator_2'
            db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section + '/' + props.sensor).once('value').then(function (snapshot) {
                setMin(snapshot.val().min)
                setMinActual(snapshot.val().min);
                setMax(snapshot.val().max)
                setMaxActual(snapshot.val().max);
            })
        }
    }, [props.concentrator, props.id, props.section, props.sensor])

    const handleChangeMax = (event) => {
        setMaxActual(event.target.value.replace(/-?\d+[^0-9]+/g, ''));
    };
    const handleChangeMin = (event) => {
        setMinActual(event.target.value.replace(/-?\d+[^0-9]+/g, ''));
    };
    const handleChanges = (event) => {
        setMax(maxActual)
        setMin(minActual)
        var concentrator;
        if (props.concentrator === 'concentratorOne') {
            concentrator = 'concentrator_1'
            db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section).set({
                max: maxActual,
                min: minActual
            })
        } else {
            concentrator = 'concentrator_2'
            db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section + '/' + props.sensor).set({
                max: maxActual,
                min: minActual
            })
        }
    };
    return (
        <>
            <Grid
                container
                spacing={3}
                alignItems="center"
                justify="center"
            >
                <Grid item xs={12} md={12}>
                    <Typography variant={'h5'} align={'center'}>Threshold</Typography>
                </Grid>
                <Grid item xs={6} md={6}>
                    <Chip value={max} icon={<ArrowUpwardIcon />} />
                </Grid>
                <Grid item xs={6} md={6}>
                    <Chip value={min} icon={<ArrowDownwardIcon />} />
                </Grid>
                {props.privilege > 2 ? '' : (
                    <>
                        <Grid item xs={12} md={12}>
                            <TextField fullWidth label="Max Threshold" variant="outlined" value={maxActual} onChange={handleChangeMax} />
                        </Grid>
                        <Grid item xs={12} md={12}>
                            <TextField fullWidth label="Min Threshold" variant="outlined" value={minActual} onChange={handleChangeMin} />
                        </Grid>
                        <Grid item xs={12} md={12}>
                            <Button onClick={handleChanges} variant={'contained'} color='primary' fullWidth>Apply</Button>
                        </Grid>
                    </>
                )}
            </Grid>
        </>
    );
}