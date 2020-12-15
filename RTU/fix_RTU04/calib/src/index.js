var y1 = 200,
x1 = 0.0,
x0 = 0.0,
avg_size = 10.0,
readOff = 0.0,
readHere = 0.0
reading = 0.0,
NoT = 100

function calibInit(reading){
for (var ii = 1; ii<int(avg_size); ii++) {
    readHere = reading
    readOff += readHere
}
var ii = 1
while(true){
    if(readOff < x0 + 10){

    }else{
        i++
        for (var jj=0;jj<int(avg_size);jj++){
            x1+=read_off;
            }
            x1/=long(avg_size);
        break;
    }
}
for (var jj=0;jj<int(avg_size);jj++){
    reading+=hx711.read()*0.1;
  }
  reading/=long(avg_size);
  // calculating factor based on calibration and linear fit
  var ratio_1 = (float) (reading-x0);
  var ratio_2 = (float) (x1-x0);
  var ratio = ratio_1/ratio_2;
  var factor = ((y1*ratio)+0)*1000;
  console.log(factor);
}
