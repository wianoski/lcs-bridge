#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1
#define NoT 100

float y1 = 200; // calibrated factor to be added
long x1 = 0L;
long x0 = 0L;
float avg_size = 10.0; // amount of averages for each factor measurement
float read_off,read_here = 0;

HX711 hx711;


void setup() {
Serial.begin(9600); // prepare serial port
hx711.begin(DOUT, SCK_OUT);
delay(1000); // allow load cell and hx711 to settle
// tare procedure
for (int ii=0;ii<int(avg_size);ii++){
  delay(10);
  x0+=(hx711.read()*-1)*0.01;
}
x0/=long(avg_size);
Serial.println("Add Calibrated factor");
///////////////////////////////////// Calibration Offset MPU6050 ////////////////////////////////////
for (int i = 0; i < NoT; i++) {
  read_here = (hx711.read()*-1)*0.01;
  read_off += read_here;

  delay(25);
}
Serial.println(read_off);
// calibration procedure (factor should be added equal to y1)
int ii = 1;
while(true){
  if (read_off<x0 + 10){
  } else {
    ii++;
    delay(2000);
    for (int jj=0;jj<int(avg_size);jj++){
      x1+=read_off;
    }
    x1/=long(avg_size);
    break;
  }
}
Serial.println("Calibration Complete");
}

void loop() {
// averaging reading
long reading = 0;
for (int jj=0;jj<int(avg_size);jj++){
  reading+=(hx711.read()*-1)*0.01;
}
reading/=long(avg_size);
// calculating factor based on calibration and linear fit
float ratio_1 = (float) (reading-x0);
float ratio_2 = (float) (x1-x0);
float ratio = ratio_1/ratio_2;
float factor = ((y1*ratio)+0)*1000;
Serial.print("Raw: ");
Serial.print(reading);
Serial.print(", ");
Serial.println(factor);
}