const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM4');
const parser = new Readline();
const fs = require('fs');

let log_type_1 = 'save-LOG1_.csv';
log_type_1 = log_type_1.split('.').join('-' + Date.now() + '.');

port.pipe(parser)
const now = new Date().toISOString()

var currentDate

parser.on('data', (data) => {
    const combine = new Date().toISOString() + "," + data
    // setInterval(() => {
        logger.write(combine)
        console.log(combine)
    // },3000)
    
});

var logger1 = fs.createWriteStream('E:\\Werk\\gitProj\\bigone\\jembatanku-ipc\\type_1\\' + '_' + log_type_1)