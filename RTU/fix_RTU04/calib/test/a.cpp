#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1

float y1 = 0.0; // calibrated mass to be added
long x1 = 0L;
long x0 = 0L;
float avg_size = 10.0; // amount of averages for each mass measurement

HX711 hx711;


void setup() {
  Serial.begin(9600); // prepare serial port
  hx711.begin(DOUT, SCK_OUT);
  delay(1000); // allow load cell and hx711 to settle
  // tare procedure
  for (int ii=0;ii<int(avg_size);ii++){
    delay(10);
    x0+=hx711.read();
  }
  x0/=long(avg_size);
  Serial.println("Add Calibrated Mass");
  // calibration procedure (mass should be added equal to y1)
  int ii = 1;
  while(true){
    if (hx711.read()<x0 + 100){
    } else {
      ii++;
      delay(2000);
      for (int jj=0;jj<int(avg_size);jj++){
        x1+=hx711.read();
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
    reading+=hx711.read();
  }
  reading/=long(avg_size);
  // calculating mass based on calibration and linear fit
  float ratio_1 = (float) (reading-x0);
  float ratio_2 = (float) (x1-x0);
  float ratio = ratio_1/ratio_2;
  float mass = y1*ratio;
  Serial.print("Raw: ");
  Serial.print(reading);
  Serial.print(", ");
  Serial.println(mass);
}