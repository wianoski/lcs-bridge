#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1

HX711 scale;

void setup() {
  Serial.begin(9600);
  scale.begin(DOUT, SCK_OUT);
}

float reading;
void loop() {
  for (int i = 0; i < 100; i++) {
    //    data[j] = highByte(hiWord);
    //    j++;
    //    data[j] = hiWord;
    //    j++;
    //    data[j] = highByte(loWord);
    //    j++;
    //    data[j] = loWord;
    //    j++;
    reading = (scale.read()*0.001)*-1;
    Serial.print(reading);
    delay(1);
    // hasil = {reading};
    // uint16_t loWord = hasil.w[0];
    // uint16_t hiWord = hasil.w[1];
    // Serial.print(hiWord, HEX);
    // Serial.println(loWord, HEX);


    Serial.println();
  }

}