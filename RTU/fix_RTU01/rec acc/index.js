const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM14');
const parser = new Readline();
const  fs = require('fs');

let log_type_1 = 'save-LOG_.csv';
log_type_1 = log_type_1.split('.').join('-' + Date.now() + '.');

port.pipe(parser)
const now = new Date().toISOString()
function record(){
parser.on('data', function (data) {
 
    const combine = new Date().toISOString()+","+data
    console.log(combine)
    logger.write(combine)
});
}
setInterval(record,5000)

var logger = fs.createWriteStream('E:\\Werk\\gitProj\\bigone\\RTU\\fix_RTU01\\rec acc\\type_1\\'+log_type_1)
