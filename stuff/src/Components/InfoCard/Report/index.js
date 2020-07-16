import React from 'react'
import { db } from '../../../index'
import { Paper, Grid, Card, CardHeader, CardContent, Typography, CircularProgress } from '@material-ui/core';
import { Line } from 'react-chartjs-2';
import { green } from '@material-ui/core/colors';
import Skeleton from '@material-ui/lab/Skeleton';
import moment from 'moment-timezone'
export default function MyChart(props) {
    const [finalData, setFinalData] = React.useState()
    const [downloaded, setDownloaded] = React.useState(false)
    React.useEffect(() => {
        var data = {}
        var concentrator = 'concentrator_1'
        db.ref('MQTT/' + props.id + '/' + concentrator + '/').orderByKey().startAt(props.startDate.toString()).endAt(props.endDate.toString()).once('value', (snapshot) => {
            var newData = snapshot.val()
            setDownloaded(true)
            if (newData) {
                Object.keys(newData).forEach(timestamp => {
                    props.data.forEach(element => {
                        var temp = undefined
                        if (typeof newData[timestamp][element.sensor] === 'object') {
                            temp = parseFloat(Math.max(...newData[timestamp][element.sensor]))
                        } else {
                            temp = parseFloat(newData[timestamp][element.sensor])
                        }
                        if (typeof data[element.sensor] === 'undefined') {
                            data[element.sensor] = {
                                t: [moment.utc(parseInt(timestamp)).tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss').toString()],
                                y: [temp]
                            }
                        } else {
                            data[element.sensor].t.push(moment.utc(parseInt(timestamp)).tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss').toString())
                            data[element.sensor].y.push(temp)
                        }
                    });
                });
                setFinalData(data)
            } else {
                setFinalData(false)
            }


        })
    }, [props.endDate, props.id, props.startDate])
    return (
        <>
            <Grid container spacing={2}>
                {Object.keys(props.data).map((value, i) => (
                    <React.Fragment key={i}>
                        <Grid item xs={12} md={12}>
                            <Card>
                                <CardHeader title={props.data[value].alias} />
                                <CardContent>
                                    {downloaded ? (
                                        <>
                                            {console.log('downloaded')}
                                            {typeof finalData !== 'undefined' ? (
                                                <>
                                                    {console.log('defined')}
                                                    {finalData ? (
                                                        <Line
                                                            height={400}
                                                            key={value}
                                                            data={{
                                                                labels: finalData[props.data[value].sensor].t,
                                                                datasets: [
                                                                    {
                                                                        label: 'Nilai sensor',
                                                                        backgroundColor: green[900],
                                                                        borderColor: green[500],
                                                                        fill: false,
                                                                        data: finalData[props.data[value].sensor].y
                                                                    }
                                                                ]
                                                            }}
                                                            options={{
                                                                maintainAspectRatio: false,
                                                                animation: {
                                                                    duration: 0 // general animation time
                                                                },
                                                                hover: {
                                                                    animationDuration: 0 // duration of animations when hovering an item
                                                                },
                                                                responsiveAnimationDuration: 0, // animation duration after a resize
                                                                elements: {
                                                                    line: {
                                                                        tension: 0 // disables bezier curves
                                                                    },
                                                                    point: {
                                                                        radius: 0
                                                                    }
                                                                },
                                                                title: {
                                                                    display: false
                                                                },
                                                                scales: {
                                                                    yAxes: [{
                                                                        type: 'linear',
                                                                        display: true,
                                                                        scaleLabel: {
                                                                            display: true,
                                                                            labelString: 'Satuan (' + props.data[value].unit + ')'
                                                                        },
                                                                        ticks: {
                                                                            stepSize: 0.5,
                                                                            maxTicksLimit: 10
                                                                        }
                                                                    }],
                                                                },
                                                                tooltips: {
                                                                    enabled: false,
                                                                },
                                                                // hover: {
                                                                //     mode: 'nearest',
                                                                //     intersect: false
                                                                // }
                                                            }}
                                                        />
                                                    ) : (
                                                            <Skeleton variant={'rect'} height={400} animation={false} style={{ display: 'flex' }}>
                                                                <Grid
                                                                    container
                                                                    spacing={0}
                                                                    align="center"
                                                                    justify="center"
                                                                    direction="column"
                                                                >
                                                                    <Grid item>
                                                                        <Typography variant={'h5'} color={'textSecondary'}>Data tidak tersedia.</Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Skeleton>
                                                        )}

                                                </>

                                            ) : (
                                                    <>
                                                        <Skeleton variant={'rect'} height={400} style={{ display: 'flex' }}>
                                                            <Grid
                                                                container
                                                                spacing={0}
                                                                align="center"
                                                                justify="center"
                                                                direction="column"
                                                            >
                                                                <Grid item>
                                                                    <Typography variant={'h5'} color={'textSecondary'}>Processing data...</Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </Skeleton>
                                                    </>
                                                )}

                                        </>

                                    ) : (
                                            <Skeleton variant={'rect'} height={400} style={{ display: 'flex' }}>
                                                <Grid
                                                    container
                                                    spacing={0}
                                                    align="center"
                                                    justify="center"
                                                    direction="column"
                                                >
                                                    <Grid item>
                                                        <Typography variant={'h5'} color={'textSecondary'}>Downloading data...</Typography>
                                                    </Grid>
                                                </Grid>
                                            </Skeleton>
                                        )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </React.Fragment>
                ))}
            </Grid>
        </>
    )
}