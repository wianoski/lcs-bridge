const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM14');
const parser = new Readline();
const  fs = require('fs');

port.pipe(parser)

parser.on('data', function (data) {
 
    const combine = new Date().toISOString()+","+data
    console.log(combine)
    logger.write(combine)
});


var logger = fs.createWriteStream('save-LOG_4.csv', {
	flags: 'a'
});

let result;
function parsingRAWData(data,delimiter){
	result = data.toString().replace(/(\r\n|\n|\r)/gm,"").split(delimiter);

	return result;
}