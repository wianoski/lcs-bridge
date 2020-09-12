// 08/07/2020
// Server05: COM4
// 500MHz

#include <RHReliableDatagram.h>
#include <RH_RF95.h>
#include <SPI.h>

#define RFM95_CS 10
#define RFM95_RST 9
#define RFM95_INT 2

//#define CLIENT_ADDRESS 255      //broadcast
#define CLIENT_ADDRESS 15
#define SERVER_ADDRESS 5

// Singleton instance of the radio driver
RH_RF95 driver(RFM95_CS, RFM95_INT);

// Class to manage message delivery and receipt, using the driver declared above
RHReliableDatagram manager(driver, SERVER_ADDRESS);

//----------------------------------- serialEvent() varibles ----------------------------------------------
String inputString              = "";     // a string to hold incoming data
boolean stringComplete          = false;  // whether the string is complete

uint8_t data1[] = "REQ_RTU05_1";
uint8_t data2[] = "REQ_RTU05_2";
uint8_t data3[] = "REQ_RTU05_3";
uint8_t data4[] = "REQ_RTU05_4";


uint8_t data5[] = "REQ_HEALTH_05";

// Dont put this on the stack:
uint8_t buf[203];

String command_health = "";
String command_PC = "";
int number_of_reading_data = 0;
int i;

String conId = "con01";
String freqId = "0415";
String gwId = "gw05";
String rtuId = "05";
String stat = "ready";

void setup()
{
  pinMode(RFM95_RST, OUTPUT);
  digitalWrite(RFM95_RST, HIGH);

  //Serial.begin(38400);
  Serial.begin(57600);
  // reserve 200 bytes for the inputString:
  inputString.reserve(200);

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

//  Serial.println(conId,freqId,gwId,rtuId,stat);
  Serial.println("con01,04115,gw05,05,ready");
}

void loop()
{
  if (stringComplete) {
    inputString = remove_string_CRLF(inputString);
    command_PC = getValue(inputString, ',', 0);
    if (command_PC == "REQ_RTU05") {
      command_PC = getValue(inputString, ',', 1);
      number_of_reading_data = command_PC.toInt();
      for (i = 0; i < number_of_reading_data; i++) {
        request_RTU05();
      }
    }else if (command_PC == "REQ_RTU_HEALTH05") {
      /* code */
      command_PC = getValue(inputString, ',', 1);
      number_of_reading_data = command_PC.toInt();
      for (i = 0; i < number_of_reading_data; i++) {
        request_health();
      }
    }
    
    stringComplete = false;
    inputString = "";
  }
}

void request_RTU05() {
  /////////////////////////////////// Request Packet1 ///////////////////////////////////////
  if (manager.sendtoWait(data1, sizeof(data1), CLIENT_ADDRESS)) {
    // Now wait for a reply from the RTU05
    uint8_t len = sizeof(buf);
    uint8_t from;

    //Serial.println();
    //Serial.println(len);

    if (manager.recvfromAckTimeout(buf, &len, 2000, &from))
    {
      //Serial.print("RTU05_0x");
      //Serial.print(from, HEX);
      //Serial.print((char*)buf);
      for (i = 0; i < len; i++) {
        char temps[4];
        sprintf(temps, "%02x ", buf[i]);
        Serial.print(temps);
        //        Serial.write(buf[i]);
      }
      //      Serial.println();
    }
    else
    {
      Serial.println("RTU05 no reply");
    }
  }
  else {
    Serial.println("sendtoWait failed");
  }
  /////////////////////////////////// Request Packet2 ///////////////////////////////////////
  if (manager.sendtoWait(data2, sizeof(data2), CLIENT_ADDRESS)) {
    // Now wait for a reply from the RTU05
    uint8_t len = sizeof(buf);
    uint8_t from;

    //Serial.println();
    //Serial.println(len);

    if (manager.recvfromAckTimeout(buf, &len, 2000, &from))
    {
      //Serial.print("RTU05_0x");
      //Serial.print(from, HEX);
      //Serial.print((char*)buf);
      for (i = 0; i < len; i++) {
        char temps[4];
        sprintf(temps, "%02x ", buf[i]);
        Serial.print(temps);
        //        Serial.write(buf[i]);
      }
      Serial.println();
    }
    else
    {
      Serial.println("RTU05 no reply");
    }
  }
  else {
    Serial.println("sendtoWait failed");
  }
}

void request_health() {
  //  Serial.println("yourein");
  /////////////////////////////////// Request Packet1 ///////////////////////////////////////
  if (manager.sendtoWait(data5, sizeof(data5), CLIENT_ADDRESS))
  {
    // Now wait for a reply from the RTU05
    uint8_t len = sizeof(buf);
    uint8_t from;

    //Serial.println();
    //Serial.println(len);

    if (manager.recvfromAckTimeout(buf, &len, 2000, &from))
    {
      //Serial.print("RTU05_0x");
      //Serial.print(from, HEX);
      //Serial.print((char*)buf);
      for (i = 0; i < len; i++) {
        char temps[4];
        sprintf(temps, "%02x ", buf[i]);
        Serial.print(temps);
        //        Serial.write(buf[i]);
      }
      Serial.println();
    }
    else
    {
      Serial.println("RTU05 no reply");
    }
  }
  else {
    Serial.println("sendtoWait failed");
  }
}
//--------------------------- Function: Serial IO ---------------------------------------------

/*
  SerialEvent occurs whenever a new data comes in the
  hardware serial RX.  This routine is run between each
  time loop() runs, so using delay inside loop can delay
  response.  Multiple bytes of data may be available.
*/
void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}

/*  Function: remove CRLF on string
    input  = string with CRLF at the end
    return = string without CRLF at the end
*/
String remove_string_CRLF(String data_string) {
  int data_string_length = 0;
  data_string_length = data_string.length() - 2;  //omitted CRLF
  data_string = data_string.substring(0, data_string_length);
  return data_string;
}

/*************************************************************************
   Function  : getValue(String data, char separator, int index)
   Process   : splitting data by seperator
   Return    : data at index
   Usage     :
               data_temperature   = getValue(inputString, ',', 0);
               data_humidity      = getValue(inputString, ',', 1);

 ***************************************************************************/
String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }

  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}