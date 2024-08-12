

import Link from 'next/link'
import { FaUtensils, FaCamera, FaQuestionCircle, FaHeartbeat } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100 animate-gradient-x">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <Link href="/" className="text-3xl font-bold hover:text-indigo-200 transition duration-300">
            🍽️ MealSnap
          </Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-center mb-12 text-indigo-800">Identify Your Meals and Get Nutritional Insights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: FaUtensils, title: "Identify Meals", description: "Upload or capture images of your meals for instant identification." },
            { icon: FaCamera, title: "Use Your Camera", description: "Capture meal images directly with your device's camera." },
            { icon: FaQuestionCircle, title: "Ask Questions", description: "Get answers to your nutritional and dietary questions." },
            { icon: FaHeartbeat, title: "Health Insights", description: "Receive personalized health advice based on your meals." },
          ].map((feature, index) => (
            <div key={index} className="border border-indigo-200 rounded-lg p-6 flex flex-col items-center text-center bg-white shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
              <feature.icon className="text-4xl text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/identify" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 transform hover:scale-105 inline-block">
            Start Identifying
          </Link>
        </div>
      </main>

      <footer className="bg-indigo-600 text-white text-center p-4">
        <p>&copy; 2024 Meal Identifier. All rights reserved.</p>
      </footer>
    </div>
  )
}