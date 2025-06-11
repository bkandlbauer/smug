#include <Wire.h>
#include <VL53L0X.h>
#include <Adafruit_MLX90614.h>
#include <ArduinoBLE.h>

VL53L0X sensor;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
BLEService sensorService("12345678-1234-5678-1234-56789abcdef0");
BLECharacteristic distanceChar("12345678-1234-5678-1234-56789abcdef1", BLERead | BLENotify, sizeof(uint16_t));
BLECharacteristic tempChar("12345678-1234-5678-1234-56789abcdef2", BLERead | BLENotify, sizeof(uint16_t));


void setup() {
  delay(5000);
  Serial.println("Starting");
  Serial.begin(9600);
  while (!Serial);

  if (!BLE.begin()) {
    Serial.println("BLE initialization failed!");
    while (1);
  }

  Wire.begin();
  delay(1000);
  Serial.println("Starting VL53L0X...");


  if (!sensor.init() || !mlx.begin()) {
    Serial.println("Failed to detect and initialize sensor!");
    while (1);
  }

  sensor.setTimeout(500);

  // Switch to precision mode (high accuracy)
  sensor.setMeasurementTimingBudget(200000);  // in microseconds (200ms)

  sensor.startContinuous();

  Serial.println("Sensor initialized.");

  BLE.setLocalName("smugConnector");
  BLE.setAdvertisedService(sensorService);
  sensorService.addCharacteristic(distanceChar);
  sensorService.addCharacteristic(tempChar);
  BLE.addService(sensorService);
  BLE.advertise();
  Serial.println("BLE device is now advertising...");
}

void loop() {
  BLEDevice central = BLE.central();
  Serial.println("- Discovering central device...");
  delay(500);

  uint16_t distance = (uint16_t)sensor.readRangeContinuousMillimeters();

  if (sensor.timeoutOccurred()) {
    Serial.println("Timeout!");
  } else {
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" mm");
  }

  uint16_t temp = (uint16_t)mlx.readObjectTempC();

  Serial.print("Ambient = ");
  Serial.print(mlx.readAmbientTempC());
  Serial.print("*C\tObject = ");
  Serial.print(temp);
  Serial.println("*C");

  Serial.println();

  if (central) {
    Serial.println("* Connected to central device!");
    Serial.print("* Device MAC address: ");
    Serial.println(central.address());
    Serial.println(" ");

    Serial.println("BLE connected and sending");
    distanceChar.writeValue(distance);
    tempChar.writeValue(temp);
    
    Serial.println("* Disconnected to central device!");
  }

  delay(1000);
}