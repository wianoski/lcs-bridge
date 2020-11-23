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

int16_t AcX, AcY, AcZ, Tmp, GyX, GyY, GyZ; //16-bit integers
int AcXcal, AcYcal, AcZcal, GyXcal, GyYcal, GyZcal, tcal; //calibration variables
float t, tx, tf, pitch, roll;

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

const int MPU = 0x68; //I2C address of the MPU-6050

//function to convert accelerometer values into pitch and roll
void getAngle(int Ax, int Ay, int Az)
{
  double x = Ax;
  double y = Ay;
  double z = Az;
  pitch = atan(x / sqrt((y * y) + (z * z))); //pitch calculation
  roll = atan(y / sqrt((x * x) + (z * z))); //roll calculation</p><p>    //converting radians into degrees
  pitch = pitch * (180.0 / 3.14);
  roll = roll * (180.0 / 3.14) ;
}

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
  Wire.beginTransmission(MPU);                 //begin, send the slave adress (in this case 68)
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
union cracked_float_t {
  float f;
  uint32_t l;
  word w[sizeof(float) / sizeof(word)];
  byte b[sizeof(float)];
};
cracked_float_t result;
void loop()
{
  Wire.beginTransmission(MPU);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU, 14, true); //get six bytes accelerometer data

  AcXcal = -950;
  AcYcal = -300;
  AcZcal = 0;    //Temperature correction
  tcal = -1600;   //Gyro correction
  GyXcal = 480;
  GyYcal = 170;
  GyZcal = 210;   //read accelerometer data
  AcX = Wire.read() << 8 | Wire.read(); // 0x3B (ACCEL_XOUT_H) 0x3C (ACCEL_XOUT_L)
  AcY = Wire.read() << 8 | Wire.read(); // 0x3D (ACCEL_YOUT_H) 0x3E (ACCEL_YOUT_L)
  AcZ = Wire.read() << 8 | Wire.read(); // 0x3F (ACCEL_ZOUT_H) 0x40 (ACCEL_ZOUT_L)

  //read temperature data
  Tmp = Wire.read() << 8 | Wire.read(); // 0x41 (TEMP_OUT_H) 0x42 (TEMP_OUT_L)

  //read gyroscope data
  GyX = Wire.read() << 8 | Wire.read(); // 0x43 (GYRO_XOUT_H) 0x44 (GYRO_XOUT_L)
  GyY = Wire.read() << 8 | Wire.read(); // 0x45 (GYRO_YOUT_H) 0x46 (GYRO_YOUT_L)
  GyZ = Wire.read() << 8 | Wire.read(); // 0x47 (GYRO_ZOUT_H) 0x48 (GYRO_ZOUT_L) </p><p>    //temperature calculation
  tx = Tmp + tcal;
  t = tx / 340 + 36.53; //equation for temperature in degrees C from datasheet
  tf = (t * 9 / 5) + 32; //fahrenheit</p><p>    //get pitch/roll
  getAngle(AcX, AcY, AcZ);


  //   if (manager.available())
  //   {


  //    Serial.print("AngleX= ");
  //    Serial.println(x);
  // Wait for a message addressed to us from the client
  uint8_t len = sizeof(buf);
  uint8_t from;
  // if (manager.recvfromAck(buf, &len, &from))
  // {
  Serial.println((char*)buf);
  /////////////////////////////////// Sending Packet1 ///////////////////////////////////////
  // if (Gateway_Command1 == (char*)buf) {
  j = 0;
  /////////////////////////////////// Set Header ///////////////////////////////////////
  // data[j] = Gateway_ID;
  // j++;
  // data[j] = RTU_ID;
  // j++;
  // data[j] = Packet_No;
  // j++;
  /////////////////////////////////// Sending Check Battery ///////////////////////////////////////
  measuredvbat = analogRead(VBATPIN);
  measuredvbat *= 2; // we divided by 2, so multiply back
  measuredvbat *= 3.3; // Multiply by 3.3V, our reference voltage
  measuredvbat /= 1024; // convert to voltage

  //Measure 50 ax and 50 ay
  for (i = 0; i < 3; i++) {
    /////////////////////////////////// Get Gyro Data ///////////////////////////////////////

    //          Serial.print("roll = ");
    Serial.println(roll);

    //for RTU01

    result = {roll};
    uint16_t loWord = result.w[0];
    uint16_t hiWord = result.w[1];

    data[j] = highByte(hiWord);
    j++;
    data[j] = lowByte(loWord);
    j++;
    
    delay (500);
  }

  //verifiation data[] content
  for (i = 0; i < j; i++) {
    Serial.print(data[i]);
    
    delay (500);
  }
}