#include "HX711.h"

// HX711 circuit wiring
#define SCK_OUT A2
#define DOUT A1

HX711 scale;

//kita punya persamaan y = ax+b
//dimana y adalah reading dari hx711
//dan x adalah beban yang diterima

float x0 = 0,
      y0 = 0,
      a = 0,
      b = 0,
      res = 0;

long reading_Start = 0,
     current_Reading = 0;

const byte numChars = 32;
char receivedChars[numChars];
char tempChars[numChars];        // temporary array for use when parsing

      // variables to hold the parsed data
char messageFromPC[numChars] = {0};
int integerFromPC = 0;
boolean newData = false;

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
void parseData() {      // split the data into its parts

    char * strtokIndx; // this is used by strtok() as an index
    strtokIndx = strtok(tempChars, ",");
    a = atof(strtokIndx); 

    strtokIndx = strtok(NULL, ",");
    b = atof(strtokIndx);     // convert this part to a float

}

float temp = 0;
void setup() {
  Serial.begin(9600);
  scale.begin(DOUT, SCK_OUT);

//   Serial.println("HX711 starting to read idle value");
//   delay(1000);
//   reading_Start = scale.read();
//   Serial.print("Value: ");
//   Serial.println(reading_Start);
//   Serial.println("Initialize done, starting to read mass");
//    if (newData == true) {
//         strcpy(tempChars, receivedChars);
//             // this temporary copy is necessary to protect the original data
//             //   because strtok() used in parseData() replaces the commas with \0
//         parseData();
//         // showParsedData();
//         temp = (reading_Start - scale.read()) / a;
//         Serial.println(temp);
//         newData = false;
//     }
//   delay(1000);
}

void loop() {
//   Serial.print("Reading: ");
//   Serial.println(reading_Start);


  if (scale.is_ready()) {
          
    current_Reading = scale.read();// * 0.00167;
    float mass = float(current_Reading) * 0.00167;/// 100000;
    mass = mass - 1700;
    Serial.print("actual reading: ");
    Serial.print(current_Reading);
    Serial.print("    |   ");
    Serial.print("mass reading: ");
    Serial.println(mass);
  } else {
    Serial.println("HX711 not found.");
  }
  
  // current_Reading = scale.read();
  
  delay(100);
  
}