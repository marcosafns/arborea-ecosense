export type SensorType =
  | "temperature"
  | "humidity"
  | "soil_humidity"
  | "luminosity"
  | "ph"
  | "co2"
  | "wind"
  | "rain";

export type StationStatus = "active" | "inactive" | "maintenance";
export type AlertType = "out_of_range" | "sensor_offline" | "station_offline";

export interface Plan {
  id: string;
  name: string;
  price_brl: number;
  max_stations: number;
  max_sensors_per_station: number;
  history_days: number;
  alert_enabled: boolean;
  cross_station_enabled: boolean;
  allowed_sensor_types: SensorType[];
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  plan_id?: string;
  plan_expires_at?: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status: StationStatus;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Sensor {
  id: string;
  station_id: string;
  type: SensorType;
  label?: string;
  unit: string;
  min_expected?: number;
  max_expected?: number;
  is_active: boolean;
  created_at: string;
}

export interface Reading {
  id: string;
  sensor_id: string;
  value: number;
  raw_value?: number;
  is_anomaly: boolean;
  recorded_at: string;
  received_at: string;
}

export interface Alert {
  id: string;
  sensor_id?: string;
  reading_id?: string;
  type: AlertType;
  message: string;
  resolved_at?: string;
  created_at: string;
}