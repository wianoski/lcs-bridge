#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1

float y1 = 2000.0; // calibrated factor to be added
long x1 = 0L;
long x0 = 0L;
float avg_size = 10.0; // amount of averages for each factor measurement

HX711 hx711;


void setup() {
  Serial.begin(9600); // prepare serial port
  hx711.begin(DOUT, SCK_OUT);
  delay(1000); // allow load cell and hx711 to settle
  // tare procedure
  for (int ii=0;ii<int(avg_size);ii++){
    delay(10);
    x0+=hx711.read()*0.001;
  }
  x0/=long(avg_size);
  Serial.println("Add Calibrated factor");
  // calibration procedure (factor should be added equal to y1)
  int ii = 1;
  while(true){
    if ((hx711.read()*0.001)<x0 + 100){
    } else {
      ii++;
      delay(2000);
      for (int jj=0;jj<int(avg_size);jj++){
        x1+=hx711.read()*0.001;
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
    reading+=hx711.read()*0.001;
  }
  reading/=long(avg_size);
  // calculating factor based on calibration and linear fit
  float ratio_1 = (float) (reading-x0);
  float ratio_2 = (float) (x1-x0);
  float ratio = ratio_1/ratio_2;
  float factor = y1*ratio;
  Serial.print(reading);
  Serial.print(",");
  Serial.println(factor);
}