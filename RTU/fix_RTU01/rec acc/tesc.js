const mqtt = require('mqtt')
const environment = require('./env.json')
const _ = require('lodash');
const { spawn } = require('child_process')
const admin = require('firebase-admin');
const SerialPort = require('serialport');
const { StringStream } = require('scramjet');
const fs = require('fs');

admin.initializeApp({
    credential: admin.credential.cert(environment.adminService)
});

var bridgeData = {}
var sensorData = []
var thresholdGlobal = []

const createMQTTInstance = () => {
    return mqtt.connect(environment.mqtt.broker, { username: environment.mqtt.username, password: environment.mqtt.password }).on('error', (error) => {
        console.error(error.message)
    });
}

/**
* Listen for changes on a Collection and specific documents or where queries
* @param {String} collection - Collection Name.
* @param {String} query - Can be specific Document ID or multiple where queries.
*/
const Stream = (collection, query) => {
    const timestamp = Date.now()
    const MQTTInstance = createMQTTInstance()
    MQTTInstance.once('connect', () => {
        MQTTInstance.on('message', (topic, message) => {
            const result = JSON.parse(message.toString())
            if (topic === 'payload/' + timestamp) {
                if (query) {
                    if (query.includes('||') || query.includes('|')) {
                        MQTTInstance.emit('snapshot', Object.values(result.payload).map((value) => value))
                        MQTTInstance.subscribe('changestream/' + collection + '/#', (error) => {
                            if (error) {
                                console.error(error.message)
                            }
                        });
                    } else {
                        MQTTInstance.emit('snapshot', [result.payload])
                        MQTTInstance.subscribe('changestream/' + collection + '/' + query, (error) => {
                            if (error) {
                                console.error(error.message)
                            }
                        });
                    }
                } else {
                    MQTTInstance.emit('snapshot', Object.values(result.payload).map((value) => value))
                    MQTTInstance.subscribe('changestream/' + collection + '/#', (error) => {
                        if (error) {
                            console.error(error.message)
                        }
                    });
                }
                MQTTInstance.unsubscribe('payload/' + timestamp)
            } else {
                if (result.operation === 'delete') {
                    MQTTInstance.emit('snapshot', [{ toBeDeleted: true, _id: result.message }])
                } else {
                    MQTTInstance.emit('snapshot', [result.payload])
                }
            }
        });
        MQTTInstance.subscribe('payload/' + timestamp, (error) => {
            if (!error) {
                if (query) {
                    MQTTInstance.publish('request/get/' + timestamp, collection + '|#|' + query);
                } else {
                    MQTTInstance.publish('request/get/' + timestamp, collection + '|#|');
                }
            } else {
                console.error(error.message)
            }
        });
    });
    return MQTTInstance
}

/**
* Read a Collection for Once
* @returns {Promise<[]>} Array of documents.
*/
const Once = async (collection, query) => new Promise((resolve, reject) => {
    const timestamp = Date.now()
    const MQTTInstance = createMQTTInstance()
    MQTTInstance.once('connect', () => {
        MQTTInstance.once('message', (topic, message) => {
            if (query && (query.includes('||') || query.includes('|'))) {
                resolve(Object.values(JSON.parse(message.toString()).payload).map((document) => document))
            } else {
                resolve([JSON.parse(message.toString()).payload])
            }
            MQTTInstance.end()
        })
        MQTTInstance.subscribe('payload/' + timestamp, (error) => {
            if (!error) {
                if (query) {
                    MQTTInstance.publish('request/get/' + timestamp, collection + '|#|' + query);
                } else {
                    MQTTInstance.publish('request/get/' + timestamp, collection + '|#|');
                }

            } else {
                console.error(error.message)
                reject([error.message])
                MQTTInstance.end()
            }
        });
    })
})

/**
* Delete documents from a Collection.
* @param {String} collection - Collection Name.
* @param {String} query - Can be a Document ID or multiple where queries.
* @param {String} description - Delete description for audit system.
* @param {String} userId - User authentication using uid.
* @returns {Promise<{}>} Server response.
*/
const Delete = async (collection, query, description, userId) => new Promise((resolve, reject) => {
    const timestamp = Date.now()
    const MQTTInstance = createMQTTInstance()
    MQTTInstance.once('connect', () => {
        MQTTInstance.once('message', (topic, message) => {
            resolve(JSON.parse(message.toString()))
            MQTTInstance.end()
        })
        MQTTInstance.subscribe('payload/' + timestamp, (error) => {
            if (!error) {
                MQTTInstance.publish('request/delete/' + timestamp, collection + '|#|' + query);
            } else {
                reject([error.message])
                MQTTInstance.end()
            }
        });
    })
})

/**
* Update documents based on where queries
* @param {String} collection - Collection Name.
* @param {String} query - Can be a Document ID or multiple where queries.
* @param {{}} payload - Document Object.
* @param {String} description - Update description for audit system.
* @param {String} userId - User authentication using uid.
* @returns {Promise<{}>} Server response.
*/
const Update = async (collection, query, payload, description, userId) => new Promise((resolve, reject) => {
    const timestamp = Date.now()
    const MQTTInstance = createMQTTInstance()
    MQTTInstance.once('message', (topic, message) => {
        resolve(JSON.parse(message.toString()))
        MQTTInstance.end()
    })
    MQTTInstance.subscribe('payload/' + timestamp, (error) => {
        if (!error) {
            if (typeof payload !== 'undefined') {
                MQTTInstance.publish('request/update/' + timestamp, collection + '|#|' + query + '|#|' + JSON.stringify(payload));
            } else {
                console.error('Payload type is not an object. Please review your code.')
                reject(['Payload type is not an object. Please review your code.'])
                MQTTInstance.end()
            }
        } else {
            reject([error.message])
            MQTTInstance.end()
        }
    });
})

class Where {
    /**
    * Constructor of Where Query Instance
    * @param {String} collection - Collection Name.
    * @param {String} query - Specific Document ID or Where Queries.
    */
    constructor(collection, query) {
        this.collection = collection
        this.query = query
    }
    /**
    * Read a Collection for Once
    * @returns {Promise<[]>} Array of documents.
    */
    Once = () => {
        return Once(this.collection, this.query)
    }

    /**
    * Listen for changes on a Collection and specific documents or where queries
    * @returns {MqttClient} MQTT Client Instance.
    */
    Stream = () => {
        return Stream(this.collection, this.query)
    }

    /**
    * Update documents based on where queries
    * @param {{}} payload - Document Object.
    * @param {String} description - Update description for audit system.
    * @param {String} userId - User authentication using uid.
    * @returns {Promise<{}>} Server response.
    */
    Update = (payload, description, userId) => {
        return Update(this.collection, this.query, payload, description, userId)
    }


    /**
    * Delete documents based on where queries
    * @param {String} description - Delete description for audit system.
    * @param {String} userId - User authentication using uid.
    * @returns {Promise<{}>} Server response.
    */
    Delete = (description, userId) => {
        return Delete(this.collection, this.query, description, userId)
    }
}


class Collection {
    /**
    * Constructor of Collection Instance
    * @param {String} collection - Collection Name.
    * @param {MqttClient} MQTTInstance - MQTT Instance.
    */
    constructor(collection) {
        this.collection = collection
    }

    /**
    * Create a Document in a Collection
    * @param {{}} payload - Document Object.
    * @param {String} description - Delete description for audit system.
    * @param {String} userId - User authentication using uid.
    * @returns {Promise<{}>} Server response.
    */
    Create = async (payload, description, userId) => new Promise((resolve, reject) => {
        const timestamp = Date.now()
        const MQTTInstance = createMQTTInstance()
        MQTTInstance.once('message', (topic, message) => {
            resolve(JSON.parse(message.toString()))
            MQTTInstance.end()
        })
        MQTTInstance.subscribe('payload/' + timestamp, (error) => {
            if (!error) {
                if (typeof payload !== 'undefined') {
                    MQTTInstance.publish('request/create/' + timestamp, this.collection + '|#|' + JSON.stringify(payload));
                } else {
                    reject('Payload type is not an object. Please review your code.')
                    MQTTInstance.end()
                }
            } else {
                reject('Payload type is not an object. Please review your code.')
                MQTTInstance.end()
            }
        });
    })
    /**
    * Read some Document of a Collection
    * @param {String} documentId - Specific Document ID or multiple where queries.
    */
    Where = (query) => {
        return new Where(this.collection, query)
    }

    /**
    * Read a Collection for Once
    * @returns {Promise<[]>} Array of documents.
    */
    Once = () => {
        return Once(this.collection, undefined)
    }

    /**
    * Listen for changes on a Collection and specific documents or where queries
    */
    Stream = () => {
        return Stream(this.collection, undefined)
    }
}

class RRealtimeFramework {
    /**
    * Constructor of Rizki Realtime Framework Instance
    */
    constructor() {
        this.InstanceID = Date.now()
    }

    /**
    * Collection on Database
    * @param {String} collection - Collection Name. Can be any collection name on Database.
    */
    // eslint-disable-next-line no-unused-vars
    Collection = (collection) => {
        return new Collection(collection)
    }
    /**
    * Create an MQTT Instance.
    */
    get createMQTTInstance() {
        return createMQTTInstance
    }
    /**
    * Collection Listener
    * @param {String} functionName - Function Name. Can be `RCM`, `user`, or `report`.
    * @param {String} operation - Operation Type. Can be `create`, `read`, `update`, or `delete`.
    * @param {String} commandString - Command String. Must be a string type value.
    */
    // eslint-disable-next-line no-unused-vars
    Command = async (functionName, operation, topic, commandString) => new Promise((resolve, reject) => {
        const MQTTInstance = createMQTTInstance()
        MQTTInstance.once('connect', () => {
            const timestamp = Date.now();
            MQTTInstance.once('message', (topic, message) => {
                resolve(message.toString());
                MQTTInstance.end();
            });
            MQTTInstance.subscribe('answer/' + functionName + '/' + operation + '/' + timestamp, (error) => {
                if (!error) {
                    MQTTInstance.publish('command/' + functionName + '/' + operation + '/' + timestamp, topic + '|#|' + commandString);
                } else {
                    reject(error.message)
                    MQTTInstance.end()
                }
            });
        });
        MQTTInstance.once('error', (error) => {
            console.error(error.message)
            reject(undefined)
            MQTTInstance.end()
        });
    })
}

const RRF = new RRealtimeFramework()

const sensorTemplater = (sensor) => {
    return {
        concentrator: sensor && typeof sensor.concentrator !== 'undefined' ? sensor.concentrator : undefined,
        gateway: sensor && typeof sensor.gateway !== 'undefined' ? sensor.gateway : undefined,
        type: sensor && typeof sensor.type !== 'undefined' ? sensor.type : undefined,
        alias: sensor && typeof sensor.alias !== 'undefined' ? sensor.alias : undefined,
        rtu: sensor && typeof sensor.rtu !== 'undefined' ? sensor.rtu : undefined
    }
}

const bridgeTemplater = (bridge) => {
    return {
        _id: bridge && typeof bridge._id !== 'undefined' ? bridge._id : undefined,
        name: bridge && typeof bridge.name !== 'undefined' ? bridge.name : undefined,
        city: bridge && typeof bridge.city !== 'undefined' ? bridge.city : undefined,
        thresholdRef: bridge && typeof bridge.thresholdRef !== 'undefined' ? bridge.thresholdRef : undefined,
        isUsable: bridge && typeof bridge.isUsable !== 'undefined' ? bridge.isUsable : undefined,
        length: bridge && typeof bridge.length !== 'undefined' ? bridge.length : undefined,
        province: bridge && typeof bridge.province !== 'undefined' ? bridge.province : undefined,
        sensorHierarcy: bridge && typeof bridge.sensorHierarcy !== 'undefined' ? bridge.sensorHierarcy : undefined,
        image: bridge && typeof bridge.image !== 'undefined' ? bridge.image : undefined,
        longitude: bridge && typeof bridge.longitude !== 'undefined' ? bridge.longitude : undefined,
        address: bridge && typeof bridge.address !== 'undefined' ? bridge.address : undefined,
        latitude: bridge && typeof bridge.latitude !== 'undefined' ? bridge.latitude : undefined,
        bridge_number: bridge && typeof bridge.bridge_number !== 'undefined' ? bridge.bridge_number : undefined,
        layout: bridge && typeof bridge.layout !== 'undefined' ? bridge.layout : undefined,
        structure: bridge && typeof bridge.structure !== 'undefined' ? bridge.structure : undefined,
        isNotification: bridge && typeof bridge.isNotification !== 'undefined' ? bridge.isNotification : undefined,
        snapshot: bridge && typeof bridge.snapshot !== 'undefined' ? bridge.snapshot : undefined,
        type: bridge && typeof bridge.type !== 'undefined' ? bridge.type : undefined,
        year_construction: bridge && typeof bridge.year_construction !== 'undefined' ? bridge.year_construction : undefined,
        status: bridge && typeof bridge.status !== 'undefined' ? bridge.status : undefined
    }
}

const snapshotProcessor = (snapshot) => {
    if (Array.isArray(snapshot) && snapshot.length !== 0) {
        snapshot.forEach((bridge) => {
            bridgeData = bridgeTemplater(bridge)
            sensorData = Object.keys(bridge.sensor).map((ref) => {
                const tempSensor = sensorTemplater(bridge.sensor[ref])
                tempSensor['ref'] = ref
                return tempSensor
            })
        })
    }
}

const thresholdProcessor = (threshold) => {
    if (Array.isArray(threshold) && threshold.length !== 0) {
        threshold.forEach((threshold) => {
            thresholdGlobal = Object.keys(threshold).map((ref) => {
                const tempThreshold = thresholdFormatter(threshold[ref])
                tempThreshold['ref'] = ref
                return tempThreshold
            })
        })
    }
}

const sensorInfoGetter = (concentratorId, gatewayId, rtuId) => {
    const result = _.find(sensorData, { concentrator: concentratorId, gateway: gatewayId, rtu: rtuId })
    return {
        alias: result && result.alias ? result.alias : '',
        type: result && result.type ? result.type : 0,
        concentrator: result && result.concentrator ? result.concentrator : 0,
        gateway: result && result.gateway ? result.gateway : 0,
        available: result && result.available ? result.available : false,
        rtu: result && result.rtu ? result.rtu : 0,
        ref: result && result.ref ? result.ref : '',
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

const sendNotification = async (topic = '', title = '', sensorName = '', message = '', bridgeId = '', snapshotUrl = '', timestamp = Date.now()) => new Promise((resolve, reject) => {
    const finalUrl = snapshotUrl !== '' ? 'https://processing.jembatanku.com/storage/' + snapshotUrl + '/jpeg' : null
    console.log(finalUrl)
    admin.messaging().send({
        topic: topic,
        webpush: {
            notification: {
                badge: '/logo.png',
                requireInteraction: true,
                tag: title + ' - ' + sensorName,
                icon: '/logo.png',
                title: title,
                body: message,
                image: finalUrl
            },
            data: {
                bridgeId: bridgeId.toString(),
                timestamp: timestamp.toString(),
            }
        },
        android: {
            priority: 'high',
            data: {
                bridgeId: bridgeId.toString(),
                timestamp: timestamp.toString(),
                title: title.toString(),
                body: message.toString(),
                image: finalUrl
            }
        },
    }).then(() => {
        console.log('An alert has been sent at', new Date(parseInt(timestamp)).toLocaleString())
        resolve(true)
    }).catch((error) => {
        console.error('An alert has failed to be sent', error)
        reject(undefined)
    });
});

// const capture = spawn(process.platform === 'win32' ? 'python' : 'python3', ['capture.py', 'https://processing.jembatanku.com/upload/', process.argv[2]], { stdio: 'pipe' })
// capture.stderr.on('data', (error) => {
//     fs.appendFile('errors.csv', new Date().toISOString() + ',' + error.toString() + '\n', (error) => error ? console.error(error) : '')
// })
// capture.on('exit', (code) => {
//     console.error("Camera handler terminated with error code {", code,"}. See errors.csv to see the full logs.");
//     fs.appendFile('log.csv', new Date().toISOString() + ',Camera handler terminated\n', (error) => error ? console.error(error) : '')
// });
// capture.stdout.on('data', (data) => {
//     try {
//         const response = JSON.parse(data.toString())
//         if (response.error === '') {
//             console.log('Sending alert...', new Date().toLocaleString())
//             RRF.Collection('bridge').Where(environment._id).Update({ snapshot: response.snapshotUrl }).catch((reason) => reason)
//             if (bridgeData.isNotification) {
//                 sendNotification(response.topic, response.title, response.sensorName, 'Nilai sensor ' + response.sensorName + ' ' + response.message, environment._id, response.snapshotUrl, response.timestamp)
//             }
//         } else {
//             console.error(response.error)
//             console.error('Sending alert without snapshot image...')
//             if (bridgeData.isNotification) {
//                 sendNotification(response.topic, response.title, response.sensorName, 'Nilai sensor ' + response.sensorName + ' ' + response.message, environment._id, response.snapshotUrl, response.timestamp)
//             }
//         }
//     } catch (e) {
//         console.log(data.toString())
//     }

// })

const snapshotCapture = (timestamp = Date.now(), topic = '', title = '', sensorName = '', message = '') => {
    if (capture.killed) {
        console.error('Camera handler terminated. Alerts will not be sent.')
        fs.appendFile('log.csv', new Date().toISOString() + ',Camera handler terminated. Alerts will not be sent.\n', (error) => error ? console.error(error) : '')
    } else {
        capture.stdin.write(timestamp + '||' + topic + '||' + title + '||' + sensorName + '||' + message + '\r\n', (error) => error ? console.error(error) : '');
    }
}

const thresholdTrigger = async (max, min, sensorInfo) => {
    const thresholds = thresholdFormatter(_.find(thresholdGlobal, { ref: sensorInfo.ref.toString() }))
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
    if (thresholdLevel && bridgeData.isUsable && bridgeData.status <= 3) {
        RRF.Collection('bridge').Where(environment._id).Update({ status: thresholdLevel }).catch((reason) => reason)
        const timestamp = Date.now()
        console.warn('New trigger at', new Date(timestamp).toLocaleString())
        const message = thresholdLevel === 1 ? 'memasuki batas bahaya' : 'memasuki batas waspada'
        snapshotCapture(timestamp, 'bridge', bridgeData.name.toString(), sensorInfo.alias, message)
        RRF.Collection('bridge').Where(environment._id).Update({ ['sensor.' + sensorInfo.ref + '.triggered']: true }).catch((reason) => reason)
        RRF.Collection('bridge').Where(environment._id).Update({ ['sensor.' + sensorInfo.ref + '.lastTriggered']: Date.now() }).catch((reason) => reason)
        RRF.Collection('notification').Create({
            bridge_id: environment._id,
            detail: message,
            sensor_id: sensorInfo.alias,
            status: 0,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
        }).catch((reason) => reason)
    }
}

/**
* @param {MqttClient} client Array of documents.
*/
const sendPayload = (client, bridgeId, concentratorId, rtuId, typeId, timestamp, activation_max, activation_min, realData) => {
    const path = parseInt(concentratorId) + '/' + parseInt(rtuId) + '/' + parseInt(typeId)
    const dir = 'sensorData/' + path
    client.publish('sensor/tes/' + path, timestamp + ',' + activation_max + ',' + activation_min + ',' + realData, { qos: 0 })
    if (!fs.existsSync(dir)) {
        fs.mkdir(dir, { recursive: true }, (error) => console.error(error));
    } else {
        fs.appendFile(dir + '/' + new Date().getDate().toString().padStart(2, '0') + (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getFullYear().toString() + '.csv', new Date().toISOString() + ',' + realData + '\n', (error) => error ? console.error(error) : '')
    }
}

const rtuHandler = async (path) => {
    const MQTTClientInstance = RRF.createMQTTInstance()
    MQTTClientInstance.on('error', () => {
        MQTTClientInstance.end()
        fs.appendFile('log.csv', new Date().toISOString() + ',MQTT connection failed\n', (error) => error ? console.error(error) : process.exit(0))
    });
    MQTTClientInstance.once('connect', () => {
        console.log('Connection instance for', path, 'initialized.')
        const precision = 100
        var sensorRef = undefined
        var gatewayId = undefined
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
                frequency = parseInt(RTUMetaData[1])
                gatewayId = parseInt(RTUMetaData[2].split('gw')[1])
                const reqId = parseInt(RTUMetaData[3].split('_')[1])
                const interval = parseInt(RTUMetaData[4])
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
                    errorCounter = 0
                }
            } else if (data.includes('no reply')) {
                norepCount += 1
                errorCounter += 1
                const rtuNumber = parseInt(data.split(' ')[0].split('RTU')[1])
                if (!isNaN(rtuNumber)) {
                    console.error(path, 'Gateway:', gatewayId, 'RTU:', rtuNumber, new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }), 'no reply -', norepCount)
                    if (errorCounter === 5) {
                        errorCounter = 0
                    }
                } else {
                    console.error(path, 'Gateway:', gatewayId, new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }), 'no reply -', norepCount)
                }
            } else {
                data = data.split(' ').filter(item => item)
                const newMetaData = data.splice(0, 3)
                const validation = newMetaData.map((val) => parseInt(val))
                if (newMetaData[0] < 10 && !validation.includes(NaN) && newMetaData.length === 3) {
                    const sensorInfo = sensorInfoGetter(parseInt(newMetaData[0]), gatewayId, parseInt(newMetaData[1]))
                    sensorRef = sensorInfo.ref
                    const thresholds = thresholdFormatter(_.find(thresholdGlobal, { ref: sensorRef.toString() }))
                    switch (sensorInfo.type) {
                        case 1:
                            data = data.join('').match(/.{1,8}/g)
                            if (data && data.length > 100) {
                                var realData = []
                                data.map((hex, index) => {
                                    buffer.setUint32(0, '0x' + hex)
                                    const result = Math.round((buffer.getFloat32(0) + Number.EPSILON) * precision) / precision
                                    if (result || result === 0) {
                                        if (index % 2 === 0) {
                                            realData.push(((result / 1.288189161801129) * thresholds.gain.first) + thresholds.offset.first)
                                        } else {
                                            realData.push(((result / 0.27365876319955945) * thresholds.gain.second) + thresholds.offset.second)
                                        }
                                    }
                                })
                                realData = realData.splice(0, 100)
                                // thresholdTrigger(Math.max(...realData), Math.min(...realData), sensorInfo)
                                sendPayload(MQTTClientInstance, environment._id, sensorInfo.concentrator, sensorInfo.rtu, sensorInfo.type, Date.now(), thresholds.activation.max, thresholds.activation.min, realData.join(','))
                            }
                            break;
                        case 2:
                            data = data.join('').match(/.{1,4}/g)
                            if (data) {
                                var realData = []
                                data.map((hex) => {
                                    if (hex.length === 4) {
                                        buffer.setUint32(0, '0x' + hex)
                                        const result = Math.round((buffer.getInt32(0) + Number.EPSILON) * precision) / precision
                                        if (result || result === 0) {
                                            realData.push((result * thresholds.gain.first) + thresholds.offset.first)
                                        }
                                    }
                                })
                                realData = realData.splice(0, 10)
                                // thresholdTrigger(Math.max(...realData), Math.min(...realData), sensorInfo)
                                sendPayload(MQTTClientInstance, environment._id, sensorInfo.concentrator, sensorInfo.rtu, sensorInfo.type, Date.now(), thresholds.activation.max, thresholds.activation.min, realData.join(','))
                            }
                            break;
                        case 3:
                            data = data.join('').match(/.{1,4}/g)
                            if (data) {
                                var realData = []
                                data.map((hex) => {
                                    if (hex.length === 4) {
                                        buffer.setUint32(0, '0x' + hex)
                                        const result = Math.round((buffer.getInt32(0) + Number.EPSILON) * precision) / precision
                                        if (result || result === 0) {
                                            realData.push((result * thresholds.gain.first) + thresholds.offset.first)
                                        }
                                    }
                                })
                                realData = realData[0]
                                // thresholdTrigger(realData, realData, sensorInfo)
                                sendPayload(MQTTClientInstance, environment._id, sensorInfo.concentrator, sensorInfo.rtu, sensorInfo.type, Date.now(), thresholds.activation.max, thresholds.activation.min, realData)
                            }
                            break;
                        case 6:
                            data = data.join('').match(/.{1,8}/g)
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
                                realData = realData.splice(0, 49)
                                // thresholdTrigger(Math.max(...realData), Math.min(...realData), sensorInfo)
                                sendPayload(MQTTClientInstance, environment._id, sensorInfo.concentrator, sensorInfo.rtu, sensorInfo.type, Date.now(), thresholds.activation.max, thresholds.activation.min, realData.join(','))
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }).catch((reason) => console.error(path, reason.code, 'Skipping current data'))
    })
}

const eodListener = async () => {
    fs.appendFile('log.csv', new Date().toISOString() + ',System Startup\n', (error) => error ? console.error(error) : '')
    const initiationDate = new Date().getDate()
    setInterval(() => {
        const currentDate = new Date()
        if (initiationDate !== currentDate.getDate()) {
            fs.appendFile('log.csv', currentDate.toISOString() + ',System termination\n', (error) => error ? console.error(error) : process.exit(0))
        }
    }, 1000);
}

const connectionListener = async () => {
    setInterval(() => {
        require('dns').resolve('broker.jembatanku.com', (error) => {
            if (error) {
                fs.appendFile('log.csv', new Date().toISOString() + ',Internet connection failed\n', (error) => error ? console.error(error) : process.exit(0))
            }
        })
    }, 10000);
}

require('dns').resolve('broker.jembatanku.com', (error) => {
    if (error) {
        console.error('No internet connection. Terminating in 3 seconds...')
        setTimeout(() => {
            fs.appendFile('log.csv', new Date().toISOString() + ',Internet connection failed\n', (error) => error ? console.error(error) : process.exit(0))
        }, 3000);
    } else {
        (async () => {
            console.log("Connected to the internet.");
            eodListener();
            connectionListener();
            console.log('Fetching bridge data...');
            RRF.Collection('bridge').Where(environment._id).Once().then((data) => {
                console.log('Bridge data fetched.');
                snapshotProcessor(data)
                console.log('Fetching threshold data...');
                RRF.Collection('threshold').Where(bridgeData.thresholdRef).Once().then((threshold) => {
                    console.log('Threshold data fetched.');
                    thresholdProcessor(threshold)
                    RRF.Collection('bridge').Where(environment._id).Stream().on('snapshot', (snapshotBridge) => {
                        snapshotProcessor(snapshotBridge)
                    })
                    RRF.Collection('threshold').Where(bridgeData.thresholdRef).Stream().on('snapshot', (snapshotThreshold) => {
                        thresholdProcessor(snapshotThreshold)
                    })
                    var processHolder = []
                    console.log('Scanning active serial ports...')
                    SerialPort.list().then(ports => {
                        if (ports.length > 0) {
                            ports.forEach((port) => {
                                if ((port.path.includes('USB') || port.path.includes('COM')) && port.path) {
                                    processHolder.push(rtuHandler(port.path))
                                }
                            })
                            if (processHolder.length === 0) {
                                console.error('No active serial (USB/COM) ports found. Terminating in 3 seconds...')
                                setTimeout(() => {
                                    fs.appendFile('log.csv', new Date().toISOString() + ',No active ports found\n', (error) => error ? console.error(error) : process.exit(0))
                                }, 3000);
                            }
                        } else {
                            console.error('No active serial (USB/COM) ports found. Terminating in 3 seconds...')
                            setTimeout(() => {
                                fs.appendFile('log.csv', new Date().toISOString() + ',No active ports found\n', (error) => error ? console.error(error) : process.exit(0))
                            }, 3000);
                        }
                    })
                }).catch(() => {
                    setTimeout(() => {
                        fs.appendFile('log.csv', new Date().toISOString() + ',Data fetch error.\n', (error) => error ? console.error(error) : process.exit(0))
                    }, 3000);
                })
            }).catch(() => {
                setTimeout(() => {
                    fs.appendFile('log.csv', new Date().toISOString() + ',Data fetch error.\n', (error) => error ? console.error(error) : process.exit(0))
                }, 3000);
            })
        })();
    }
});