"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, CircleMarker, Popup, useMap } from "react-leaflet";

type LocateStatus = "idle" | "locating" | "tracking" | "denied" | "unsupported" | "error";

interface Fix {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export function LocateControl() {
  const map = useMap();
  const [status, setStatus] = useState<LocateStatus>("idle");
  const [fix, setFix] = useState<Fix | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  function toFix(pos: GeolocationPosition): Fix {
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    };
  }

  function locateOnce() {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const f = toFix(pos);
        setFix(f);
        setStatus("idle");
        map.flyTo([f.lat, f.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
      },
      (err) => handleError(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function startTracking() {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setErrorMessage(null);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const f = toFix(pos);
        setFix(f);
        setStatus("tracking");
      },
      (err) => handleError(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
    );
    watchIdRef.current = id;
    setStatus("tracking");
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
  }

  function handleError(err: GeolocationPositionError) {
    if (err.code === err.PERMISSION_DENIED) {
      setStatus("denied");
      setErrorMessage("Location access was denied in the browser. Allow it in your browser's site settings to use this.");
    } else {
      setStatus("error");
      setErrorMessage(err.message || "Could not determine your location.");
    }
  }

  const isTracking = status === "tracking";

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ marginTop: 10, marginRight: 10 }}>
        <div className="leaflet-control leaflet-bar overflow-hidden rounded-sm border border-register-line bg-white shadow-sm">
          <button
            type="button"
            onClick={locateOnce}
            disabled={status === "locating"}
            title="Locate me once"
            className="block w-full border-b border-register-line px-3 py-2 text-left text-xs font-medium text-register-navy hover:bg-register-bg disabled:opacity-50"
          >
            {status === "locating" ? "Locating…" : "📍 Locate me"}
          </button>
          <button
            type="button"
            onClick={isTracking ? stopTracking : startTracking}
            title={isTracking ? "Stop live tracking" : "Start live tracking"}
            className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-register-bg ${
              isTracking ? "text-register-official" : "text-register-navy"
            }`}
          >
            {isTracking ? "● Live tracking on" : "○ Track live position"}
          </button>
        </div>
      </div>

      {(status === "denied" || status === "unsupported" || status === "error") && (
        <div className="leaflet-bottom leaflet-left" style={{ marginBottom: 10, marginLeft: 10 }}>
          <div className="leaflet-control max-w-xs rounded-sm border border-register-sample/40 bg-register-sample/[0.1] px-3 py-2 text-xs text-register-ink/80 shadow-sm">
            {status === "unsupported"
              ? "This browser does not support geolocation."
              : errorMessage}
          </div>
        </div>
      )}

      {fix && (
        <>
          <Circle
            center={[fix.lat, fix.lng]}
            radius={fix.accuracy}
            pathOptions={{ color: "#2E5F8A", weight: 1, fillOpacity: 0.08 }}
          />
          <CircleMarker
            center={[fix.lat, fix.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2E5F8A", fillOpacity: 1 }}
          >
            <Popup>
              <div className="text-xs">
                <p className="mb-1 font-semibold text-register-navy">
                  {isTracking ? "Live device location" : "Your device location"}
                </p>
                <p>Lat/Lng: {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}</p>
                <p>Accuracy: ±{Math.round(fix.accuracy)} m</p>
                {fix.speed !== null && <p>Speed: {(fix.speed * 3.6).toFixed(1)} km/h</p>}
                {fix.heading !== null && <p>Heading: {Math.round(fix.heading)}°</p>}
                <p>As of: {new Date(fix.timestamp).toLocaleTimeString()}</p>
                <p className="mt-1 text-register-ink/50">
                  From your browser's own GPS/network location, not a government record.
                </p>
              </div>
            </Popup>
          </CircleMarker>
        </>
      )}
    </>
  );
}
