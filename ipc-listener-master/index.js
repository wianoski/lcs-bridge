const mqtt = require('mqtt')
const env = require('./env.json')
const EventEmitter = require('events');
const event = new EventEmitter();
const _ = require('lodash');
const { spawn } = require('child_process')
const admin = require('firebase-admin');
const SerialPort = require('serialport');
const { StringStream } = require('scramjet');
const fs = require('fs');

admin.initializeApp({
    credential: admin.credential.cert(env.adminService),
    databaseURL: env.databaseURL,
});

var metaData = {}
var sensor = []

event.on('payload', (collection, value) => {
    if (collection === 'bridge') {
        sensor = sensorDataProcessor(value.sensor)
        delete value["sensor"]
    }
    metaData[collection] = { ...value }
});

const sensorDataProcessor = (newData) => {
    return Object.keys(newData).map((key) => {
        newData[key]['refId'] = key
        return newData[key]
    })
}

const documentGetter = async (collection, documentId) => new Promise((resolve, reject) => {
    const client = mqtt.connect(env.broker, { username: process.argv[2], password: process.argv[3] })
    client.once('connect', () => {
        const timestamp = Date.now()
        client.once('message', (topic, message) => {
            event.emit('payload', collection, { ...JSON.parse(message.toString()).payload })
            resolve(true)
            client.end()
        });
        client.subscribe('payload/' + timestamp, (error) => {
            if (!error) {
                client.publish('request/get/' + timestamp, collection + '|#|' + documentId)
            } else {
                console.error(error.message)
                reject(undefined)
                client.end()
            }
        });
    });
    client.once('error', (error) => {
        console.error(error.message)
        reject(undefined)
        client.end()
    });
});

const update = async (collection, documentId, value) => new Promise((resolve, reject) => {
    const client = mqtt.connect(env.broker, { username: process.argv[2], password: process.argv[3] })
    const updateValue = collection + '|#|' + documentId + '|#|' + JSON.stringify(value).toString()
    const timestamp = Date.now()
    client.once('connect', () => {
        client.once('message', (topic, message) => {
            resolve(JSON.parse(message.toString()))
            client.end()
        });
        client.subscribe('payload/' + timestamp, (error) => {
            if (error) {
                console.error(error.message)
                reject(undefined)
                client.end()
            } else {
                client.publish('request/update/' + timestamp, updateValue)
            }
        });
    });
    client.once('error', (error) => {
        console.error(error.message)
        reject(undefined)
        client.end()
    });
});

const createDocument = async (collection, value) => new Promise((resolve, reject) => {
    const client = mqtt.connect(env.broker, { username: process.argv[2], password: process.argv[3] })
    const newValue = collection + '|#|' + JSON.stringify(value).toString()
    const timestamp = Date.now()
    client.once('connect', () => {
        client.once('message', (topic, message) => {
            resolve(JSON.parse(message.toString()))
            client.end()
        });
        client.subscribe('payload/' + timestamp, (error) => {
            if (error) {
                console.error(error.message)
                reject(undefined)
                client.end()
            } else {
                client.publish('request/create/' + timestamp, newValue)
            }
        });
    });
    client.once('error', (error) => {
        console.error(error.message)
        reject(undefined)
        client.end()
    });
});

const documentListener = async (collection, documentId) => {
    const client = mqtt.connect(env.broker, { username: process.argv[2], password: process.argv[3] })
    client.once('connect', () => {
        client.on('message', (topic, message) => {
            event.emit('payload', collection, { ...JSON.parse(message.toString()).payload })
        })
        client.subscribe('changestream/' + collection + '/' + documentId, (error) => {
            if (error) {
                console.error(error.message)
            }
        })
    });
    client.on('error', (error) => {
        console.error(collection, 'listener error.', error.message)
    })
}

const sensorInfoGetter = (concentratorId, gatewayId, rtuId) => {
    const result = _.find(sensor, { concentrator: 02, gateway: 06, rtu: 04 })
    return {
        unit: result && result.unit ? result.unit : 'Unit',
        alias: result && result.alias ? result.alias : '',
        type: result && result.type ? result.type : 0,
        concentrator: result && result.concentrator ? result.concentrator : 02,
        id: result && result.id ? result.id : 0,
        group: result && result.group ? result.group : '',
        gateway: result && result.gateway ? result.gateway : 06,
        available: result && result.available ? result.available : false,
        rtu: result && result.rtu ? result.rtu : 04,
        battery: result && result.battery ? result.battery : 4.08,
        refId: result && result.refId ? result.refId : '',
    }
}

const thresholdFormatter = (thresholdData) => {
    return {
        offset: {
            first: thresholdData && thresholdData.offset && thresholdData.offset.first ? parseFloat(thresholdData.offset.first) : 0,
            second: thresholdData && thresholdData.offset && thresholdData.offset.second ? parseFloat(thresholdData.offset.second) : 0
        },
        gain: {
            first: thresholdData && thresholdData.gain && thresholdData.gain.first ? parseFloat(thresholdData.gain.first) : 1,
            second: thresholdData && thresholdData.gain && thresholdData.gain.second ? parseFloat(thresholdData.gain.second) : 1
        },
        alert: {
            warning: {
                max: thresholdData && thresholdData.alert && thresholdData.alert.warning && thresholdData.alert.warning.max ? parseFloat(thresholdData.alert.warning.max) : 0,
                min: thresholdData && thresholdData.alert && thresholdData.alert.warning && thresholdData.alert.warning.min ? parseFloat(thresholdData.alert.warning.min) : 0,
            },
            danger: {
                max: thresholdData && thresholdData.alert && thresholdData.alert.danger && thresholdData.alert.danger.max ? parseFloat(thresholdData.alert.danger.max) : 0,
                min: thresholdData && thresholdData.alert && thresholdData.alert.danger && thresholdData.alert.danger.min ? parseFloat(thresholdData.alert.danger.min) : 0,
            },
        },
        activation: {
            duration: thresholdData && thresholdData.activation && thresholdData.activation.duration ? parseFloat(thresholdData.activation.duration) : 0,
            max: thresholdData && thresholdData.activation && thresholdData.activation.max ? parseFloat(thresholdData.activation.max) : 0,
            min: thresholdData && thresholdData.activation && thresholdData.activation.min ? parseFloat(thresholdData.activation.min) : 0,
        }
    }
}

const capture = async (timestamp) => new Promise((resolve, reject) => {
    const capture = spawn(process.platform === 'win32' ? 'python' : 'python3', ['capture.py', 'http://processing.jembatanku.com:8000/upload/', timestamp, process.argv[4]])
    capture.stderr.setEncoding('utf8');
    capture.stderr.once('data', (data) => {
        console.error('Snapshot upload error', data)
        if (!capture.killed) {
            capture.kill('SIGINT')
        }
        reject(undefined)

    })
    capture.stdout.once('data', (data) => {
        const processMessage = String.fromCharCode.apply(null, data).split('\r\n')[0].replace('\n', '')
        if (processMessage !== 'error') {
            resolve(JSON.parse(processMessage.replace(/'/g, '"')))
        } else {
            console.error('Snapshot upload error')
            reject(undefined)
        }
        if (!capture.killed) {
            capture.kill('SIGINT')
        }
    })
})

const sendNotification = async (topic, data) => new Promise((resolve, reject) => {
    admin.messaging().send({
        data: data,
        topic: topic
    }).then(() => {
        console.log('An alert has been sent')
        resolve(true)
    }).catch((error) => {
        console.error('An alert has failed to be sent', error)
        reject(undefined)
    });
})

const thresholdTrigger = async (max, min, sensorInfo) => {

    const thresholds = thresholdFormatter(metaData.threshold[sensorInfo.refId])
    var thresholdLevel = undefined
    if (max > thresholds.alert.warning.max) {
        thresholdLevel = 2
        if (max > thresholds.alert.danger.max) {
            thresholdLevel = 1
        }
    } else if (min < thresholds.alert.warning.min) {
        thresholdLevel = 2
        if (min < thresholds.alert.danger.min) {
            thresholdLevel = 1
        }
    }
    if (thresholdLevel) {
        update('bridge', env._id, { status: thresholdLevel }).catch((reason) => reason)
        const timestamp = Date.now()
        const captureResult = await capture(timestamp).catch((reason) => reason)
        if (captureResult) {
            const message = thresholdLevel === 1 ? 'Memasuki batas bahaya' : 'Memasuki batas waspada'
            console.log(message, captureResult)
            update('bridge', env._id, { snapshot: captureResult.name }).catch((reason) => reason)
            createDocument('notification', {
                bridge_id: env._id,
                detail: message,
                sensor_id: sensorInfo.alias,
                status: 0,
                timestamp: timestamp,
                time: new Date(timestamp).toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
            }).catch((reason) => reason)
            sendNotification('global', {
                '"image"': '"' + metaData.bridge.image + '"',
                '"is_background"': '"false"',
                '"title"': '"' + metaData.bridge.name.toString() + '"',
                '"message"': '"Nilai ' + sensorInfo.alias + ' ' + message + '"',
                '"timestamp"': '"' + timestamp.toString() + '"',
                '"article_data"': '"' + env._id.toString() + '"'
            }).catch((reason) => console.error(reason))
        }
    }
}

const sendPayload = (client, bridgeId, concentratorId, rtuId, typeId, timestamp, activation_max, activation_min, realData) => {
    const path = parseInt(concentratorId) + '/' + parseInt(rtuId) + '/' + parseInt(typeId)
    const dir = 'sensorData/' + path
    // client.publish('sensor/' + bridgeId + '/' + path, timestamp + ',' + activation_max + ',' + activation_min + ',' + realData)
    if (!fs.existsSync(dir)) {
        fs.mkdir(dir, { recursive: true }, (error) => console.error(error));
    } else {
        fs.appendFile(dir + '/' + new Date().getDate().toString().padStart(2, '0') + (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getFullYear().toString() + '.csv', new Date().toISOString() + ',' + realData + '\n', (error) => error ? console.error(error) : null)
    }
}

const rtuHandler = async (path, MQTTClientInstance) => {
    const precision = 100
    var sensorRef = undefined
    var gatewayId = 06
    var parser = new StringStream()
    var buffer = new DataView(new ArrayBuffer(4))
    var handler = new SerialPort(path, {
        baudRate: 57600
    }, error => error ? console.error(path, error.message) : console.log(path, 'Connection Successful!'))
    var failedCOunt = 0
    var norepCount = 0
    var errorCounter = 0

    handler.pipe(parser).lines().catch((reason) => console.error(path, reason.code, 'Skipping current data')).each(data => {
        if (data.includes('ready')) {
            data = data.split(',')
            data.pop()
            const RTUMetaData = data.splice(0, 5)
            frequency = 4110
            // gatewayId = parseInt(RTUMetaData[2].split('gw')[1])
            const reqId = 04
            const interval = 1000
            setInterval(() => {
                handler.write('REQ_RTU' + reqId.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) + ',1\r\n')
            }, interval)
            // TODO
            // setInterval(() => {
            //     handler.write('REQ_RTU_HEALTH' + reqId.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) + ',1\r\n')
            // }, 1000)
        } else if (data.includes('sendtoWait failed')) {
            failedCOunt += 1
            errorCounter += 1
            console.error(path, 'Gateway:', gatewayId, new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }), 'sendtoWait failed -', failedCOunt)
            if (errorCounter === 5) {
                if (typeof sensorRef !== 'undefined') {
                    update('bridge', env._id, { ['sensor.' + sensorRef + '.available']: false }).catch((reason) => console.error(reason))
                }
                errorCounter = 0
            }
        } else if (data.includes('no reply')) {
            norepCount += 1
            errorCounter += 1
            const rtuNumber = parseInt(data.split(' ')[0].split('RTU')[1])
            if (!isNaN(rtuNumber)) {
                console.error(path, 'Gateway:', gatewayId, 'RTU:', rtuNumber, new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }), 'no reply -', norepCount)
                if (errorCounter === 5) {
                    if (typeof sensorRef !== 'undefined') {
                        update('bridge', env._id, { ['sensor.' + sensorRef + '.available']: false }).catch((reason) => console.error(reason))
                    }
                    errorCounter = 0
                }
            } else {
                console.error(path, 'Gateway:', gatewayId, new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }), 'no reply -', norepCount)
            }
        } else {
            data = data.split(' ').filter(item => item)
            // console.log('tat');
            // console.log(data);
            const newMetaData = data.splice(0, 3)
            const validation = newMetaData.map((val) => parseInt(val))
            if (newMetaData[0] < 10 && !validation.includes(NaN) && newMetaData.length === 3) {
                const sensorInfo = sensorInfoGetter(parseInt(newMetaData[0]), gatewayId, parseInt(newMetaData[1]))
                console.log(sensorInfo);
                sensorRef = sensorInfo.refId
                if (!sensorInfo.available) {
                    update('bridge', env._id, { ['sensor.' + sensorInfo.refId + '.available']: true }).catch((reason) => console.error(reason))
                }
                const thresholds = thresholdFormatter(metaData.threshold[sensorRef])
                switch (sensorInfo.type) {
                    case 6:
                        console.log(data);
                        data = data.join('').match(/.{1,8}/g)
                        console.log(data);
                        console.log(data);
                        if (data) {
                            var realData = []
                            data.map((hex) => {
                                if (hex.length === 8) {
                                    buffer.setUint32(0, '0x' + hex)
                                    const result = Math.round((buffer.getFloat32(0) + Number.EPSILON) * precision) / precision
                                    if (result > 0 || result < 0) {
                                        realData.push((result * thresholds.gain.first) + thresholds.offset.first)
                                    }
                                }
                            })
                            realData = realData.splice(0, 100)
                            // thresholdTrigger(Math.max(...realData), Math.min(...realData), sensorInfo)
                            sendPayload(MQTTClientInstance, env._id, sensorInfo.concentrator, sensorInfo.rtu, sensorInfo.type, Date.now(), thresholds.activation.max, thresholds.activation.min, realData.join(','))
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }).catch((reason) => console.error(path, reason.code, 'Skipping current data'))
}

const client = mqtt.connect(env.broker, { username: process.argv[2], password: process.argv[3] })
        client.once('connect', () => {
            (async () => {
                var processHolder = []
                console.log('Fetching bridge data...');
                SerialPort.list().then(ports => {
                    if (ports.length > 0) {
                        ports.forEach((port) => {
                            if ((port.path.includes('USB') || port.path.includes('COM')) && port.path) {
                                processHolder.push(rtuHandler(port.path, client))
                            }
                        })
                    } else {
                        console.error('No active ports found. Terminating in 3 seconds...')
                        setTimeout(() => {
                            process.exit(1)
                        }, 3000);
                    }
                })
                // const bridgeData = await documentGetter("bridge", env._id).catch((reason) => reason)
                // if (bridgeData) {
                //     console.log('Bridge data fetched.')
                //     documentListener("bridge", env._id)
                //     console.log('Fetching threshold data...')
                //     const thresholdData = await documentGetter("threshold", metaData.bridge.thresholdRef).catch((reason) => reason)
                //     if (thresholdData && thresholdData !== null) {
                //         console.log('Threshold data fetched.')
                //         documentListener("threshold", metaData.bridge.thresholdRef)
                //         var processHolder = []
                //         SerialPort.list().then(ports => {
                //             if (ports.length > 0) {
                //                 ports.forEach((port) => {
                //                     if ((port.path.includes('USB') || port.path.includes('COM')) && port.path) {
                //                         processHolder.push(rtuHandler(port.path, client))
                //                     }
                //                 })
                //             } else {
                //                 console.error('No active ports found. Terminating in 3 seconds...')
                //                 setTimeout(() => {
                //                     process.exit(1)
                //                 }, 3000);
                //             }
                //         })
                //     } else {
                //         console.error('Data fetch error. Terminating in 3 seconds...')
                //         setTimeout(() => {
                //             process.exit(1)
                //         }, 3000);
                //     }
                // } else {
                //     console.error('Data fetch error. Terminating in 3 seconds...')
                //     setTimeout(() => {
                //         process.exit(1)
                //     }, 3000);
                // }
            })();
        });

// require('dns').resolve('example.com', (error) => {
//     if (error) {
//         console.error('No internet connection. Terminating in 3 seconds...')
//         setTimeout(() => {
//             process.exit(1)
//         }, 3000);
//     } else {
//         console.log("Connected to the internet.");
//         const client = mqtt.connect(env.broker, { username: process.argv[2], password: process.argv[3] })
//         client.once('connect', () => {
//             (async () => {
//                 console.log('Fetching bridge data...');
//                 const bridgeData = await documentGetter("bridge", env._id).catch((reason) => reason)
//                 if (bridgeData) {
//                     console.log('Bridge data fetched.')
//                     documentListener("bridge", env._id)
//                     console.log('Fetching threshold data...')
//                     const thresholdData = await documentGetter("threshold", metaData.bridge.thresholdRef).catch((reason) => reason)
//                     if (thresholdData && thresholdData !== null) {
//                         console.log('Threshold data fetched.')
//                         documentListener("threshold", metaData.bridge.thresholdRef)
//                         var processHolder = []
//                         SerialPort.list().then(ports => {
//                             if (ports.length > 0) {
//                                 ports.forEach((port) => {
//                                     if ((port.path.includes('USB') || port.path.includes('COM')) && port.path) {
//                                         processHolder.push(rtuHandler(port.path, client))
//                                     }
//                                 })
//                             } else {
//                                 console.error('No active ports found. Terminating in 3 seconds...')
//                                 setTimeout(() => {
//                                     process.exit(1)
//                                 }, 3000);
//                             }
//                         })
//                     } else {
//                         console.error('Data fetch error. Terminating in 3 seconds...')
//                         setTimeout(() => {
//                             process.exit(1)
//                         }, 3000);
//                     }
//                 } else {
//                     console.error('Data fetch error. Terminating in 3 seconds...')
//                     setTimeout(() => {
//                         process.exit(1)
//                     }, 3000);
//                 }
//             })();
//         });
//         client.once('error', (error) => {
//             console.error('MQTT', error.message + '.', 'Terminating in 3 seconds...')
//             setTimeout(() => {
//                 client.end()
//                 process.exit(1)
//             }, 3000);
//         });
//     }
// });
