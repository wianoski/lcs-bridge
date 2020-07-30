import React from 'react';
import TextField from '@material-ui/core/TextField';
import { db } from '../../../../index'
import { Grid, Button, Typography } from '@material-ui/core';

export default function BasicTextFields(props) {
    const [max_low, setMaxLow] = React.useState(0)
    const [min_low, setMinLow] = React.useState(0)
    const [maxActual, setMaxActual] = React.useState(0)
    const [minActual, setMinActual] = React.useState(0)
    React.useEffect(() => {
        var concentrator;
        if (props.concentrator === 'concentratorOne') {
            concentrator = 'concentrator_1'
            db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section).once('value').then(function (snapshot) {
                setMinLow(parseFloat(snapshot.val().low_min))
                setMinActual(parseFloat(snapshot.val().min));
                setMaxLow(parseFloat(snapshot.val().low_max));
                setMaxActual(parseFloat(snapshot.val().max));
            })
        }
    }, [props.concentrator, props.id, props.section, props.sensor])

    const handleChangeMax = (event) => {
        setMaxActual(event.target.value);
    };
    const handleChangeMin = (event) => {
        setMinActual(event.target.value);
    };
    const handleChangeMaxLow = (event) => {
        setMaxLow(event.target.value);
    };
    const handleChangeMinLow = (event) => {
        setMinLow(event.target.value);
    };
    const handleChanges = (event) => {
        if (parseFloat(max_low) !== 'NaN' && parseFloat(min_low) !== 'NaN' && parseFloat(maxActual) !== 'NaN' && parseFloat(minActual) !== 'NaN') {
            setMaxLow(max_low)
            setMinLow(min_low)
            setMaxActual(maxActual)
            setMinActual(minActual)
            var concentrator;
            if (props.concentrator === 'concentratorOne') {
                concentrator = 'concentrator_1'
                db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section).set({
                    max: maxActual,
                    min: minActual,
                    low_max: max_low,
                    low_min: min_low
                })
            } else {
                concentrator = 'concentrator_2'
                db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section + '/' + props.sensor).set({
                    max: maxActual,
                    min: minActual,
                    low_max: max_low,
                    low_min: min_low
                })
            }
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
                    <Typography variant={'h5'} align={'center'}>Threshold Control</Typography>
                </Grid>
                {/* <Grid item xs={6} md={6}>
                    <Chip value={max} icon={<ArrowUpwardIcon />} />
                </Grid>
                <Grid item xs={6} md={6}>
                    <Chip value={min} icon={<ArrowDownwardIcon />} />
                </Grid> */}
                {props.privilege > 2 ? '' : (
                    <>
                        <Grid
                            container
                            spacing={3}
                            alignItems="center"
                            justify="center"
                        >
                            <Grid item>
                                <TextField label="Danger (high) Threshold" variant="standard" value={maxActual} onChange={handleChangeMax} />
                            </Grid>
                            <Grid item>
                                <TextField label="Warning (high) Threshold" variant="standard" value={max_low} onChange={handleChangeMaxLow} />
                            </Grid>
                            <Grid item>
                                <TextField label="Warning (low) Threshold" variant="standard" value={min_low} onChange={handleChangeMinLow} />
                            </Grid>
                            <Grid item>
                                <TextField label="Danger (low) Threshold" variant="standard" value={minActual} onChange={handleChangeMin} />
                            </Grid>
                            <Grid item xs={12} md={12}>
                                <Button onClick={handleChanges} variant={'contained'} color='primary' fullWidth>Apply</Button>
                            </Grid>
                        </Grid>
                    </>
                )}
            </Grid>
        </>
    );
}