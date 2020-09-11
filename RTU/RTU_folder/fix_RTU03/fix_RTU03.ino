// 08/07/2020
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
//#define RF95_FREQ 413.0
#define RF95_FREQ 412.0

#define CLIENT_ADDRESS 12
#define SERVER_ADDRESS 2

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
uint8_t RTU_ID = 3;
uint8_t Packet_No = 1;

#define LED_PIN 13
bool blinkState = false;

const int MPU_addr = 0x68;

uint8_t data[63]; //203 bytes
//uint8_t data[7]; //203 bytes
uint8_t buf[20]; //Promini

String Gateway_Command1 = String("REQ_RTU02_1");
String Gateway_Command2 = String("REQ_HEALTH_02");


String tempString = "-0.12";

int i = 0; //for loop increment variable
int j = 0;
int value;
char temp[10];

#define numberOfTests   100

//#define VBATPIN A9
#define VBATPIN A0 //(Promini)
int16_t measuredvbat;
//float measuredvbat;
//
//#define DHTPIN 5
//#include "DHT.h"
//#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
//DHT dht(DHTPIN, DHTTYPE);


#include <OneWire.h>
#include <DallasTemperature.h>

// Data wire is plugged into pin 2 on the Arduino
#define ONE_WIRE_BUS 5
// Setup a oneWire instance to communicate with any OneWire devices (not just Maxim/Dallas temperature ICs)
OneWire oneWire(ONE_WIRE_BUS);
// Pass our oneWire reference to Dallas Temperature.
DallasTemperature sensors(&oneWire);
//
//
//#define disp 7
//long distance ;
//long duration;

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


  sensors.begin();
//  delay(100);
//  Serial.println(F("DHTxx test!"));
//
//  dht.begin();
  // initialize device
//  pinMode(disp, INPUT);
  ////////////////////////////////////////////////////////////////////////////////////////

  // configure Arduino LED pin for output
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("RTU03 Ready");

  // manual reset
  digitalWrite(RFM95_RST, LOW);
  delay(10);
  digitalWrite(RFM95_RST, HIGH);
  delay(10);

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

  if (manager.available())
  {
    uint8_t len = sizeof(buf);
    uint8_t from;
    if (manager.recvfromAck(buf, &len, &from))
    {
      //      duration = pulseIn(disp, HIGH);
      //      distance = duration;
      //      long h = dht.readHumidity();
      //      // Read temperature as Celsius (the default)
      //      long t = dht.readTemperature();

      sensors.requestTemperatures();
      long sns = sensors.getTempCByIndex(0);
      //      if (isnan(h) || isnan(t)) {
      //        Serial.println(F("Failed to read from DHT sensor!"));
      //        return;
      //      }
      /////////////////////////////////// Sending Packet1 ///////////////////////////////////////
      if (Gateway_Command1 == (char*)buf) {
        j = 0;
        /////////////////////////////////// Set Header ///////////////////////////////////////
        data[j] = Gateway_ID;
        j++;
        data[j] = RTU_ID;
        j++;
        data[j] = Packet_No;
        j++;
        /////////////////////////////////// Sending Check Battery ///////////////////////////////////////
        measuredvbat = analogRead(VBATPIN);
        measuredvbat *= 2; // we divided by 2, so multiply back
        measuredvbat *= 3.3; // Multiply by 3.3V, our reference voltage
        measuredvbat /= 1024; // convert to voltage
        //Measure 50 ax and 50 ay
        for (i = 0; i < 10; i++) {
          /////////////////////////////////// Get Gyro Data ///////////////////////////////////////
          //for RTU01

          //          Serial.println(h);
          //          Serial.println(t);
          data[j] = highByte(sns);
          j++;
          data[j] = lowByte(sns);
          j++;
          //          data[j] = highByte(distance);
          //          j++;
          //          data[j] = lowByte(distance);
          //          j++;
          //          data[j] = highByte(h);
          //          j++;
          //          data[j] = lowByte(h);
          //          j++;
        }

        //verifiation data[] content
        for (i = 0; i < j; i++) {
          Serial.write(data[i]);
        }

        //Serial.println();
        //Serial.println(j);
        // Send a reply data to the Server
        if (!manager.sendtoWait(data, sizeof(data), from)) {
          //if (!manager.sendtoWait(data, j, from)){
          Serial.println("sendtoWait failed");
        }
      }
      /////////////////////////////////// Sending Packet1 ///////////////////////////////////////
      if (Gateway_Command2 == (char*)buf) {
        j = 0;
        /////////////////////////////////// Set Header ///////////////////////////////////////
        data[j] = Gateway_ID;
        j++;
        data[j] = RTU_ID;
        j++;
        data[j] = Packet_No;
        j++;
        /////////////////////////////////// Sending Check Battery ///////////////////////////////////////
        measuredvbat = analogRead(VBATPIN);
        measuredvbat *= 2; // we divided by 2, so multiply back
        measuredvbat *= 3.3; // Multiply by 3.3V, our reference voltage
        measuredvbat /= 1024; // convert to voltage

        long rssiResult = driver.lastRssi();
        //Measure 50 ax and 50 ay
        result = {rssiResult};
        uint16_t loWord = result.w[0];
        uint16_t hiWord = result.w[1];

        data[j] = highByte(measuredvbat);
        j++;
        data[j] = lowByte(measuredvbat);
        j++;
        data[j] = highByte(hiWord);
        j++;
        data[j] = lowByte(loWord);
        j++;
        //        data[j] = highByte(rssiResult);
        //        j++;
        //        data[j] = lowByte(rssiResult);
        //        j++;


        //verifiation data[] content
        for (i = 0; i < j; i++) {
          Serial.write(data[i]);
        }

        //Serial.println();
        //Serial.println(j);
        // Send a reply data to the Server
        if (!manager.sendtoWait(data, sizeof(data), from)) {
          //if (!manager.sendtoWait(data, j, from)){
          Serial.println("sendtoWait failed");
        }
      }
    }
  }
  //  delay (500);
}

///////////////////////////////////////////////////// RTC Functions //////////////////////////////////////////////////
//print date and time to Serial
//void printDateTime(time_t t)
//{
//    printDate(t);
//    Serial << ' ';
//    printTime(t);
//}
//
////print time to Serial
//void printTime(time_t t)
//{
//    printI00(hour(t), ':');
//    printI00(minute(t), ':');
//    printI00(second(t), ' ');
//}
//
////print date to Serial
//void printDate(time_t t)
//{
//    printI00(day(t), 0);
//    Serial << monthShortStr(month(t)) << _DEC(year(t));
//}

//Print an integer in "00" format (with leading zero),
//followed by a delimiter character to Serial.
//Input value assumed to be between 0 and 99.
void printI00(int val, char delim)
{
  if (val < 10) Serial << '0';
  Serial << _DEC(val);
  if (delim > 0) Serial << delim;
  return;
}
