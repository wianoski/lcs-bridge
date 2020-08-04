#include <Arduino.h>
#include <Wire.h>             //http://arduino.cc/en/Reference/Wire

#define SCK_OUT A2
#define DOUT A1

/* This program takes 10 samples from LC + HX711B at
   1-sec interval and then computes the average.*/

unsigned long x = 0, y = 0;
float res = 0;
unsigned long dataArray[10];
int j = 0;
void setup()
{
  Serial.begin(9600);
  pinMode(DOUT, INPUT); //data line  //Yellow cable
  pinMode(SCK_OUT, OUTPUT);  //SCK line  //Orange cable
}


void clk()
{
  digitalWrite(SCK_OUT, HIGH);
  digitalWrite(SCK_OUT, LOW);
}
void loop(){

    digitalWrite(A0, LOW);//SCK is made LL
    // while (digitalRead(DOUT) != LOW){ //wait until Data Line goes LOW
      for (int i = 0; i < 24; i++){  //read 24-bit data from HX711
      
        clk();      //generate CLK pulse to get MSB-it at DOUT-pin
        bitWrite(x, 0, digitalRead(DOUT));
        x = x << 1;
      }
      clk();  //25th pulse
      res = x * 0.000001;
      Serial.println(res);
      y = x;
      x = 0;
      delay(100);
    // }
    dataArray[j] = y;
  

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
