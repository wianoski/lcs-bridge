char text[] = "1408";
char hex[8];
byte value;
void foo() {
  for (int i = 0; i < 8; i++) {
    hex[i] = (toHex(text[i * 2]) << 4) | toHex(text[i * 2 + 1]);
  }
}
inline byte toHex(char z) {
  return z <= '9' ? z - '0' :  z <= 'F' ? z - 'A' + 10 : z - 'a' + 10;
}

void setup() {
  Serial.begin(9600);
  foo();
  dump(&text, sizeof(text));
  dump(&hex, sizeof(hex));
}
void dump(const void* adrIn, int len) {
  byte* adr = (byte*) adrIn;
  byte idx;
  byte blanks;
  if (len) {
    for (; len > 0; len -= 16, adr += 16) {
      for (idx = 0; idx < 16; idx++) {
        if (idx < len ) {
          byte curr = adr[idx];
          phByte(curr);
          blanks = 1;
        } else {
          blanks = 3;
        }
        while (blanks--) {
          Serial.write(' ');
        }
      }
      Serial.println();
    }
  }
}
void phByte(byte value) {
  if (value < 16) {
    Serial.write('0');
  }
  Serial.print(value, HEX);
 
}
void loop() {
  
}
