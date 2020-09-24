const SerialPort = require('serialport')
const mqtt = require('mqtt')
const env = require('./env.json')
const admin = require('firebase-admin')
const { spawn } = require('child_process')
const { StringStream } = require('scramjet')

const client = mqtt.connect('wss://langgengciptasolusi-services.com:8083')
const dibelakangKoma = 100
var bridgeMetaData = {
    id: env.bridgeId,
    name: undefined,
    image: undefined,
    status: undefined,
    usable: undefined,
    notification: undefined
}

admin.initializeApp({
    credential: admin.credential.cert(env.adminService),
    databaseURL: env.databaseURL,
})

var thresholdValue = {}
var isLoaded = false
var bridgeDataLoaded = false

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const thresholdListener = () => {
    admin.database().ref('thresholds/' + env.bridgeId).on('value', (snapshot) => {
        var thresholdsData = snapshot.val()
        Object.keys(thresholdsData).forEach(element => {
            thresholdValue[element] = {
                max: parseFloat(thresholdsData[element].max),
                min: parseFloat(thresholdsData[element].min),
                max_low: parseFloat(thresholdsData[element].max_low),
                min_low: parseFloat(thresholdsData[element].min_low),
            }
        })
        isLoaded = true
    })
    admin.firestore().collection("Bridge").doc(env.bridgeId).onSnapshot((doc) => {
        bridgeMetaData.usable = doc.data().isUsable
        bridgeMetaData.status = doc.data().status
        bridgeMetaData.name = doc.data().name
        bridgeMetaData.image = doc.data().image
        bridgeMetaData.sensors = doc.data().sensors
        bridgeMetaData.notification = doc.data().isNotification
        bridgeDataLoaded = true
    })
}

const thresholdChecker = (max, min, concentratorId, rtuId, typeId) => {
    if (isLoaded && bridgeDataLoaded) {
        Object.values(bridgeMetaData.sensors).map((value) => {
            if (value.concentrator === parseInt(concentratorId) && value.rtu === parseInt(rtuId) && value.type === parseInt(typeId)) {
                const alias = value.alias
                var message = undefined
                var currentValue = undefined
                if (max > thresholdValue[value.sensor_id].max_low) {
                    message = 'Memasuki batas waspada'
                    if (bridgeMetaData.usable && bridgeMetaData.status !== 4 && bridgeMetaData.status === 3) {
                        admin.firestore().collection("Bridge").doc(env.bridgeId).update({
                            "status": 2
                        })
                    }
                    currentValue = max
                    if (max > thresholdValue[value.sensor_id].max) {
                        message = 'Memasuki batas bahaya'
                        if (bridgeMetaData.usable && bridgeMetaData.status !== 4) {
                            admin.firestore().collection("Bridge").doc(env.bridgeId).update({
                                "status": 1
                            })
                        }
                        currentValue = max
                    }
                } else if (min < thresholdValue[value.sensor_id].min_low) {
                    message = 'Memasuki batas waspada'
                    if (bridgeMetaData.usable && bridgeMetaData.status !== 4 && bridgeMetaData.status === 3) {
                        admin.firestore().collection("Bridge").doc(env.bridgeId).update({
                            "status": 2
                        })
                    }
                    currentValue = min
                    if (min < thresholdValue[value.sensor_id].min) {
                        message = 'Memasuki batas bahaya'
                        if (bridgeMetaData.usable && bridgeMetaData.status !== 4) {
                            admin.firestore().collection("Bridge").doc(env.bridgeId).update({
                                "status": 1
                            })
                        }
                        currentValue = min
                    }
                }
                if (message) {
                    const timestamp = Date.now()
                    const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', ['./capture.py', bridgeMetaData.id, timestamp])
                    pythonProcess.stdout.on('data', (data) => {
                        const processMessage = String.fromCharCode.apply(null, data).split('\r\n')[0].replace('\n', '')
                        admin.firestore().collection('Bridge').doc(bridgeMetaData.id).update({
                            "snapshot": processMessage
                        }).then(() => {
                            admin.firestore().collection('notification_history').add({
                                bridge_id: env.bridgeId,
                                detail: message,
                                sensor_id: alias,
                                status: 0,
                                timestamp: timestamp,
                                time: new Date(timestamp).toLocaleString()
                            }).then(() => {
                                if (bridgeMetaData.notification) {
                                    messagePayload = {
                                        data: {
                                            '"image"': '"' + bridgeMetaData.image + '"',
                                            '"is_background"': '"false"',
                                            '"title"': '"' + bridgeMetaData.name.toString() + ' - Nilai ' + alias + ' ' + message + '!"',
                                            '"message"': '"Tap here to see details"',
                                            '"timestamp"': '"' + timestamp.toString() + '"',
                                            '"article_data"': '"' + bridgeMetaData.id.toString() + '"'
                                        },
                                        topic: 'global'
                                    };
                                    if (messagePayload) {
                                        admin.messaging().send(messagePayload).then(() => {
                                            console.log('Concentrator: ' + concentratorId + '\t\t', 'RTU' + rtuId, new Date(timestamp), 'Notification Sent -', 'Nilai ' + alias + ' ' + message + '!', currentValue, concentratorId, rtuId, typeId)
                                        }).catch((error) => {
                                            console.error('Concentrator: ' + concentratorId + '\t\t', 'RTU' + rtuId, new Date(timestamp), 'Notification Failed To Sent -', error, currentValue, concentratorId, rtuId, typeId)
                                        });
                                    }
                                }
                            })
                            pythonProcess.kill()
                        })
                    })
                }
            }
        })
    }
}

thresholdListener()

client.on('connect', () => {
    if (typeof process.argv[2] !== 'undefined' && process.argv[2] === 'dummy') {
        setInterval(() => {
            const timestamp = Date.now()
            const acc1 = [...Array(100)].map(() => getRandomInt(-1, 1))
            client.publish('sensor/' + bridgeMetaData.id + '/1/1/1', timestamp + ',' + acc1.join(','))
            thresholdChecker(Math.max(...acc1), Math.min(...acc1), 1, 1, 1)
        }, 1000)
        setInterval(() => {
            const timestamp = Date.now()
            const acc2 = [...Array(100)].map(() => getRandomInt(-1, 1))
            client.publish('sensor/' + bridgeMetaData.id + '/1/5/1', timestamp + ',' + acc2.join(','))
            thresholdChecker(Math.max(...acc2), Math.min(...acc2), 1, 5, 1)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const acc3 = [...Array(100)].map(() => getRandomInt(-1, 1))
            client.publish('sensor/' + bridgeMetaData.id + '/1/6/1', timestamp + ',' + acc3.join(','))
            thresholdChecker(Math.max(...acc3), Math.min(...acc3), 1, 6, 1)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const acc4 = [...Array(100)].map(() => getRandomInt(-1, 1))
            client.publish('sensor/' + bridgeMetaData.id + '/1/7/1', timestamp + ',' + acc4.join(','))
            thresholdChecker(Math.max(...acc4), Math.min(...acc4), 1, 7, 1)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const gyro = [...Array(6)].map(() => getRandomInt(-60, 60))
            client.publish('sensor/' + bridgeMetaData.id + '/1/2/2', timestamp + ',' + gyro.join(','))
            thresholdChecker(Math.max(...gyro), Math.min(...gyro), 1, 2, 2)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const temp = [getRandomInt(-90, 90)]
            client.publish('sensor/' + bridgeMetaData.id + '/1/3/3', timestamp + ',' + temp.join(','))
            thresholdChecker(Math.max(...temp), Math.min(...temp), 1, 3, 3)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const humi = [getRandomInt(-50, 50)]
            client.publish('sensor/' + bridgeMetaData.id + '/1/3/4', timestamp + ',' + humi.join(','))
            thresholdChecker(Math.max(...humi), Math.min(...humi), 1, 3, 4)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const disp = [getRandomInt(-750, 750)]
            client.publish('sensor/' + bridgeMetaData.id + '/1/3/5', timestamp + ',' + disp.join(','))
            thresholdChecker(Math.max(...disp), Math.min(...disp), 1, 3, 5)
        }, 1000);
        setInterval(() => {
            const timestamp = Date.now()
            const strain = [getRandomInt(-900, 900)]
            client.publish('sensor/' + bridgeMetaData.id + '/1/4/6', timestamp + ',' + strain.join(','))
            thresholdChecker(Math.max(...strain), Math.min(...strain), 1, 4, 6)
        }, 1000);
    } else {
        SerialPort.list().then(ports => {
            var portPath = []
            ports.forEach((port) => {
                if (process.platform !== 'win32' && port.path.includes('USB') && port.path) {
                    portPath.push(port.path)
                } else if (port.path) {
                    portPath.push(port.path)
                }
            })
            portPath.forEach(path => {
                var rtuId = undefined
                var concentratorId = undefined
                var gateway = undefined
                var parser = new StringStream()
                var buffer = new DataView(new ArrayBuffer(4))
                var handler = new SerialPort(path, {
                    baudRate: 57600
                }, error => error ? console.error(path, error.message) : console.log(path, '\t', 'Connection Successful!', 'Process binded into PID:', process.pid))
                var failedCOunt = 0
                var norepCount = 0
                handler.pipe(parser).lines().each(data => {
                    var a = data.split(' ')
                    const timestamp = Date.now()
                    if (data.search('ready') !== -1) {
                        data = data.split(',')
                        data.pop()
                        const RTUMetaData = data.splice(0, 5)
                        typeId = parseInt(data)
                        concentratorId = parseInt(RTUMetaData[0].split('con')[1])
                        frequency = parseInt(RTUMetaData[1])
                        gateway = parseInt(RTUMetaData[2].split('gw')[1])
                        const reqId = parseInt(RTUMetaData[3].split('_')[1])
                        const interval = parseInt(RTUMetaData[4])
                        setInterval(() => {
                            handler.write('REQ_RTU' + reqId.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) + ',1\r\n')
                        }, interval)
                    } else if (data.search('sendtoWait failed') !== -1) {
                        failedCOunt += 1
                        console.error(path, '\t', 'PID:', process.pid, 'Gateway:', gateway, new Date(timestamp), 'sendtoWait failed -', failedCOunt)
                    } else if (data.search('no reply') !== -1) {
                        norepCount += 1
                        console.error(path, '\t', 'PID:', process.pid, 'Gateway:', gateway, new Date(timestamp), 'no reply -', norepCount)
                    } else {
                        data = data.split(' ').filter(item => item)
                        const metaData = data.splice(0, 3)
                        concentratorId = parseInt(metaData[0])
                        rtuId = parseInt(metaData[1])
                        data = data.join('').match(/.{1,8}/g)
                        switch (typeId) {
                            case 1:
                                if (data && data.length >= 100) {
                                    realData = data.splice(0, 100).map((hex) => {
                                        buffer.setUint32(0, '0x' + hex)
                                        return Math.round((buffer.getFloat32(0) + Number.EPSILON) * dibelakangKoma) / dibelakangKoma
                                    })
                                    thresholdChecker(Math.max(...realData), Math.min(...realData), concentratorId, rtuId, typeId)
                                    client.publish('sensor/' + bridgeMetaData.id + '/' + parseInt(concentratorId) + '/' + parseInt(rtuId) + '/' + parseInt(typeId), timestamp + ',' + realData.join(','))
                                }
                                break;
                            case 6:
                                if (data && data.length >= 100) {
                                    realData = data.splice(0, 100).map((hex) => {
                                        buffer.setUint32(0, '0x' + hex)
                                        return Math.round((buffer.getFloat32(0) + Number.EPSILON) * dibelakangKoma) / dibelakangKoma
                                    })
                                    console.log(realData)
                                    // thresholdChecker(Math.max(...realData), Math.min(...realData), concentratorId, rtuId, typeId)
                                    // client.publish('sensor/' + bridgeMetaData.id + '/' + parseInt(concentratorId) + '/' + parseInt(rtuId) + '/' + parseInt(typeId), timestamp + ',' + realData.join(','))
                                }
                                break;
                            default:
                                if (data) {
                                    realData = data.map((hex) => {
                                        buffer.setUint32(0, '0x' + hex)
                                        return Math.round((buffer.getFloat32(0) + Number.EPSILON) * dibelakangKoma) / dibelakangKoma
                                    })
                                    if (realData) {
                                        thresholdChecker(Math.max(...realData), Math.min(...realData), concentratorId, rtuId, typeId)
                                        client.publish('sensor/' + bridgeMetaData.id + '/' + parseInt(concentratorId) + '/' + parseInt(rtuId) + '/' + parseInt(typeId), timestamp + ',' + realData.join(','))
                                    }
                                }
                                break;
                        }
                    }
                })
            })
        })
    }
})