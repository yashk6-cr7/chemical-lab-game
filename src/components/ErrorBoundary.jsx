import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Simulation Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center p-8 max-w-md">
            <div className="text-6xl mb-6">⚗️</div>
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              Lab Simulation Error
            </h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred in the simulation.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 
                         transition-colors font-semibold text-sm"
            >
              🔄 Restart Lab
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
