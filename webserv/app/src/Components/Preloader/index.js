import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        '& > * + *': {
            marginLeft: theme.spacing(2),
        },
    },
}));

export default function Preloader() {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Grid
                container
                spacing={0}
                alignItems="center"
                justify="center"
                style={{ minHeight: "100vh" }}
            >
                <Grid item>
                    <CircularProgress size={100} color="primary" />
                </Grid>
            </Grid>
        </div>
    );
}
