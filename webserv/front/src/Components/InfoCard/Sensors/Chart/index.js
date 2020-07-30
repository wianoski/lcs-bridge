import React from 'react'
import { db } from '../../../../index'
import { Line } from 'react-chartjs-2'
import 'chartjs-plugin-streaming';
import 'chartjs-plugin-annotation';
import { green, red } from '@material-ui/core/colors';
import Skeleton from '@material-ui/lab/Skeleton';
import mqtt from 'mqtt';

function getData(props, chart) {
    const client = mqtt.connect('ws://103.146.202.75:8083')
    console.log(props.rtu);

    client.on('connect', () => {
        client.subscribe('RTU/' + props.rtu, (err) => err ? console.log(err) : '')
    })

    client.on('message', (topic, message) => {
        console.log(props.open);
        console.log(message.toString());
        if (!props.open) {
            client.end()
        } else {
            var temp = message.toString().split(',').map(function (item) {
                return parseFloat(item)
            });
            var timestamp = temp.splice(0, 1)[0]
            console.log(timestamp);
            console.log(temp);
            if (props.section === 'TEMP') {
                temp = [temp[0]]
            } else if (props.section === 'DISPLACE') {
                temp = [temp[1]]
            } else if (props.section === 'HUMIDITY') {
                temp = [temp[2]]
            } else if (props.section === 'GYRO_1') {
                temp = [Math.max(...temp)]
            }
            temp.forEach((value, index) => {
                if (temp.length >= 100) {
                    if (index % 2 === 1) {
                        chart.config.data.datasets[0].data.push({
                            x: new Date(timestamp - 20 + ((1000 / temp.length) * index)).toISOString(),
                            y: value
                        })
                    } else {
                        chart.config.data.datasets[1].data.push({
                            x: new Date(timestamp - 20 + ((1000 / temp.length) * index)).toISOString(),
                            y: value
                        })
                    }
                } else {
                    chart.config.data.datasets.forEach(function (dataset) {
                        dataset.data.push({
                            x: new Date(timestamp - 1000 + ((1000 / temp.length) * index)).toISOString(),
                            y: value
                        });
                    });
                }
            })
        }
    })
    // db.ref('MQTT/' + props.id).off()
    // var concentrator;
    // if (props.concentrator === 'concentratorOne') {
    //     concentrator = 'concentrator_1'
    // } else {
    //     concentrator = 'concentrator_2'
    // }
    // db.ref('MQTT/' + props.id + '/' + concentrator + '/')
    //     .orderByKey()
    //     .limitToLast(1)
    //     .on('value', (snapshot) => {
    //         var newData = snapshot.val()
    //         Object.keys(newData).forEach(element => {
    //             // console.log(element)
    //             var timestamp = parseInt(element)
    //             console.log(timestamp)
    //             if (typeof newData[element][props.section] === 'object') {
    //                 var temp = newData[element][props.section].map(function (item) {
    //                     return parseFloat(item)
    //                 });
    //                 // var timestamp = Date.now()
    //                 temp.forEach((value, index) => {
    //                     if (temp.length >= 100) {
    //                         if (index % 2 === 1) {
    //                             chart.config.data.datasets[0].data.push({
    //                                 x: new Date(timestamp + ((1000 / temp.length) * index)).toISOString(),
    //                                 y: value
    //                             })
    //                         } else {
    //                             chart.config.data.datasets[1].data.push({
    //                                 x: new Date(timestamp + ((1000 / temp.length) * index)).toISOString(),
    //                                 y: value
    //                             })
    //                         }
    //                     } else {
    //                         chart.config.data.datasets.forEach(function (dataset) {
    //                             dataset.data.push({
    //                                 x: new Date(timestamp + ((1000 / temp.length) * index)).toISOString(),
    //                                 y: value
    //                             });
    //                         });
    //                     }
    //                 })
    //             } else {
    //                 chart.config.data.datasets.forEach(function (dataset) {
    //                     dataset.data.push({
    //                         x: new Date(timestamp).toISOString(),
    //                         y: newData[element][props.section]
    //                     });
    //                 });
    //             }
    //         });
    //     })
}
function MyChart(props) {
    db.ref('MQTT/' + props.id + '/').off()
    var i = 0
    const [threshold, setThreshold] = React.useState({
        max: undefined,
        min: undefined,
        low_max: undefined,
        low_min: undefined
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
                max: parseFloat(snapshot.val().max),
                min: parseFloat(snapshot.val().min),
                low_max: parseFloat(snapshot.val().low_max),
                low_min: parseFloat(snapshot.val().low_min),
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
                    data={props.section === 'ACC_1' ? {
                        datasets: [
                            {
                                label: 'Nilai X',
                                backgroundColor: green[900],
                                borderColor: green[500],
                                fill: false,
                                cubicInterpolationMode: 'monotone',
                                data: []
                            },
                            {
                                label: 'Nilai Y',
                                backgroundColor: red[900],
                                borderColor: red[500],
                                fill: false,
                                cubicInterpolationMode: 'monotone',
                                data: []
                            }
                        ]
                    } : {
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
                                    ttl: 15000,
                                    delay: 3000,
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
                                    suggestedMin: threshold.min - 2,
                                    suggestedMax: threshold.max + 2,
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
                                        content: 'Danger: ' + threshold.max + ' ' + props.unit,
                                        enabled: true
                                    },
                                },
                                {
                                    drawTime: 'afterDatasetsDraw',
                                    id: 'low_min',
                                    type: 'line',
                                    mode: 'horizontal',
                                    scaleID: 'y-axis-0',
                                    value: threshold.low_min,
                                    borderColor: 'yellow',
                                    borderWidth: 5,
                                    label: {
                                        backgroundColor: 'yellow',
                                        content: 'Warning: ' + threshold.low_min + ' ' + props.unit,
                                        enabled: true,
                                        fontColor: 'black'
                                    }
                                },
                                {
                                    drawTime: 'afterDatasetsDraw',
                                    id: 'low_max',
                                    type: 'line',
                                    mode: 'horizontal',
                                    scaleID: 'y-axis-0',
                                    value: threshold.low_max,
                                    borderColor: 'yellow',
                                    borderWidth: 5,
                                    label: {
                                        backgroundColor: 'yellow',
                                        content: 'Warning: ' + threshold.low_max + ' ' + props.unit,
                                        enabled: true,
                                        fontColor: 'black'
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
                                        content: 'Danger: ' + threshold.min + ' ' + props.unit,
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