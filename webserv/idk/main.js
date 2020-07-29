// ESM syntax is supported.
import SerialPort from 'serialport'
import { StringStream } from 'scramjet'
import mqtt from 'mqtt';
import env from './env.json'
import admin from 'firebase-admin'
const client = mqtt.connect('ws://103.146.202.75:8083')

admin.initializeApp({
    credential: admin.credential.cert(env.adminService),
    databaseURL: env.databaseURL,
})
const db = admin.database()

var rtu_data = {
  
}

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
                                // console.log(temp);
                                var value = temp.join('').match(/.{1,8}/g)
                                console.log('RTU' + RTUId, timestamp, 'length of data: ', value.length)
                                var realData = undefined
                                switch (RTUId) {
                                    case '01':
                                        if (value.length >= 100) {
                                            realData = value.splice(0, 100).map((hex) => {
                                                buffer.setUint32(0, '0x' + hex)
                                                return Math.round((buffer.getFloat32(0) + Number.EPSILON) * 100) / 100
                                            })
                                            console.log('RTU' + RTUId, timestamp, realData.join(','))
                                            client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                            rtu_data['ACC_1'] = realData
                                        } else {
                                            console.log('RTU' + RTUId, timestamp, 'Data error! Either sendToWait failed or no reply on either X or Y.')
                                        }
                                        break;
                                    case '02':
                                        realData = value.splice(0, 5).map((hex) => {
                                            buffer.setUint32(0, '0x' + hex)
                                            return Math.round((buffer.getFloat32(0) + Number.EPSILON) * 100) / 100
                                        })
                                        console.log('RTU' + RTUId, timestamp, realData)
                                        client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        rtu_data['GYRO_1'] = realData
                                        break;
                                    case '03':
                                        var WIAN = temp.join('').match(/.{1,4}/g).splice(0, 3)
                                        // console.log('WIAN: ', WIAN);
                                        var ANJING = new DataView(new ArrayBuffer(4))
                                        realData = WIAN.map((hex) => {
                                            if (hex.length === 4) {
                                                ANJING.setUint16(0, '0x' + hex)
                                                const result = Math.round((ANJING.getInt16(0) + Number.EPSILON) * 100) / 100
                                                if (typeof result !== 'undefined') {
                                                    return result
                                                }
                                            }
                                        })
                                        console.log('RTU' + RTUId, timestamp, realData)
                                        client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        rtu_data['TEMP'] = realData[0]
                                        rtu_data['DISPLACEMENT'] = realData[1]
                                        rtu_data['HUMIDITY'] = realData[2]
                                        break;
                                    case '04':
                                        realData = value.splice(0, 1).map((hex) => {
                                            buffer.setUint32(0, '0x' + hex)
                                            return Math.round((buffer.getFloat32(0) + Number.EPSILON) * 100) / 100
                                        })
                                        console.log('RTU' + RTUId, timestamp, realData)
                                        client.publish('RTU/' + RTUId, timestamp + ',' + realData.join(','))
                                        rtu_data['STRAIN'] = realData
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                        // db.ref('MQTT/' + env.bridgeId + '/concentrator_1/' + timestamp).set(rtu_data, (error) => {
                        //     if (error) {
                        //         console.log(error)
                        //     } else {
                        //         console.log('Pushed to databse!')
                        //     }
                        // })
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
