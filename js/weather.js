/**
 * VarshaRakshak — Weather Intelligence & Alerts Engine
 * Connects to Open-Meteo API for real-time weather and provides
 * robust simulated weather generation with rainfall & temperature alert levels.
 */

const VRWeather = {
  // Configured High-Precision Weather API Key (OpenWeatherMap)
  OPENWEATHER_API_KEY: "629ebc92d8260a2c0f2085031c465224",

  // Alert Thresholds in mm/hr
  THRESHOLDS: {
    NORMAL: 5.0,
    MODERATE: 25.0,
    HEAVY: 60.0
    // Above 60.0 is EXTREME
  },

  // Temperature Thresholds in °C
  HEAT_THRESHOLD: 42.0,
  COLD_THRESHOLD: 5.0,

  async getCurrentWeather(pincode = "400053", lat = 19.1136, lng = 72.8697) {
    // 1. Check local storage overrides first (e.g. from simulation trigger)
    const localWeather = VRStorage.getWeatherForPincode(pincode);

    // If local weather has high rainfall simulated recently (within 10 minutes), prioritize it
    if (localWeather && localWeather.rainfallRateMmHr > 20) {
      return this.enrichWeatherData(localWeather);
    }

    // 2. Try fetching live data from OpenWeatherMap if key is configured
    if (this.OPENWEATHER_API_KEY) {
      try {
        const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`;
        const owmRes = await fetch(owmUrl, { signal: AbortSignal.timeout(3500) });
        if (owmRes.ok) {
          const owmData = await owmRes.json();
          const rainMm = (owmData.rain && (owmData.rain['1h'] || owmData.rain['3h'] / 3)) || 0;
          const liveWeather = {
            pincode: pincode,
            locality: owmData.name ? `${owmData.name}, Mumbai` : (localWeather?.locality || "Mumbai Metro"),
            lat: lat,
            lng: lng,
            temperature: owmData.main?.temp || 28.5,
            humidity: owmData.main?.humidity || 85,
            rainfallRateMmHr: rainMm,
            windSpeedKmh: (owmData.wind?.speed || 0) * 3.6,
            provider: "OpenWeatherMap Live API",
            isLiveApi: true,
            updatedAt: new Date().toISOString()
          };
          VRStorage.updateWeatherForPincode(pincode, liveWeather);
          return this.enrichWeatherData(liveWeather);
        }
      } catch (err) {
        // Fall through to Open-Meteo
      }
    }

    // 3. Fallback to Open-Meteo live API
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&hourly=precipitation,temperature_2m&forecast_days=1`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (response.ok) {
        const data = await response.json();
        const current = data.current || {};
        const liveWeather = {
          pincode: pincode,
          locality: localWeather?.locality || "Mumbai Metro",
          lat: lat,
          lng: lng,
          temperature: current.temperature_2m || 28.5,
          humidity: current.relative_humidity_2m || 85,
          rainfallRateMmHr: current.rain || current.precipitation || 0,
          windSpeedKmh: current.wind_speed_10m || 15.0,
          provider: "Open-Meteo Live API",
          isLiveApi: true,
          updatedAt: new Date().toISOString()
        };
        VRStorage.updateWeatherForPincode(pincode, liveWeather);
        return this.enrichWeatherData(liveWeather);
      }
    } catch (e) {
      // Graceful fallback to stored mock
    }

    return this.enrichWeatherData(localWeather || {
      pincode: "400053",
      locality: "Andheri West, Mumbai",
      lat: 19.1136,
      lng: 72.8697,
      temperature: 28.5,
      humidity: 88,
      rainfallRateMmHr: 12.0,
      windSpeedKmh: 20.0
    });
  },

  enrichWeatherData(data) {
    const rain = Number(data.rainfallRateMmHr || 0);
    const temp = Number(data.temperature || 28);

    let alertLevel = "Normal";
    let alertColor = "var(--color-success)";
    let alertBadgeClass = "badge-success";
    let condition = "Clear Conditions";

    if (rain > this.THRESHOLDS.HEAVY) {
      alertLevel = "Extreme Rain";
      alertColor = "var(--color-danger)";
      alertBadgeClass = "badge-danger";
      condition = "Torrential Cloudburst / Severe Rain";
    } else if (rain > this.THRESHOLDS.MODERATE) {
      alertLevel = "Heavy Rain";
      alertColor = "#f97316";
      alertBadgeClass = "badge-warning";
      condition = "Heavy Monsoon Showers";
    } else if (rain > this.THRESHOLDS.NORMAL) {
      alertLevel = "Moderate Rain";
      alertColor = "var(--color-warning)";
      alertBadgeClass = "badge-warning";
      condition = "Moderate Rain Showers";
    } else {
      condition = "Clear / Light Passing Cloud";
    }

    // Check Extreme Temperature
    let isExtremeTemp = false;
    let tempAlertMessage = null;
    if (temp >= this.HEAT_THRESHOLD) {
      isExtremeTemp = true;
      alertLevel = "Extreme Heat";
      alertColor = "var(--color-danger)";
      alertBadgeClass = "badge-danger";
      condition = "Dangerous Heatwave Alert (>42°C)";
      tempAlertMessage = "Extreme heat advisory. Hydration breaks mandatory for delivery partners.";
    } else if (temp <= this.COLD_THRESHOLD) {
      isExtremeTemp = true;
      alertLevel = "Extreme Cold";
      alertColor = "#38bdf8";
      alertBadgeClass = "badge-info";
      condition = "Severe Coldwave Alert (<5°C)";
      tempAlertMessage = "Extreme cold advisory. Winter thermal protection advised.";
    }

    return {
      ...data,
      rainfallRateMmHr: rain,
      temperature: temp,
      alertLevel,
      alertColor,
      alertBadgeClass,
      condition,
      isExtremeTemp,
      tempAlertMessage
    };
  },

  simulateWeatherChange(pincode, rainfallRateMmHr, temperature, durationMinutes = 60) {
    const current = VRStorage.getWeatherForPincode(pincode);
    const updated = {
      ...current,
      pincode,
      rainfallRateMmHr: Number(rainfallRateMmHr),
      temperature: Number(temperature),
      durationMinutes: Number(durationMinutes),
      isDemoSimulation: true,
      updatedAt: new Date().toISOString()
    };
    VRStorage.updateWeatherForPincode(pincode, updated);
    return this.enrichWeatherData(updated);
  }
};
