#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

Adafruit_BME280 bme; // I2C

void setup() {
  Serial.begin(9600);
  while (!Serial);

  Serial.println("Iniciando sensor BME280 no endereço 0x76...");

  // Tenta inicializar o sensor FORÇANDO o endereço 0x76
  bool status = bme.begin(0x76);  // <-- A MUDANÇA ESTÁ AQUI

  if (!status) {
    Serial.println("Não foi possível encontrar o sensor BME280 no endereço 0x76!");
    Serial.println("Se seu outro código funciona, verifique a fiação ou tente o endereço 0x77.");
    while (1);
  }
  
  Serial.println("Sensor BME280 iniciado com sucesso.");
}

void loop() {
  float temperatura = bme.readTemperature();
  float umidade = bme.readHumidity();
  float pressao = bme.readPressure() / 100.0F;

  if (isnan(temperatura) || isnan(umidade) || isnan(pressao)) {
    Serial.println("Falha ao ler do sensor BME280!");
    return;
  }

  // Envia os dados no formato que o Node.js precisa
  Serial.println(String(temperatura) + "," + String(umidade) + "," + String(pressao));
  
  delay(2000); 
}