var SerialPort = require('serialport'),
    port = new SerialPort('/dev/ttyACM0', {
        baudRate: 9600,
        parser: SerialPort.parsers.readline('\r\n')
    });

port.on('open', () =>
    setInterval(() =>
        port.write('Test\r'), 1000));
        
port.on('data', console.log);