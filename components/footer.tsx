import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-blue-600 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">RADHIKA ELECTRONICS</h3>
            <p className="mb-4">
              Your trusted partner for all electronics needs. Quality products, competitive prices.
            </p>
            <div className="space-y-2">
              <p className="font-semibold">Jayeshbhai Savaliya</p>
              <p className="text-blue-200">Since 2020</p>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-blue-200 hover:text-white">
                  Fans & Coolers
                </Link>
              </li>
              {/* TVs removed as per update - kept other product links */}
              <li>
                <Link href="/dashboard" className="text-blue-200 hover:text-white">
                  Air Conditioners
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-blue-200 hover:text-white">
                  Home Appliances
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-blue-200">Installation</span>
              </li>
              <li>
                <span className="text-blue-200">Warranty Support</span>
              </li>
              <li>
                <span className="text-blue-200">Repair Services</span>
              </li>
              <li>
                <span className="text-blue-200">Bulk Orders</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-red-400" />
                <span>+919510886281</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>jayeshsavaliya3011@gmail.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-red-400 mt-1" />
                <div>
                  <span>
                    18-gala minibazar, matavadi circle
                    <br />
                    Surat, Gujarat 394107
                  </span>
                  <div className="mt-2">
                    <Link href="/location" className="text-blue-200 hover:text-white text-sm underline">
                      View on Map & Get Directions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-500 mt-8 pt-6 text-center">
          <p className="text-blue-200">© 2024 Radhika Electronics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
