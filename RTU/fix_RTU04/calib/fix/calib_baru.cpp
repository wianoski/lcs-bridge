#include "HX711.h"
 
// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = A1;
const int LOADCELL_SCK_PIN = A2;
double vo, x1, x2, x3, x4, x5, x6, x7;
 
HX711 scale;


void auto_calb(){
    
}

void setup() {
  Serial.begin(57600);
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
}


float voltage_in = 3.15,
      resistor_Value = 120.4,
      resolution_Value = 0.187754631, // dapat dari resolusi vin / 2^24
      res_val = 1000000,
      zeroing = 95.42;


void loop() {
  if (scale.is_ready()) {
    long reading = scale.read() * -1.0;
    vo = (reading * (0.187754631 / 1000000.0));
    x1 = ((vo / 3.15) + 0.5);
    x2 = (120.4 * x1);
    x3 = (1 - x1);
    x4 = (x2 / x3);
    x5 = (x4 - 95.42);

    //Ini merupakan nilai microstrain
    x6 = 26.82 * x5 + 4.4884;
    //Serial.print("HX711 reading: ");
    Serial.println(x6);
  } else {
    //Serial.println("HX711 not found.");
  }
delay(10);
}
