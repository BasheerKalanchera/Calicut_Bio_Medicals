import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black">
            !
          </div>
          <h2 className="font-extrabold text-xl text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
