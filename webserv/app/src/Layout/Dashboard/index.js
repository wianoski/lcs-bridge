import React from 'react';
import Maps from '../../Components/Maps'
import { Grid, Paper } from '@material-ui/core'

export default function Dashboard(props) {
    return (
        <Grid container style={{ margin: 0 }} >
            <Grid item xs={12} md={12}>
                <Paper elevation={5} style={{ height: '100vh' }}>
                    <Maps privilege={props.privilege} user={props.user} />
                </Paper>
            </Grid>
        </Grid>
    )
}