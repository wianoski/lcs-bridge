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

#include <RHReliableDatagram.h>
#include <RH_RF95.h>
#include <SPI.h>

/* for feather32u4 */
#define RFM95_CS 10
#define RFM95_RST 9
#define RFM95_INT 2

// Change to 434.0 or other frequency, must match RX's freq!
#define RF95_FREQ 412.0

#define CLIENT_ADDRESS 12
#define SERVER_ADDRESS 2

// #define CLIENT_ADDRESS 18
// #define SERVER_ADDRESS 8

// Singleton instance of the radio driver
RH_RF95 driver(RFM95_CS, RFM95_INT);

// Class to manage message delivery and receipt, using the driver declared above
RHReliableDatagram manager(driver, CLIENT_ADDRESS);

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

uint8_t Gateway_ID = 1;

// uint8_t RTU_ID = 2;
uint8_t RTU_ID = 8;

uint8_t Packet_No = 1;

#define LED_PIN 13
bool blinkState = false;

const int MPU_addr = 0x68;

uint8_t data[50]; //203 bytes
uint8_t buf[20]; //Promini

String Gateway_Command1 = String("REQ_RTU08_1");
//
// String Gateway_Command1 = String("REQ_RTU08_1");

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

  pinMode(RFM95_RST, OUTPUT);
  digitalWrite(RFM95_RST, HIGH);

  //  while (!Serial);
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


  Serial.println("RTU08 Ready");
  // Serial.println("RTU08 Ready");

  // manual reset
  digitalWrite(RFM95_RST, LOW);
  delay(10);
  digitalWrite(RFM95_RST, HIGH);
  delay(10);

  Wire.begin();                                      //begin the wire communication
  Wire.beginTransmission(MPU_addr1);                 //begin, send the slave adress (in this case 68)
  Wire.write(0x6B);                                  //make the reset (place a 0 into the 6B register)
  Wire.write(0);
  Wire.endTransmission(true);                        //end the transmission

  if (!manager.init())
    Serial.println("init failed");
  // Defaults after init are 434.0MHz, 13dBm, Bw = 125 kHz, Cr = 4/5, Sf = 128chips/symbol, CRC on

  // The default transmitter power is 13dBm, using PA_BOOST.
  // If you are using RFM95/96/97/98 modules which uses the PA_BOOST transmitter pin, then
  // you can set transmitter powers from 5 to 23 dBm:
  //  driver.setTxPower(23, false);
  // If you are using Modtronix inAir4 or inAir9,or any other module which uses the
  // transmitter RFO pins and not the PA_BOOST pins
  // then you can configure the power transmitter power for -1 to 14 dBm and with useRFO true.
  // Failure to do that will result in extremely low transmit powers.
  //  driver.setTxPower(14, true);
  // You can optionally require this module to wait until Channel Activity
  // Detection shows no activity on the channel before transmitting by setting
  // the CAD timeout to non-zero:
  //  driver.setCADTimeout(10000);
}
float xa, ya, za, roll, pitch;
union cracked_float_t {
  float f;
  uint32_t l;
  word w[sizeof(float) / sizeof(word)];
  byte b[sizeof(float)];
};
cracked_float_t result;
void loop()
{
  Wire.beginTransmission(MPU_addr1);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_addr1, 6, true); //get six bytes accelerometer data

  AcX = (Wire.read() << 8 | Wire.read())/131.0; 
  AcY = Wire.read() << 8 | Wire.read(); 
  AcZ = Wire.read() << 8 | Wire.read(); 
  int xAng = map(AcX, minVal, maxVal, -90, 90); 
  int yAng = map(AcY, minVal, maxVal, -90, 90); 
  int zAng = map(AcZ, minVal, maxVal, -90, 90);

  long xax = RAD_TO_DEG * (atan2(-yAng, -zAng) + PI); 
  ya = RAD_TO_DEG * (atan2(-xAng, -zAng) + PI); 
  za = RAD_TO_DEG * (atan2(-yAng, -xAng) + PI);
  Serial.println(xax);
  // xa = (Wire.read() << 8 | Wire.read()) / 131.0; //Gyroscope values in °/s (degree per second)
  // ya = (Wire.read() << 8 | Wire.read()) / 131.0;
  // za = (Wire.read() << 8 | Wire.read()) / 131.0;

  // roll = atan2(ya , za) * 180.0 / PI;
  // //  roll = atan2(ya , za) * 180.0 / PI;
  // pitch = atan2(-xa , sqrt(ya * ya + za * za)) * 180.0 / PI;


  

}
