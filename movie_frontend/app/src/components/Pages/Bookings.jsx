import React, { useEffect, useState } from 'react'

const Bookings = () => {
  const URL = "http://localhost:8000/movie/list"
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(URL)
        if (!res.ok) throw new Error('Failed to fetch data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="text-center mt-10 text-gray-600">Loading movies...</div>
  if (error) return <div className="text-center text-red-500 mt-10">Error: {error}</div>

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">🎬 Movie Listings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.map((movie) => (
          <div
            key={movie.id}
            className="bg-white shadow-lg rounded-2xl overflow-hidden hover:scale-105 transform transition duration-300"
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-800">{movie.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{movie.description}</p>
              <p className="mt-3 text-gray-500 text-sm">
                ⭐ <span className="font-medium text-yellow-500">{movie.rating}</span>
              </p>
              <p className="text-gray-400 text-sm">
                📅 {new Date(movie.release_date).toLocaleDateString()}
              </p>

              <a
                href={movie.poster_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block w-full text-center bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition"
              >
                View More
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Bookings
