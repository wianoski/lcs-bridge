String message; //initiate variable
String prompt = "What is your message?"; //initiate prompt
String confirm = "Your message is "; //repeats message


void setup() {
  Serial.begin(9600); //initiate serial monitor
}

void loop() {
  Serial.println(prompt); //ask for input

  while (Serial.available() == 0); { //wait for input

  }
  message = Serial.readString(); //write input to variable
  Serial.println(confirm); //repeat message
  Serial.println(message); //
 
  for(int i=0;i<message.length(); i++){
    char character = message.charAt(i);
 
    for(int i=7; i>=0; i--){
      byte bytes = bitRead(character,i);
      Serial.print(bytes);
    }

    Serial.println("");
}
}
