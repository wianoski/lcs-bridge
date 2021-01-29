const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM5', {
    baudRate: 57600
});
// const port = new SerialPort('COM14');
const parser = new Readline();
const fs = require('fs');
const { setInterval } = require('timers');

let log_type_1 = 'save-LOG_.csv';
log_type_1 = log_type_1.split('.').join('-' + Date.now() + '.');

port.pipe(parser)

// -------------sesi koneksi ke arduino--------
port.on('open', () => {
    let timeOut = 10000;
    setInterval(() => {
        // body
        port.write('REQ_RTU02,1\r\n', (err) => {
            if (err)
                console.log(err);
        })
    }, timeOut)
}); //-----------Sesi selesai--------------------

parser.on('data', (data) => {

    const combine = new Date().toISOString() + "," + data
    console.log(combine)
    logger.write(combine)
});

var logger = fs.createWriteStream('E:\\Werk\\gitProj\\bigone\\RTU\\fix_RTU01\\rec acc\\strain\\' + log_type_1)