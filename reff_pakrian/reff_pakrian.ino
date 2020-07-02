//int index_max = 20; //contoh saja
uint8_t buff[20];

uint16_t ax;
uint16_t ay;

uint8_t gateway_ID = 0x01;
uint8_t RTU_ID = 0x01;
uint8_t Packet_No = 1;

int index = 0;

//kalo data corrupt, perhatikan index nya
void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  buff[index] = gateway_ID;
  index++;
  buff[index] = RTU_ID;
  index++;
  buff[index] = Packet_No;
  index++;

  ax = 365; //pastikan 2 bytes
  buff[index] = highByte(ax); //MSB
  index++;
  buff[index] = lowByte(ax); //LSB
  index++;
  ay = 556; //pastikan 2 bytes
  buff[index] = highByte(ay); //MSB
  index++;
  buff[index] = lowByte(ay); //LSB
  index++;

  //  dst.... (bisa dibuat loop)

  //check:

  for (int a = 0; a < 20; a++) {
    Serial.write(buff[a]);
  } // liat hasilnya di HEX Doclight

  //    send_Lora(...., buff, .....) //lihat s.c saya

  delay(1000);
}
