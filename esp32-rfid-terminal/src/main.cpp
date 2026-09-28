// RFID терминал: RC522 + OLED. Изпраща UID на картата по USB като "UID: EA:97:24:06"
// (обработва се от terminal/rfid_terminal.py).
#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// RC522 (SPI): SS → GPIO 5, RST → GPIO 2, SCK/MISO/MOSI → 18/19/23
// OLED SSD1306 (I2C): SDA → GPIO 21, SCL → GPIO 22
#define SS_PIN 5
#define RST_PIN 2
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

MFRC522 rfid(SS_PIN, RST_PIN);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool displayReady = false; // без дисплей буферът не е заделен, затова showMessage не рисува

// Дисплеят може да е на 0x3C или 0x3D
bool startDisplay() {
  const uint8_t addresses[] = {0x3C, 0x3D};
  for (uint8_t address : addresses) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0 && display.begin(SSD1306_SWITCHCAPVCC, address)) {
      Serial.print("SSD1306 found at 0x");
      Serial.println(address, HEX);
      return true;
    }
  }
  Serial.println("SSD1306 not found; check VCC, GND, SDA=21, SCL=22");
  return false;
}

void showMessage(const char* message) {
  if (!displayReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 24);
  display.println(message);
  display.display();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  displayReady = startDisplay();
  showMessage("Scan here");
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RC522 reader check:");
  rfid.PCD_DumpVersionToSerial();
  Serial.println("Present a 13.56 MHz RFID tag...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  Serial.print("UID: ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) Serial.print("0");
    Serial.print(rfid.uid.uidByte[i], HEX);
    if (i + 1 < rfid.uid.size) Serial.print(":");
  }
  Serial.println();
  showMessage("Attendance\nrecorded");

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(2000);
  showMessage("Scan here");
}