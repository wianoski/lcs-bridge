
typedef union
{
  float v;
  uint32_t as_int;
}
cracked_float_t;

cracked_float_t floatValue;

void setup()
{
  floatValue.v = 12.15;

  Serial.begin(9600);

  Serial.print("The given float value is =");
  Serial.println(floatValue.v);

  Serial.print("The hex value is =");
  Serial.println(floatValue.as_int,HEX);

   Serial.print("The bin value is =");
  Serial.println(floatValue.as_int,BIN);
}

void loop() {}
