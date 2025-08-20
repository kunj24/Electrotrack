"use client"

import { useEffect, useRef } from "react"

interface GoogleMapsProps {
  address: string
  className?: string
  height?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function GoogleMaps({ address, className = "", height = "400px" }: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      // Load Google Maps script
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=places`
      script.async = true
      script.defer = true

      window.initMap = initializeMap

      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }

    const initializeMap = () => {
      if (!mapRef.current) return

      // Radhika Electronics coordinates (approximate for Surat, Gujarat)
      const storeLocation = { lat: 21.1702, lng: 72.8311 }

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: storeLocation,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi.business",
            stylers: [{ visibility: "on" }],
          },
          {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      // Add marker for store location
      const marker = new window.google.maps.Marker({
        position: storeLocation,
        map: map,
        title: "Radhika Electronics",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="white" strokeWidth="4"/>
              <path d="M20 10C16.69 10 14 12.69 14 16C14 20.5 20 30 20 30S26 20.5 26 16C26 12.69 23.31 10 20 10ZM20 18.5C18.62 18.5 17.5 17.38 17.5 16S18.62 13.5 20 13.5S22.5 14.62 22.5 16S21.38 18.5 20 18.5Z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40),
        },
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #2563eb; font-size: 16px; font-weight: bold;">Radhika Electronics</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">18-gala minibazar, matavadi circle<br>Surat, Gujarat 394107</p>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Phone:</strong> +91 95108 86281</p>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Hours:</strong> Mon-Sat 9AM-8PM</p>
            <div style="margin-top: 10px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=18-gala+minibazar+matavadi+circle+Surat+Gujarat+394107" 
                 target="_blank" 
                 style="background: #2563eb; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;">
                Get Directions
              </a>
            </div>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })

      mapInstanceRef.current = map
    }

    loadGoogleMaps()
  }, [address])

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div ref={mapRef} style={{ height, width: "100%" }} />
    </div>
  )
}

// Fallback component when Google Maps is not available
export function GoogleMapsEmbed({ address, className = "", height = "400px" }: GoogleMapsProps) {
  const encodedAddress = encodeURIComponent(address)

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}&zoom=15`}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Radhika Electronics Location"
      />
    </div>
  )
}

// Simple fallback with static map image and directions link
export function StaticMapFallback({ address, className = "" }: GoogleMapsProps) {
  const handleGetDirections = () => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank")
  }

  return (
    <div className={`bg-blue-50 rounded-lg p-8 text-center ${className}`}>
      <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Radhika Electronics</h3>
      <p className="text-gray-600 mb-4">{address}</p>
      <button
        onClick={handleGetDirections}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        Get Directions
      </button>
    </div>
  )
}
