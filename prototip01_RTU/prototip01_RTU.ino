/// RTU05   : COM3
// Accelero: +/- 2g
// Gyro    : +/- 250 degrees/sec
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
#define RF95_FREQ 434.0

#define CLIENT_ADDRESS 11
#define SERVER_ADDRESS 1

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

float   AXoff, AYoff, AZoff; //accelerometer offset values
float   GXoff, GYoff, GZoff; //gyroscope offset values

float   AX, AY, AZ; //acceleration floats
float   GX, GY, GZ; //gyroscope floats

#define LED_PIN 13
bool blinkState = false;

uint8_t data[RH_RF95_MAX_MESSAGE_LEN]; //251 bytes
// Dont put this on the stack:
//uint8_t buf[RH_RF95_MAX_MESSAGE_LEN]; //251 bytes
uint8_t buf[50]; //Promini
uint8_t bufX[20];
uint8_t bufY[20];

String Server_Command1 = String("REQ_RTU01_1");
String Server_Command2 = String("REQ_RTU01_2");
String Server_Command3 = String("REQ_RTU01_3");
String Server_Command4 = String("REQ_RTU01_4");
String Server_Command5 = String("REQ_RTU01_5");
//String Server_Command6 = String("REQ_RTU01_6");

String tempString = "-0.12";

int i = 0; //for loop increment variable
int j, l = 0;
int value;
char temp[10];

#define numberOfTests   100

//#define VBATPIN A9
#define VBATPIN A0 //(Promini)
float measuredvbat;


uint8_t temps[4];
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

  //setSyncProvider() causes the Time library to synchronize with the
  //external RTC by calling RTC.get() every five minutes by default.
  //  setSyncProvider(RTC.get);
  //  Serial << F("RTC Sync");
  //  if (timeStatus() != timeSet) Serial << F("RTC FAIL");
  //  Serial << endl;

  // initialize device
  Serial.println("Initializing ACC");
  accelgyro.initialize();

  // verify connection
  Serial.println("Testing ACC connections...");
  Serial.println(accelgyro.testConnection() ? "ACC connection successful" : "ACC connection failed");

  Serial.println("Calibration ACC...");
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

  Serial.println("RTU01 Ready");

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


int index_max = 100; //contoh saja
uint8_t buff[100] ;

uint8_t gateway_ID = 0x01;
uint8_t RTU_ID = 0x01;
uint8_t Packet_No = 1;

int akl = 0;
void loop()
{
  //  time_t t;

  if (manager.available())
  {
    buff[akl] = 0x01;
    akl++;
    buff[akl] = 0x01;
    akl++;
    buff[akl] = 1;
    akl++;
    // Wait for a message addressed to us from the client
    uint8_t len = sizeof(buf);
    uint8_t from;

    //    uint8_t data[RH_RF95_MAX_MESSAGE_LEN]; //251 bytes

    //    uint8_t buf[50]; //Promini
    if (manager.recvfromAck(buf, &len, &from))
      //      Serial.println((char*)buf);
    {

      /////////////////////////////////// Sending Packet1 ///////////////////////////////////////
      if (Server_Command1 == (char*)buf) {
        l, j = 0;
        //        memcpy(temps, header, sizeof(header));
        //SEND 20 data

        for (i = 0; i < 50; i++) {
          /////////////////////////////////// Get Accelero Data ///////////////////////////////////////
          accelgyro.getAcceleration(&ax, &ay, &az);
          buff[akl] = highByte(ax); //MSB
          akl++;
          buff[akl] = lowByte(ax); //LSB
          akl++;

          buff[akl] = highByte(ay); //MSB
          akl++;
          buff[akl] = lowByte(ay); //LSB
          akl++;

          for (int a = 0; a < index_max; a++) {
            Serial.write(buff[a]);
          } // liat hasilnya di HEX Doclight


          sprintf(buf, "%d", ax);
          tempString = (char*)buf;
          tempString.trim();
          tempString.toCharArray(buf, tempString.length() + 1);

          j += sprintf(data + j, "%s", buf);
          j += sprintf(data + j, "%c", ',');

          //          dtostrf(lmaoy,5, 2, buf);

          //          uint8_t abc = (uint8_t)(ax >> 8) ;
          //          uint8_t abb = (uint8_t)(ax & 0xFF);
          //          uint8_t ag[2] = {abc, abb};
          //
          //          uint8_t acc = (uint8_t)(ay >> 8) ;
          //          uint8_t acb = (uint8_t)(ay & 0xFF);
          //          uint8_t af[2] = {acc, acb};
          //          l += memcpy(temps, ag, sizeof(ag));
          //          l += memcpy(temps + sizeof(l), af, sizeof(af));

          sprintf(buf, "%d", ay);
          tempString = (char*)buf;
          tempString.trim();
          tempString.toCharArray(buf, tempString.length() + 1);
          j += sprintf(data + j, "%s", buf);
          j += sprintf(data + j, "%c", ',');



        }


        // Send a reply data to the Server
        if (!manager.sendtoWait(buff, sizeof(buff), from)) {
          //          Serial.println((char*)temps);
          Serial.println("au");
        }
      }

      /////////////////////////////////// Sending Packet5 ///////////////////////////////////////
      if (Server_Command2 == (char*)buf) {
        j = 0;
        //SEND 20 data
        for (i = 0; i < 4; i++) {
          /////////////////////////////////// Get Accelero Data ///////////////////////////////////////
          accelgyro.getAcceleration(&ax, &ay, &az);
          buff[akl] = highByte(ax); //MSB
          akl++;
          buff[akl] = lowByte(ax); //LSB
          akl++;

          buff[akl] = highByte(ay); //MSB
          akl++;
          buff[akl] = lowByte(ay); //LSB
          akl++;

          //          for (int a = 0; a < index_max; a++) {
          //            Serial.write(buff[a]);
          //          } // liat hasilnya di HEX Doclight


          sprintf(buf, "%d", ax);
          tempString = (char*)buf;
          tempString.trim();
          tempString.toCharArray(buf, tempString.length() + 1);
          j += sprintf(data + j, "%s", buf);
          j += sprintf(data + j, "%c", ',');

          //          dtostrf(lmaoy,5, 2, buf);

          sprintf(buf, "%d", ay);
          tempString = (char*)buf;
          tempString.trim();
          tempString.toCharArray(buf, tempString.length() + 1);
          j += sprintf(data + j, "%s", buf);
          j += sprintf(data + j, "%c", ',');
        }

        /////////////////////////////////// Get Last row Accelero Data ///////////////////////////////////////
        accelgyro.getAcceleration(&ax, &ay, &az);

        sprintf(buf, "%d", ax);
        tempString = (char*)buf;
        tempString.trim();
        tempString.toCharArray(buf, tempString.length() + 1);
        j += sprintf(data + j, "%s", buf);
        j += sprintf(data + j, "%c", ',');

        //        dtostrf(lmaoy,5, 2, buf);
        sprintf(buf, "%d", ay);
        tempString = (char*)buf;
        tempString.trim();
        tempString.toCharArray(buf, tempString.length() + 1);
        j += sprintf(data + j, "%s", buf);
        //
        // Send a reply data to the Server

        if (!manager.sendtoWait(data, sizeof(data), from)) {
          Serial.println("sendTowaitfail");
        }
      }
    }
  }
}
