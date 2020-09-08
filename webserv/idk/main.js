// ESM syntax is supported.
import SerialPort from 'serialport'
import { StringStream } from 'scramjet'
import mqtt from 'mqtt';
import env from './env.json'
import admin from 'firebase-admin'
import { spawn } from 'child_process'
const client = mqtt.connect('wss://langgengciptasolusi-services.com:8083')

var bridgeMetaData = {
    id: env.bridgeId,
    name: undefined,
    image: undefined,
    status: undefined,
    usable: undefined
}

var thresholdValue = {
    'ACC_1': undefined,
    'ACC_2': undefined,
    'GYRO_1': undefined,
    'GYRO_2': undefined,
    'TEMP': undefined,
    'HUMIDITY': undefined,
    'DISPLACE': undefined,
    'STRAIN': undefined,
}

admin.initializeApp({
    credential: admin.credential.cert(env.adminService),
    databaseURL: env.databaseURL,
})
const storage = admin.storage()

// const thresholdListener = () => {
//     admin.database().ref('MQTT/' + env.bridgeId + '/thresholds/concentrator_1/').on('value', (snapshot) => {
//         var thresholdsData = snapshot.val()
//         Object.keys(thresholdsData).forEach(element => {
//             thresholdValue[element] = {
//                 max: parseFloat(thresholdsData[element].max),
//                 min: parseFloat(thresholdsData[element].min),
//                 max_low: parseFloat(thresholdsData[element].low_max),
//                 min_low: parseFloat(thresholdsData[element].low_min),
//             }
//         })
//         console.log(thresholdValue)
//     })
//     admin.firestore().collection("Bridge").doc(env.bridgeId)
//         .onSnapshot((doc) => {
//             bridgeMetaData.usable = doc.data().isUsable
//             bridgeMetaData.status = doc.data().status
//             bridgeMetaData.name = doc.data().name
//             bridgeMetaData.image = doc.data().image
//             bridgeMetaData.sensors = doc.data().thresholds.concentratorOne
//             console.log(bridgeMetaData)
//         })
// }

const thresholdChecker = (max, min, sensor) => {
    var message = undefined
    if (max > thresholdValue[sensor].max_low) {
        message = 'Melebihi batas maximum rendah'
        if (max > thresholdValue[sensor].max) {
            message = 'Melebihi batas maximum tinggi'
        }
    } else if (min < thresholdValue[sensor].min_low) {
        message = 'Melebihi batas minumum rendah'
        if (min < thresholdValue[sensor].min) {
            message = 'Melebihi batas minumum tinggi'
        }
    }
    if (message) {
        const timestamp = Date.now()
        const pythonProcess = spawn('python3', ['./capture.py', bridgeMetaData.id, timestamp])
        pythonProcess.stdout.on('data', (data) => {
            const message = String.fromCharCode.apply(null, data).split('\r\n')[0]
            console.log(message)
            admin.firestore().collection('Bridge').doc(bridgeMetaData.id).update({
                "snapshot": message
            }).then(() => {
                pythonProcess.kill()
            })
        })
        admin.firestore().collection('notification_history').add({
            bridge_id: env.bridgeId,
            detail: message,
            sensor_id: bridgeMetaData.sensors[sensor].alias,
            status: 0,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleString()
        }).then(() => {
            message = {
                data: {
                    '"image"': '"' + bridgeMetaData.image + '"',
                    '"is_background"': '"false"',
                    '"title"': '"' + bridgeMetaData.name.toString() + ' - Nilai ' + bridgeMetaData.sensors[sensor].alias + ' ' + message + '!"',
                    '"message"': '"Tap here to see details"',
                    '"timestamp"': '"' + timestamp.toString() + '"',
                    '"article_data"': '"' + bridgeMetaData.id.toString() + '"'
                },
                topic: 'global'
            };
            if (message) {
                admin.messaging().send(message)
                    .then(() => {
                        console.log('Notification sent!', timestamp);
                    })
                    .catch((error) => {
                        console.log('Error sending message:', error);
                    });
            }
        })
    }
}

// thresholdListener()

const dibelakangKoma = 100

client.on('connect', () => {
    client.subscribe('RTU', (err) => {
        if (!err) {
            SerialPort.list().then(ports => {
                ports.forEach((port, i) => {
                    var RTUId = undefined
                    var parser = new StringStream()
                    var buffer = new DataView(new ArrayBuffer(4))
                    var handler = new SerialPort(port.path, {
                        baudRate: 57600
                    }, error => error ? console.log(error.toString()) : '')
                    var failedCOunt = 0
                    var norepCount = 0
                    handler.pipe(parser).lines().each(data => {
                        const timestamp = Date.now()
                        var temp = data.split(' ').filter(item => item)
                        if (temp[1] === 'Ready') {
                            RTUId = temp[0].split('Gateway')[1]
                        } else if (temp[1] === 'failed') {
                            failedCOunt += 1
                            console.log('RTU' + RTUId, timestamp, data, '-', failedCOunt)
                        } else if (temp[1] === 'no') {
                            norepCount += 1
                            console.log('RTU' + RTUId, timestamp, data, '-', norepCount)
                        } else {
                            if (temp) {
                                temp.splice(0, 3)
                                temp.map((value) => {
                                    if (/^[0-9a-fA-F]+$/.test(value)) {
                                        return value;
                                    }
                                })
                                var value = temp.join('').match(/.{1,8}/g)
                                console.log('RTU' + RTUId, timestamp, 'length of data: ', value.length)
                                var realData, tempData, kurangG = undefined
                                switch (RTUId) {
                                    case '01':
                                        if (value.length >= 100) {
                                            realData = value.splice(0, 100).map((hex) => {
                                                buffer.setUint32(0, '0x' + hex)
                                                return Math.round((buffer.getFloat32(0) + Number.EPSILON) * 100) / 100
                                            })
                                            // thresholdChecker(Math.max(...realData), Math.min(...realData), 'ACC_1')
                                            // console.log('RTU' + RTUId, timestamp)
                                            client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        } else {
                                            console.log('RTU' + RTUId, timestamp, 'Data error! Either sendToWait failed or no reply on either X or Y.')
                                        }
                                        break;
                                    case '02':
                                        realData = value.splice(0, 5).map((hex) => {
                                            buffer.setUint32(0, '0x' + hex)
                                            return Math.round((buffer.getFloat32(0) + Number.EPSILON) * dibelakangKoma) / dibelakangKoma
                                        })
                                        // console.log('RTU' + RTUId, timestamp)
                                        client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        break;
                                    case '03':
                                        var value = temp.join('').match(/.{1,4}/g).splice(0, 3)
                                        var bufferView = new DataView(new ArrayBuffer(4))
                                        realData = value.map((hex) => {
                                            if (hex.length === 4) {
                                                bufferView.setUint16(0, '0x' + hex)
                                                const result = Math.round((bufferView.getInt16(0) + Number.EPSILON) * dibelakangKoma) / dibelakangKoma
                                                if (typeof result !== 'undefined') {
                                                    return result
                                                }
                                            }
                                        })
                                        // console.log('RTU' + RTUId, timestamp)
                                        client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        break;
                                    case '04':
                                        realData = value.splice(0, 1).map((hex) => {
                                            buffer.setUint16(0, '0x' + hex)
                                            return Math.round((buffer.getInt16(0) + Number.EPSILON) * dibelakangKoma) / dibelakangKoma
                                        })
                                        // console.log('RTU' + RTUId, timestamp)
                                        client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    })
                    setInterval(() => {
                        RTUId ? handler.write('REQ_RTU' + RTUId + ',1\r\n') : ''
                    }, 1000)
                })
            })
        }
    })
})

export { }
