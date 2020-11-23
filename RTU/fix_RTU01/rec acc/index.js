const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM14');
const parser = new Readline();
const fs = require('fs');

let log_type_1 = 'save-LOG_.csv';
log_type_1 = log_type_1.split('.').join('-' + Date.now() + '.');

port.pipe(parser)
console.log('Two seconds later, showing sleep in a loop...');

// Sleep in loop
// for (let i = 0; i < 200; i++) {
parser.on('data', (data) =>{

    const combine = new Date().toISOString() + "," + data

    console.log(combine)
    logger.write(combine)
});
// console.log(i);
// }


var logger = fs.createWriteStream('E:\\Werk\\gitProj\\bigone\\RTU\\fix_RTU01\\rec acc\\type_2\\' + log_type_1)