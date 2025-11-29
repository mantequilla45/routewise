'use client';

import Link from 'next/link';

export default function ContributeLandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                    RouteWise Community
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                    Help us map public transportation routes in your area
                </p>
                
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-4xl mb-4">🗺️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Contribute a Route
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Know a jeepney route that's not on our map? Help us by contributing route information.
                        </p>
                        <Link
                            href="/contribute/routes"
                            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Start Contributing
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-4xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            View Routes
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Browse existing routes and see how they connect different areas of the city.
                        </p>
                        <Link
                            href="/contribute/browse"
                            className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Browse Routes
                        </Link>
                    </div>
                </div>
                
                <div className="bg-white/50 backdrop-blur rounded-lg p-6 max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Why Contribute?
                    </h3>
                    <ul className="text-left text-gray-700 space-y-2">
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">✓</span>
                            Help commuters find the best routes
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">✓</span>
                            Improve public transportation accessibility
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">✓</span>
                            Support your local community
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">✓</span>
                            Make navigation easier for everyone
                        </li>
                    </ul>
                </div>
                
                <div className="mt-8 text-sm text-gray-600">
                    <p>All contributions are reviewed before publication to ensure accuracy.</p>
                    <p className="mt-2">
                        <Link href="/" className="text-blue-600 hover:underline">
                            Back to Home
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}