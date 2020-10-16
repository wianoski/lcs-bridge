#include <Arduino.h>

// 02/07/2020
// RTU01   : COM6
// Accelero: +/- 2g
// 500MHz

#include <Streaming.h>
//#include <Time.h>
//#include <TimeLib.h>
//#include <DS3232RTC.h>        //http://github.com/JChristensen/DS3232RTC
#include <Streaming.h>        //http://arduiniana.org/libraries/streaming/
#include <Wire.h>             //http://arduino.cc/en/Reference/Wire

// I2Cdev and MPU6050 must be installed as libraries, or else the .cpp/.h files
// for both classes must be in the include path of your project
#include "I2Cdev.h"
#include "MPU6050.h"

// Arduino Wire library is required if I2Cdev I2CDEV_ARDUINO_WIRE implementation
// is used in I2Cdev.h
#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
#include "Wire.h"
#endif

// class default I2C address is 0x68
// specific I2C addresses may be passed as a parameter here
// AD0 low = 0x68 (default for InvenSense evaluation board)
// AD0 high = 0x69
MPU6050 accelgyro;
//MPU6050 accelgyro(0x69); // <-- use for AD0 high (if RTC exist)

int16_t ax, ay, az;
int16_t gx, gy, gz;

int16_t AcX, AcY, AcZ, Tmp, GyX, GyY, GyZ;

int minVal = 265;
int maxVal = 402;

float   AXoff, AYoff, AZoff; //accelerometer offset values
float   GXoff, GYoff, GZoff; //gyroscope offset values

float   AX, AY, AZ; //acceleration floats
float   GX, GY, GZ; //gyroscope floats

#define LED_PIN 13
bool blinkState = false;

const int MPU_addr = 0x68;

uint8_t data[50]; //203 bytes
uint8_t buf[20]; //Promini


String tempString = "-0.12";

int i = 0; //for loop increment variable
int j = 0;
int value;
char temp[10];

#define numberOfTests   100

//#define VBATPIN A9
#define VBATPIN A0 //(Promini)
float measuredvbat;

const int MPU_addr1 = 0x68;

void setup()
{
  // join I2C bus (I2Cdev library doesn't do this automatically)
#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
  Wire.begin();
#elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
  Fastwire::setup(400, true);
#endif


  Serial.begin(9600);
  delay(100);

  // initialize device
  Serial.println("Initializing Gyro");
  accelgyro.initialize();

  // verify connection
  Serial.println("Testing Gyro connections...");
  Serial.println(accelgyro.testConnection() ? "Gyro connection successful" : "Gyro connection failed");

  //Dilakukan di satu kali, parameter offset dihitung di IPC
  Serial.println("Calibration ACCELERO...");
  ///////////////////////////////////// Calibration Offset MPU6050 ////////////////////////////////////
  for (i = 0; i < numberOfTests; i++) {
    accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    AXoff += ax;
    AYoff += ay;
    AZoff += az;
    GXoff += gx;
    GYoff += gy;
    GZoff += gz;

    delay(25);
  }

  AXoff = AXoff / numberOfTests;
  AYoff = AYoff / numberOfTests;
  AZoff = AZoff / numberOfTests;
  GXoff = GXoff / numberOfTests;
  GYoff = GYoff / numberOfTests;
  GZoff = GZoff / numberOfTests;
  ////////////////////////////////////////////////////////////////////////////////////////

  // configure Arduino LED pin for output
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);



}

void loop()
{
  for (i = 0; i < 128; i++) {
    /////////////////////////////////// Get Gyro Data ///////////////////////////////////////
    //for RTU01
    accelgyro.getAcceleration(&ax, &ay, &az);
    AX = ((float)ax - AXoff) / 16384.00;
    //if sensor pcb placed on table:
    // AY = ((float)ay - AYoff) / 16384.00; //16384 is just 32768/2 to get our 1G value
    //for RTU01
    AY = ((float)ay - (AYoff - 16384)) / 16384.00; //remove 1G before dividing//16384 is just 32768/2 to get our 1G value
    AZ = ((float)az - AZoff) / 16384.00; //remove 1G before dividing
    Serial.print(AX);
    Serial.print(",");
    Serial.println(AZ);
  }



}
