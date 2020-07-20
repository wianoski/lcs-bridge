import React from 'react'
import { db } from '../../../../index'
import { Line } from 'react-chartjs-2'
import 'chartjs-plugin-streaming';
import moment from 'moment-timezone'
import 'chartjs-plugin-annotation';
import { green } from '@material-ui/core/colors';
import Skeleton from '@material-ui/lab/Skeleton';

function getData(props, chart) {
    var concentrator;
    if (props.concentrator === 'concentratorOne') {
        concentrator = 'concentrator_1'
    } else {
        concentrator = 'concentrator_2'
    }
    db.ref('MQTT/' + props.id + '/' + concentrator + '/').orderByKey().limitToLast(1).on('value', (snapshot) => {
        var newData = snapshot.val()
        Object.keys(newData).forEach(element => {
            console.log(element)
            var timestamp = parseInt(element)
            console.log(timestamp)
            if (typeof newData[element][props.section] === 'object') {
                var temp = newData[element][props.section].map(function (item) {
                    return parseFloat(item)
                });
                temp.forEach((value, index) => {
                    chart.config.data.datasets.forEach((dataset, i) => {
                        dataset.data.push({
                            x: new Date(timestamp + ((2000 / temp.length) * index)).toISOString(),
                            y: value
                        });
                    })
                })
            } else {
                chart.config.data.datasets.forEach(function (dataset) {
                    dataset.data.push({
                        x: new Date(timestamp).toISOString(),
                        y: newData[element][props.section]
                    });
                });
            }
        });
    })
}
function MyChart(props) {
    db.ref('MQTT/' + props.id + '/').off()
    var i = 0
    const [threshold, setThreshold] = React.useState({
        max: undefined,
        min: undefined
    })
    React.useEffect(() => {
        var concentrator;
        if (props.concentrator === 'concentratorOne') {
            concentrator = 'concentrator_1'
        } else {
            concentrator = 'concentrator_2'
        }
        db.ref('MQTT/' + props.id + '/thresholds/' + concentrator + '/' + props.section).on('value', (snapshot) => {
            setThreshold({
                max: parseInt(snapshot.val().max),
                min: parseInt(snapshot.val().min)
            })
        })

    }, [])
    return (
        <>
            {typeof threshold.max !== 'undefined' && threshold.min !== 'undefined' ? (
                <Line
                    height={380}
                    key={props.section}
                    redraw={true}
                    data={{
                        datasets: [
                            {
                                label: 'Nilai sensor',
                                backgroundColor: green[900],
                                borderColor: green[500],
                                fill: false,
                                cubicInterpolationMode: 'monotone',
                                data: []
                            }
                        ]
                    }}
                    options={{
                        maintainAspectRatio: false,
                        events: ['click'],
                        title: {
                            display: false,
                        },
                        tooltips: {
                            enabled: false
                        },
                        scales: {
                            xAxes: [{
                                type: 'realtime',
                                realtime: {
                                    duration: 10000,
                                    refresh: 1000,
                                    ttl: 13000,
                                    delay: 700,
                                    frameRate: 60,
                                    onRefresh: (chart) => {
                                        i += 1
                                        if (i === 1) {
                                            getData(props, chart)
                                        }
                                    }
                                }
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Satuan (' + props.unit + ')'
                                },
                                ticks: {
                                    suggestedMin: threshold.min - 10,
                                    suggestedMax: threshold.max + 10,
                                }
                            }]
                        },
                        annotation: {
                            annotations: [
                                {
                                    drawTime: 'afterDatasetsDraw',
                                    id: 'max',
                                    type: 'line',
                                    mode: 'horizontal',
                                    scaleID: 'y-axis-0',
                                    value: threshold.max,
                                    borderColor: 'red',
                                    borderWidth: 5,
                                    label: {
                                        backgroundColor: 'red',
                                        content: 'Max Threshold: ' + threshold.max + ' ' + props.unit,
                                        enabled: true
                                    }
                                },
                                {
                                    drawTime: 'afterDatasetsDraw',
                                    id: 'min',
                                    type: 'line',
                                    mode: 'horizontal',
                                    scaleID: 'y-axis-0',
                                    value: threshold.min,
                                    borderColor: 'red',
                                    borderWidth: 5,
                                    label: {
                                        backgroundColor: 'red',
                                        content: 'Min Threshold: ' + threshold.min + ' ' + props.unit,
                                        enabled: true
                                    }
                                }
                            ]
                        }
                    }}
                />
            ) : (
                    <Skeleton height={390} />
                )}
        </>
    )
}

export default React.memo(MyChart)