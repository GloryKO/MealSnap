
'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaCamera, FaUpload, FaPaperPlane } from 'react-icons/fa'

export default function Identify() {
  const [image, setImage] = useState<File | null>(null)
  const [result, setResult] = useState<string>('')
  const [mealContext, setMealContext] = useState<string>('')
  const [question, setQuestion] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showCamera, setShowCamera] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [messages, setMessages] = useState<{type: 'user' | 'bot', content: string}[]>([])

  const formatResponse = (text: string) => {
    // Replace asterisks with emoji bullets
    text = text.replace(/\*/g, '•')

    // Add emojis to common words/phrases
    const emojiMap: { [key: string]: string } = {
      'Calories': '🔥',
      'Protein': '💪',
      'Carbohydrates': '🍞',
      'Fat': '🧈',
      'Fiber': '🌿',
      'Vitamins': '💊',
      'Minerals': '🧪',
      'Healthy': '💚',
      'Unhealthy': '❌',
      'Nutritious': '🥗',
      'Exercise': '🏋️‍♀️',
      'Water': '💧',
      'Fruits': '🍎',
      'Vegetables': '🥦',
      'Meat': '🥩',
      'Fish': '🐟',
      'Dairy': '🥛',
      'Grains': '🌾',
    }

    Object.keys(emojiMap).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi')
      text = text.replace(regex, `${emojiMap[key]} ${key}`)
    })

    // Split text into paragraphs
    const paragraphs = text.split('\n\n')

    // Format each paragraph
    return paragraphs.map(paragraph => {
      // Check if the paragraph is a list item
      if (paragraph.trim().startsWith('•')) {
        // Split list items
        const listItems = paragraph.split('•')
        return (
          <ul className="list-disc list-inside">
            {listItems.map((item, index) => (
              item.trim() && <li key={index}>{item.trim()}</li>
            ))}
          </ul>
        )
      } else {
        // Regular paragraph
        return <p className="mb-4">{paragraph}</p>
      }
    })
    }

  useEffect(() => {
    if (showCamera) {
      handleCameraCapture()
    } else {
      stopCamera()
    }
  }, [showCamera])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
      setResult('')
      setMealContext('')
    }
  }

  const handleCameraCapture = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { exact: "environment" } } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (err) {
        console.error("Error accessing the camera:", err)
        // Fallback to user-facing camera if rear camera is not available
        try {
          const frontStream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (videoRef.current) {
            videoRef.current.srcObject = frontStream
            videoRef.current.play()
          }
        } catch (frontErr) {
          console.error("Error accessing front camera:", frontErr)
        }
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" })
          setImage(file)
          setResult('')
          setMealContext('')
          setShowCamera(false)
        }
      }, 'image/jpeg')
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }



  const identifyMeal = async () => {
    if (!image) return

    setLoading(true)
    setResult('')

      try {
        const response = await fetch('/api/identify-meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: await fileToBase64(image) }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setResult(data.result)
        setMealContext(data.result)
        setMessages(prev => [...prev, {type: 'bot', content: formatResponse(data.result)}])
      } catch (error) {
        console.error('Error identifying meal:', error)
        setResult(`Error identifying meal: ${error.message}. Please try again.`)
        setMessages(prev => [...prev, {type: 'bot', content: `Error identifying meal: ${error.message}. Please try again.`}])
      }

      setLoading(false)
    }

  const askFollowUpQuestion = async () => {
    if (!question || !mealContext) return

    setLoading(true)
    setMessages(prev => [...prev, {type: 'user', content: question}])

    try {
      const response = await fetch('/api/identify-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followUpQuestion: question, mealContext }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(prevResult => `${prevResult}\n\nFollow-up Question: ${question}\nAnswer: ${data.result}`)
      setMessages(prev => [...prev, {type: 'bot', content: formatResponse(data.result)}])
    } catch (error) {
      console.error('Error asking follow-up question:', error)
      setMessages(prev => [...prev, {type: 'bot', content: `Error asking follow-up question: ${error.message}. Please try again.`}])
    }

    setLoading(false)
    setQuestion('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100 animate-gradient-x">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold hover:text-indigo-200 transition duration-300">
            🍽️ MealSnap
          </Link>
          <Link href="/" className="text-white hover:text-indigo-200 transition duration-300">Home</Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex justify-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center transition duration-300"
          >
            <FaUpload className="mr-2" /> Upload Image
          </button>
          <button
            onClick={() => setShowCamera(!showCamera)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center transition duration-300"
          >
            <FaCamera className="mr-2" /> {showCamera ? 'Hide Camera' : 'Use Camera'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {showCamera && (
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <video ref={videoRef} width="300" height="300" className="rounded-lg shadow-md" />
              <button
                onClick={captureImage}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Capture
              </button>
            </div>
          </div>
        )}

        {image && !showCamera && (
          <div className="mb-8 flex justify-center">
            <Image
              src={URL.createObjectURL(image)}
              alt="Uploaded meal"
              width={300}
              height={300}
              className="rounded-lg shadow-md"
            />
          </div>
        )}

        <button
          onClick={identifyMeal}
          disabled={!image || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Identifying...' : 'Identify Meal'}
        </button>

        <div className="mt-8 bg-white rounded-lg shadow-md p-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg ${message.type === 'user' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="How can I make this healthier? "
            className="flex-grow p-3 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={askFollowUpQuestion}
            disabled={!question || loading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-r-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaPaperPlane className="mr-2" />
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </main>
      
      <footer className="bg-indigo-600 text-white text-center p-4">
        <p>&copy; 2024 Meal Identifier. All rights reserved.</p>
      </footer>
    </div>
  )
}