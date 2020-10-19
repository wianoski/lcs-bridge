#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1

float y1 = 20.0; // calibrated mass to be added
long x1 = 0L;
long x0 = 0L;
float avg_size = 25.0; // amount of averages for each mass measurement

HX711 hx711;


void setup() {
  Serial.begin(9600); // prepare serial port
  delay(1000); // allow load cell and hx711 to settle
  hx711.begin(DOUT, SCK_OUT);
  // tare procedure
  for (int ii=0;ii<int(avg_size);ii++){
    delay(10);
    x0+=hx711.read()*0.001;
  }
  x0/=long(avg_size);
  Serial.print("Tare result: ");
  Serial.println(x0);
 
}
long  temp1 = 0,
      temp2 = 0,
      difference = 0;
void loop() {
  // averaging reading
  long reading = 0;
  for (int jj=0;jj<int(avg_size);jj++){
    reading+=hx711.read()*0.001;
    
  }
  reading/=long(avg_size);
  temp2 = temp1;
  temp1 = reading;
  
  difference = (temp2 - reading) * -1;

  Serial.print("First: ");
  Serial.print(reading);
  Serial.print(", ");
  Serial.print("Temp: ");
  Serial.print(temp2);
  Serial.print(" difference: ");
  Serial.println(difference);
  delay(100);
}