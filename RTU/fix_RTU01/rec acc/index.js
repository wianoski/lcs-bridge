const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM4');
const parser = new Readline();
const fs = require('fs');

let log_type_1 = 'save-LOG_.csv';
log_type_1 = log_type_1.split('.').join('-' + Date.now() + '.');

port.pipe(parser)
const now = new Date().toISOString()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function demo() {
    console.log('Taking a break...');
    await sleep(5000);
    console.log('Two seconds later, showing sleep in a loop...');

    // Sleep in loop
    // for (let i = 0; i < 200; i++) {
    parser.on('data', async function (data) {

        const combine = new Date().toISOString() + "," + data
        
        await sleep(5000);
        console.log(combine)
        logger.write(combine)
    });
    // console.log(i);
    // }
}


demo()

var logger = fs.createWriteStream('E:\\Werk\\gitProj\\bigone\\RTU\\fix_RTU01\\rec acc\\type_1\\' + log_type_1)