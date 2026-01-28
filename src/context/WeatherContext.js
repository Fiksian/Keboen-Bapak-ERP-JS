'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const LAT = -6.9175;
  const LON = 107.6191;

  const fetchWeather = async () => {
    try {
      const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,visibility&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      console.error("Gagal sinkronisasi cuaca:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, loading }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};