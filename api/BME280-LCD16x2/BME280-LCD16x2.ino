#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <LiquidCrystal_I2C.h>

// Endereço I2C do LCD (geralmente 0x27 ou 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2); 

Adafruit_BME280 bme;

// Variável para controlar qual tela mostrar
int telaAtual = 0;

void setup() {
  // Inicia a comunicação Serial para a aplicação web
  Serial.begin(9600);
  
  // Inicia o LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Iniciando...");

  // Inicia o sensor BME280
  if (!bme.begin(0x76)) {
    Serial.println("Sensor BME280 nao encontrado!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Erro: BME280");
    lcd.setCursor(0, 1);
    lcd.print("Nao encontrado!");
    while (1); 
  }
  
  Serial.println("Sensor e LCD iniciados.");
  lcd.clear();
  lcd.print("Sistema OK!");
  delay(1000);
}

void loop() {
  // Faz a leitura dos três sensores
  float temp = bme.readTemperature();
  float umid = bme.readHumidity();
  float pressao = bme.readPressure() / 100.0F;

  // Limpa o display para a nova atualização
  lcd.clear();
  
  // Alterna entre as telas
  if (telaAtual == 0) {
    // --- TELA 1: TEMPERATURA E UMIDADE ---
    
    // Linha 0: Temperatura
    lcd.setCursor(0, 0); 
    lcd.print("Temp: ");
    lcd.print(temp, 2);
    lcd.print((char)223); // Símbolo de grau °
    lcd.print("C");

    // Linha 1: Umidade
    lcd.setCursor(0, 1);
    lcd.print("Umidade: ");
    lcd.print(umid, 2);
    lcd.print(" %");

  } else {
    // --- TELA 2: PRESSÃO ATMOSFÉRICA ---

    // Linha 0: Pressão
    lcd.setCursor(0, 0);
    lcd.print("Pressao:");
    
    // Linha 1: Valor da Pressão
    lcd.setCursor(0, 1);
    lcd.print(pressao, 2); 
    lcd.print(" hPa");
  }

  // Alterna para a próxima tela no próximo ciclo
  telaAtual = !telaAtual; // Alterna entre 0 e 1

  // Envia os dados no formato (temperatura,umidade,pressao) para o CMD/Node.js
  Serial.println(String(temp) + "," + String(umid) + "," + String(pressao));
  
  // O delay total será de 4 segundos (2 segundos por tela)
  delay(4000); 
}