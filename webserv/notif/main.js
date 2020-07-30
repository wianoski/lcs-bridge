// ESM syntax is supported.
import mqtt from 'mqtt';
import admin from 'firebase-admin'
import env from './env.json'
const client = mqtt.connect('ws://103.146.202.75:8083')

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

admin.initializeApp({
    credential: admin.credential.cert(env.adminService),
    databaseURL: env.databaseURL,
})

client.on('connect', () => {
    client.subscribe('RTU/#', (err) => err ? console.log(err) : '')
})

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
                max: parseFloat(thresholdsData[element].max),
                min: parseFloat(thresholdsData[element].min),
                max_low: parseFloat(thresholdsData[element].low_max),
                min_low: parseFloat(thresholdsData[element].low_min),
            }
        })
        console.log(thresholdValue)
    })
}

const thresholdChecker = () => {
    Object.keys(RTUData).forEach((value, i) => {
        var message = undefined
        var detail = undefined
        if (value in thresholdValue) {
            var maxData = typeof RTUData[value] === 'object' ? Math.max(...RTUData[value]) : RTUData[value]
            var minData = typeof RTUData[value] === 'object' ? Math.min(...RTUData[value]) : RTUData[value]
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
                    timestamp: Date.now(),
                    time: new Date(Date.now()).toLocaleString()
                }).then(() => {
                    message = {
                        data: {
                            '"image"': '"' + bridgeMetaData.image + '"',
                            '"is_background"': '"false"',
                            '"title"': '"' + bridgeMetaData.name.toString() + ' - Nilai ' + bridgeMetaData.sensors[value].alias + ' ' + detail + '!"',
                            '"message"': '"Tap here to see details"',
                            '"timestamp"': '"' + Date.now().toString() + '"',
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

userFCMTokenRegister()
notificationSystem()
thresholdListener()

setTimeout(() => {
    client.on('message', (topic, message) => {
        // message is Buffer
        console.log(topic.toString())
        var header = topic.toString()
        var fullMessage = message.toString().split(',')
        var timestamp = fullMessage.splice(0, 1)
        if (header = 'RTU/01') {
            RTUData['ACC_1'] = fullMessage
        } else if (header = 'RTU/02') {
            RTUData['GYRO_1'] = fullMessage
        } else if (header = 'RTU/03') {
            RTUData['TEMP'] = fullMessage[0]
            RTUData['DISPLACE'] = fullMessage[1]
            RTUData['HUMIDITY'] = fullMessage[2]
        } else if (header = 'RTU/04') {
            RTUData['STRAIN'] = fullMessage
        }
        console.log(message.toString())
        thresholdChecker()
        // client.end()
    })
}, 3000)


export { }
