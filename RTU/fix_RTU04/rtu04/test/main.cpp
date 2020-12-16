#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1

HX711 scale;

void setup() {
  Serial.begin(9600);
  scale.begin(DOUT, SCK_OUT);
}

void loop() {

  if (scale.is_ready()) {
    long reading = scale.read();
    Serial.print("HX711 reading: ");
    Serial.println(reading);
  } else {
    Serial.println("HX711 not found.");
  }

  delay(1000);
  
}