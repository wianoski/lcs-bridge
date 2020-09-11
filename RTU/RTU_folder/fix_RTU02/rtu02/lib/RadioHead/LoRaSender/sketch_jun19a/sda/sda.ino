void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
}

void loop() { 
  int i =0;
  // put your main code here, to run repeatedly:
  String myText = "Hello World";

  for(int i=0; i<myText.length(); i++){
  
     char myChar = myText.charAt(i);
   
      for(int i=7; i>=0; i--){
        byte bytes = bitRead(myChar,i);
        Serial.print(bytes, BIN);
      }
  
      Serial.println("");
  }
}
