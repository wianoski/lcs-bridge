#include <Arduino.h>
#include <Wire.h>             //http://arduino.cc/en/Reference/Wire
#include <HX711.h>
// Example 5 - Receive with start- and end-markers combined with parsing



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


const byte numChars = 32;
char receivedChars[numChars];
char tempChars[numChars];        // temporary array for use when parsing

      // variables to hold the parsed data
char messageFromPC[numChars] = {0};
int integerFromPC = 0;

float floatFromPC1 = 0.0;
float floatFromPC2 = 0.0;
float value_gain, value_offset = 0;
float result = 0;

boolean newData = false;



float deltaL = 1.2;
float L = 1.2;


float reading = 0.0;
void clk(){
  digitalWrite(SCK_OUT, HIGH);
  digitalWrite(SCK_OUT, LOW);
}
//============

void recvWithStartEndMarkers() {
    static boolean recvInProgress = false;
    static byte ndx = 0;
    char startMarker = '<';
    char endMarker = '>';
    char rc;

    while (Serial.available() > 0 && newData == false) {
        rc = Serial.read();

        if (recvInProgress == true) {
            if (rc != endMarker) {
                receivedChars[ndx] = rc;
                ndx++;
                if (ndx >= numChars) {
                    ndx = numChars - 1;
                }
            }
            else {
                receivedChars[ndx] = '\0'; // terminate the string
                recvInProgress = false;
                ndx = 0;
                newData = true;
            }
        }

        else if (rc == startMarker) {
            recvInProgress = true;
        }
    }
}

//============

void parseData() {      // split the data into its parts

    char * strtokIndx; // this is used by strtok() as an index

    // strtokIndx = strtok(tempChars,",");      // get the first part - the string
    // strcpy(messageFromPC, strtokIndx); // copy it to messageFromPC
 
    // strtokIndx = strtok(NULL, ","); // this continues where the previous call left off
    // integerFromPC = atoi(strtokIndx);     // convert this part to an integer
    strtokIndx = strtok(tempChars, ",");
    floatFromPC1 = atof(strtokIndx); 

    strtokIndx = strtok(NULL, ",");
    floatFromPC2 = atof(strtokIndx);     // convert this part to a float

}

//============

// void showParsedData() {
  

//     reading = scale.read();
//     // Serial.print("Message ");
//     // Serial.println(messageFromPC);
//     // Serial.print("Integer ");
//     // Serial.println(integerFromPC);
//     Serial.print("Float ");
//     Serial.print(floatFromPC1);
//     Serial.print(",");
//     Serial.println(floatFromPC2);
//     Serial.print("reading: ");
//     Serial.println(reading);
//     Serial.print("result: ");
//     Serial.println(result);
// }

//============

void setup() {
    Serial.begin(9600);
    Serial.println("This demo expects 3 pieces of data - text, an integer and a floating point value");
    Serial.println("Enter data in this style <HelloWorld, 12, 24.7>  ");
    Serial.println();
}

//============

void loop() {

  
    reading = scale.read();
    recvWithStartEndMarkers();
    if (newData == true) {
        strcpy(tempChars, receivedChars);
            // this temporary copy is necessary to protect the original data
            //   because strtok() used in parseData() replaces the commas with \0
        parseData();
        // showParsedData();
        result = (reading * floatFromPC1) + floatFromPC2;
        Serial.println(reading);
        Serial.println(result);
        newData = false;
    }
}
