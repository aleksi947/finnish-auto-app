import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Instagram, Facebook } from "lucide-react";

function HomePage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-screen min-h-[500px] sm:min-h-[600px]">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/finland.png')` }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-6 pt-20 pb-8">
          <div className="max-w-4xl text-center w-full">
            <h1 className="mb-4 sm:mb-6 text-2xl sm:text-[36px] md:text-5xl lg:text-6xl xl:text-7xl font-normal not-italic text-white leading-tight sm:leading-normal">
              Finnish to the core
            </h1>
            <p className="mx-auto mb-6 sm:mb-10 max-w-2xl text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 px-2">
              Immerse yourself in the language every day — simple and effective
            </p>

            <div className="flex flex-col items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row">
              <Link to="/lessons" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-blue-600 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg text-white hover:bg-blue-700">
                  🚀 Start learning
                </Button>
              </Link>
              <Link to="/lessons" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white bg-white/10 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg text-white backdrop-blur-sm hover:bg-white/20"
                >
                  📘 Browse lessons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          <div className="text-center p-5 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📚</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Daily lessons</h3>
            <p className="text-sm sm:text-base text-gray-600">
              New material every day. Learn at your own pace.
            </p>
          </div>
          <div className="text-center p-5 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎧</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Audio & practice</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Listen to native speakers and practice pronunciation.
            </p>
          </div>
          <div className="text-center p-5 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚀</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Fast progress</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Visible results in just a few weeks.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight px-2">
            Ready to start learning Finnish?
          </h2>
          <p className="mb-6 sm:mb-10 text-base sm:text-lg md:text-xl text-white/90 px-2">
            Join thousands of students who have already reached their goals
          </p>
          <Link to="/lessons" className="inline-block">
            <Button size="lg" className="bg-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 text-base sm:text-lg text-blue-700 hover:bg-gray-100 w-full sm:w-auto">
              🚀 Start learning for free
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="mb-4 sm:mb-6 flex items-center justify-center gap-4 sm:gap-6">
            <a href="#" className="text-gray-400 transition-colors hover:text-white" aria-label="Instagram">
              <Instagram size={20} className="sm:w-6 sm:h-6" />
            </a>
            <a href="#" className="text-gray-400 transition-colors hover:text-white" aria-label="Facebook">
              <Facebook size={20} className="sm:w-6 sm:h-6" />
            </a>
            <a href="#" className="text-gray-400 transition-colors hover:text-white" aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="sm:w-6 sm:h-6"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
          <p className="text-sm sm:text-base text-gray-400">© 2025 FinnishFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
