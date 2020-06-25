
void setup() {

  Serial.begin(9600);

  byte toExtract[] = "40863284";
  byte convertedValues[4];
 
  boolean flag = atoh(convertedValues, toExtract);

  if (flag != NULL)
  {
    for (int i = 0; i < sizeof(convertedValues); i++)
    {
      Serial.print(convertedValues[i], HEX);
      Serial.print("   in decimal: ");
      Serial.println(convertedValues[i]);
    }
  }
}

void loop() {

}

byte *atoh(byte *destination, const byte *source)
{   
    byte *ret = destination;

    for(int lsb, msb; *source; source += 2)
    {   
        msb = tolower(*source);
        lsb = tolower(*(source + 1));
        msb -= isdigit(msb) ? 0x30 : 0x57;
        lsb -= isdigit(lsb) ? 0x30 : 0x57;
        if((msb < 0x0 || msb > 0xf) || (lsb < 0x0 || lsb > 0xf))
        {
            *ret = 0;
            return NULL;
        }
        *destination++ = (char)(lsb | (msb << 4)); 
    }
    *destination = 0;
    return ret;
}
