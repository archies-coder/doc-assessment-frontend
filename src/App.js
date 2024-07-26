import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMapEvents } from 'react-leaflet/hooks'
import MarkerIcon from "./map-marker-svgrepo-com.svg"
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./App.css"

const customIcon = new L.icon({
  iconUrl: MarkerIcon,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

function LocationMarker({ popupProps, onClick, position, setPosition, weatherData }) {
  const map = useMapEvents({
    click({ latlng }) {
      map.locate()
      setPosition({
        lat: latlng.lat,
        lon: latlng.lng
      })
      onClick({
        lat: latlng.lat,
        lon: latlng.lng
      })
      map.flyTo(latlng, map.getZoom())
    },
  })

  const { condition, name, temp_c, precip_mm, wind_kph, humidity, air_quality } = popupProps

  return position === null ? null : (
    <Marker position={position} icon={customIcon}>
      <Popup>
        {weatherData ?
          <div className="popup-container">
            <div className="header">
              <img src={condition.icon} height={36} alt="Weather icon" />
              <span>
                {condition.text}
              </span>
            </div>
            <div className="location data-row">Location : <span>{name}</span></div>
            <div className="data-row">Temperature: <span>{temp_c}°C</span></div>
            <div className="data-row">Precipitation: <span>{precip_mm} mm</span></div>
            <div className="data-row">Wind Speed: <span>{wind_kph} km/hr</span></div>
            <div className="data-row">Humidity: <span>{humidity} %</span></div>
            <div className="data-row">Air quality (CO): <span>{air_quality.co}</span></div>
          </div> : <div>Loading...</div>}
      </Popup>
    </Marker>
  )
}

const App = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState({ lat: 19.685263273173724, lon: 72.77755737304689 })

  const wsRef = useRef(null)

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080');
    getLocation()

    return () => wsRef.current.close();

  }, []);

  useEffect(() => {
    wsRef.current.onopen = (event) => {
      console.log("Sending location", location)
      wsRef.current.onmessage = (event) => {
        console.log("Sending msg")
        const data = JSON.parse(event.data);
        console.log(data)
        setWeatherData(data);
      }
    };

  }, [location])

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }
        setLocation(location)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(location));
        }
      })
    }
  }

  const { temp_c, condition, precip_mm, wind_kph, humidity, air_quality } = weatherData?.current || {}
  const { name } = weatherData?.location || {}

  const { lat, lon } = location

  return (
    <div>
      <div>
        <MapContainer on center={[lat, lon]} zoom={10} style={{ height: "100vh", width: "100%" }}>
          <LocationMarker
            weatherData={weatherData}
            popupProps={{
              condition,
              temp_c,
              name,
              air_quality,
              wind_kph,
              precip_mm,
              humidity
            }}
            setPosition={setLocation}
            position={location}
            onClick={
              (newLocation) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify(newLocation));
                }
              }}
          />
          <TileLayer
            url='http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}'
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default App;