const SerialPort = require('serialport')
const { StringStream } = require("scramjet")
const admin = require('firebase-admin')
const env = require('./env.json')

admin.initializeApp({
    credential: admin.credential.cert(env.adminService),
    databaseURL: env.databaseURL,
})

var bridgeMetaData = {
    id: env.bridgeId,
    name: undefined,
    image: undefined
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

var RTUData = {}

const pushData = (db) => {
    db.ref('MQTT/' + env.bridgeId + '/concentrator_1/' + Date.now()).set(RTUData, (error) => {
        if (error) {
            console.log(error)
        } else {
            console.log('Pushed to databse!')
        }
    })
}

const userFCMTokenRegister = () => {
    admin.database().ref('users/').on('value', (snapshot) => {
        snapshot.forEach(element => {
            if (!element.val().subscribed) {
                admin.messaging().subscribeToTopic(element.val().FCMToken, 'global')
                    .then((response) => {
                        admin.database().ref('users/' + element.key).update({
                            FCMToken: element.val().FCMToken,
                            subscribed: true
                        }, (error) => {
                            error ? console.log('Update failed!') : console.log('Successfully subscribed from topic:', response);
                        })
                    })
                    .catch((error) => {
                        console.log('Error subscribing from topic:', error);
                    });
            }
        });
    })
}

const notificationSystem = () => {
    var bridgeInfoInit = false
    var bridgeStatus
    var latestStatus
    admin.firestore().collection("Bridge").doc(env.bridgeId)
        .onSnapshot((doc) => {
            bridgeStatus = doc.data().status
            bridgeMetaData.name = doc.data().name
            bridgeMetaData.image = doc.data().image
            bridgeMetaData.sensors = doc.data().thresholds.concentratorOne
            if (bridgeInfoInit) {
                if (latestStatus !== bridgeStatus) {
                    var message = null
                    if (bridgeStatus === 1) {
                        message = 'Danger'
                    } else if (bridgeStatus === 2) {
                        message = 'Warning'
                    }
                    if (message) {
                        admin.messaging().send({
                            data: {
                                '"image"': '"' + bridgeMetaData.image + '"',
                                '"is_background"': '"false"',
                                '"title"': '"' + bridgeMetaData.name.toString() + ' - ' + message + '!"',
                                '"message"': '"Tap here to see details"',
                                '"timestamp"': '"' + Date.now().toString() + '"',
                                '"article_data"': '"' + bridgeMetaData.id.toString() + '"'

                            },
                            topic: 'global'
                        }).then(() => {
                            console.log('Notification sent:', message);
                        })
                            .catch((error) => {
                                console.log('Error sending message:', error);
                            });
                    }
                }
            }
            bridgeInfoInit = true
            latestStatus = bridgeStatus
        });
}

const thresholdListener = () => {
    admin.database().ref('MQTT/' + env.bridgeId + '/thresholds/concentrator_1/').on('value', (snapshot) => {
        var thresholdsData = snapshot.val()
        Object.keys(thresholdsData).forEach(element => {
            thresholdValue[element] = {
                max: parseInt(thresholdsData[element].max),
                min: parseInt(thresholdsData[element].min)
            }
        })
        console.log(thresholdValue)
    })
}

const thresholdSystem = () => {
    Object.keys(data).forEach((value, i) => {
        var message = undefined
        var detail = undefined
        if (value in thresholdValue) {
            var maxData = typeof data[value] === 'object' ? Math.max(...data[value]) : data[value]
            var minData = typeof data[value] === 'object' ? Math.min(...data[value]) : data[value]
            if (maxData > thresholdValue[value].max) {
                detail = 'Melebihi Threshold'
            } else if (minData < thresholdValue[value].min) {
                detail = 'Dibawah Threshold'
            }
            if (detail) {
                admin.firestore().collection('notification_history').add({
                    bridge_id: env.bridgeId,
                    detail: detail,
                    sensor_id: bridgeMetaData.sensors[value].alias,
                    status: 0,
                    timestamp: data.timestamp,
                    time: new Date(data.timestamp).toLocaleString()
                }).then(() => {
                    message = {
                        data: {
                            '"image"': '"' + bridgeMetaData.image + '"',
                            '"is_background"': '"false"',
                            '"title"': '"' + bridgeMetaData.name.toString() + ' - Nilai ' + bridgeMetaData.sensors[value].alias + ' ' + detail + '!"',
                            '"message"': '"Tap here to see details"',
                            '"timestamp"': '"' + data.timestamp.toString() + '"',
                            '"article_data"': '"' + bridgeMetaData.id.toString() + '"'
                        },
                        topic: 'global'
                    };
                    if (message) {
                        admin.messaging().send(message)
                            .then(() => {
                                console.log('Notification sent:', message);
                            })
                            .catch((error) => {
                                console.log('Error sending message:', error);
                            });
                    }
                })
            }
        }
    })
}

// MAIN
if (admin.app().name === '[DEFAULT]') {
    console.clear()
    userFCMTokenRegister()
    notificationSystem()
    thresholdListener()
    SerialPort.list().then(ports => {
        ports.forEach((port) => {
            try {
                console.log(port)
                var command = undefined
                var parser = new StringStream()
                var handler = new SerialPort(port.path, {
                    baudRate: 57600
                }, error => error ? console.log(error.toString()) : '')
                handler.pipe(parser).lines().each(data => {
                    // console.log(data) // CEK RAW DATA
                    var temp = data.split(' ')
                    if (temp[1] === 'Ready') {
                        command = 'REQ_RTU' + temp[0].split('Gateway')[1]
                        console.log(command)
                    } else if (temp[1] === 'failed') {
                        console.log('Failed', command);
                    } else {
                        var header = temp.splice(0, 3)
                        var value = temp.join('').match(/.{1,4}/g)
                        var dec = value ? value.map((value) => parseInt(value, 16)) : '-'

                        // Parsing masing masing RTU
                        // RTU 1
                        if (parseInt(header[1]) === 1) {
                            var even = value ? dec.filter((e, i) => !(i % 2)) : '-'
                            var odd = value ? dec.filter((e, i) => (i % 2)) : '-'
                            odd = odd !== '-' ? odd.map((value) => value * -1) : '-'
                            // console.log('RTU_' + header[1] + ' response: ACC_1', even);
                            // console.log('RTU_' + header[1] + ' response: ACC_2', odd);
                            RTUData['ACC_1'] = even
                            RTUData['ACC_2'] = odd
                        // RTU 2
                        } else if (parseInt(header[1]) === 2) {
                            console.log(dec);
                            
                            RTUData['GYRO'] = dec.splice(0, 10)
                            // console.log('RTU_' + header[1] + ' response:', dec.splice(0, 10));

                        // RTU 3
                        } else if (parseInt(header[1]) === 3) {

                            RTUData['TEMP'] = dec[0]
                            RTUData['HUMIDITY'] = dec[1]
                            RTUData['DISPLACE'] = dec[2]
                            // console.log('RTU_' + header[1] + ' response:', dec);

                        // RTU 4
                        } else if (parseInt(header[1]) === 4) {
                            RTUData['STRAIN'] = Math.max(...dec)
                            // console.log('RTU_' + header[1] + ' response:', dec);
                        }
                    }
                })
                setInterval(() => {
                    console.clear()
                    command ? handler.write(command + ',1\r\n') : ''
                    console.log(RTUData);
                    // Untuk push data ke DB
                    // pushData(admin.database(), RTUData)

                    // Untuk nyalain notifikasi threshold
                    // thresholdSystem()

                    // NOTE: kalo mau push sama nyalain notif, interval set ke 2s, 
                    // jangan kurang dari 2s nanti over usage.
                }, 1000)
            } catch (error) {
                console.log('Error: ' + port.path + ' : ' + error.name + '! ' + error.message)
                process.exit(1)
            }
        })
        console.log('RTUs connection initialized.')
    }, error => console.log(error))
}