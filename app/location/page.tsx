"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Clock, MapPin, Navigation, Car, Bus, Train } from "lucide-react"
import { StaticMapFallback } from "@/components/google-maps"

export default function LocationPage() {
  const handleGetDirections = () => {
    window.open(
      "https://www.google.com/maps/dir/?api=1&destination=18-gala+minibazar+matavadi+circle+Surat+Gujarat+394107",
      "_blank",
    )
  }

  const handleViewOnMaps = () => {
    window.open("https://www.google.com/maps/place/18-gala+minibazar+matavadi+circle+Surat+Gujarat+394107", "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Visit Our Store</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Find us easily with detailed directions and store information
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-blue-600" onClick={handleGetDirections}>
              <Navigation className="h-5 w-5 mr-2" />
              Get Directions
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
              onClick={handleViewOnMaps}
            >
              <MapPin className="h-5 w-5 mr-2" />
              View on Google Maps
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Main Map and Store Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Large Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Store Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <StaticMapFallback
                  address="18-gala minibazar, matavadi circle, Surat, Gujarat 394107, India"
                  height="500px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Store Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Store Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Radhika Electronics</h3>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-gray-600">18-gala minibazar</p>
                      <p className="text-gray-600">matavadi circle</p>
                      <p className="text-gray-600">Surat, Gujarat 394107</p>
                      <p className="text-gray-600">India</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Phone</p>
                    <p className="text-gray-600">+91 95108 86281</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <p className="text-gray-600">jayeshsavaliya3011@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-800">Business Hours</p>
                    <p className="text-gray-600">Monday - Saturday</p>
                    <p className="text-gray-600">9:00 AM - 8:00 PM</p>
                    <p className="text-gray-600">Sunday: 10:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={handleGetDirections}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={handleViewOnMaps}>
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Google Maps
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Store
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transportation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Car className="h-5 w-5 mr-2" />
                By Car
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Easily accessible by car with parking available near the store. Located in the heart of matavadi circle.
              </p>
              <Button variant="outline" size="sm" className="bg-transparent" onClick={handleGetDirections}>
                Get Driving Directions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Bus className="h-5 w-5 mr-2" />
                By Bus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Multiple bus routes serve the matavadi circle area. The store is within walking distance from the main
                bus stops.
              </p>
              <p className="text-sm text-gray-500">Nearest bus stop: Matavadi Circle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Train className="h-5 w-5 mr-2" />
                By Train
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Surat Railway Station is the nearest major railway station. From there, you can take local transport to
                reach our store.
              </p>
              <p className="text-sm text-gray-500">Distance from Surat Station: ~8 km</p>
            </CardContent>
          </Card>
        </div>

        {/* Landmarks */}
        <Card>
          <CardHeader>
            <CardTitle>Nearby Landmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Matavadi Circle</h3>
                <p className="text-sm text-gray-600">Main landmark</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Mini Bazar</h3>
                <p className="text-sm text-gray-600">Shopping area</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Local Shops</h3>
                <p className="text-sm text-gray-600">Commercial area</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bus className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Bus Stop</h3>
                <p className="text-sm text-gray-600">Public transport</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
