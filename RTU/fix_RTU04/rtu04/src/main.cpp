#include <Arduino.h>
#include <Wire.h>             //http://arduino.cc/en/Reference/Wire
#include <HX711.h>

#define SCK_OUT A2
#define DOUT A1
HX711  scale;
/* This program takes 10 samples from LC + HX711B at
   1-sec interval and then computes the average.*/

unsigned long x = 0, y = 0; //x is gauge factor, is the ratio between the change
                            // in resistance (ΔR / R) to the Strain value
float res = 0;
unsigned long dataArray[10];
int j = 0;
void setup()
{
  Serial.begin(9600);
  // pinMode(DOUT, INPUT); //data line  //Yellow cable
  // pinMode(SCK_OUT, OUTPUT);  //SCK line  //Orange cable
  scale.begin(DOUT, SCK_OUT);
}


float deltaL = 1.2;
float L = 1.2;


void clk()
{
  digitalWrite(SCK_OUT, HIGH);
  digitalWrite(SCK_OUT, LOW);
}

long value_gain, value_offset = 0;
long result = 0;



void loop(){

    // digitalWrite(A0, LOW);//SCK is made LL
    // // while (digitalRead(DOUT) != LOW){ //wait until Data Line goes LOW
    //   for (int i = 0; i < 24; i++){  //read 24-bit data from HX711
      
    //     clk();      //generate CLK pulse to get MSB-it at DOUT-pin
    //     bitWrite(x, 0, digitalRead(DOUT));
    //     x = x << 1;
    //   }
    //   clk();  //25th pulse
    //   res = x * 0.000001;
    //   Serial.println(x/120);
    //   y = x;
    //   x = 0;
    //   delay(100);
    // // }
    // dataArray[j] = y;
  
  // 'Firmware yg Wian buat harus bisa dimasukkan parameter oleh penguji (
  // calibration factor: nilai_gain dan nilai_offset, 
  // agar didapat nilai_akhir = (nilai_baca_sensor * nilai_gain) + nilai_offset). 
  // Kita butuhkan calibration factor tadi. 
  // Jadi ada 2 strain gage yg dikirim, 1 utk reference, 1 utk dimasukkan calibration factor.'

    long reading = scale.read();
    // Serial.println(reading);

    value_gain = Serial.read();
    value_offset = Serial.read();

    result = (reading * value_gain) + value_offset;
    Serial.println(result);
    // delay(100);
  // Serial.println("===averaging process=========");
  // unsigned long sum = 0;

  // for (j = 0; j < 10; j++)
  // {
  //   sum += dataArray[j];
  // }
  // Serial.print("Average Count = ");
  // sum = sum / 10;
  // Serial.println(sum);
}
