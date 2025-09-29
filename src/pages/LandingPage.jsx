import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 z-0" />
      
      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-purple-500/10"
          style={{
            width: `${Math.random() * 8 + 2}px`,
            height: `${Math.random() * 8 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-24">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold">GDVerse</span>
          </div>
          {/* <div className="hidden md:flex space-x-8">
            <Link to="/features" className="text-gray-400 hover:text-white transition">Features</Link>
            <Link to="/pricing" className="text-gray-400 hover:text-white transition">Pricing</Link>
            <Link to="/about" className="text-gray-400 hover:text-white transition">About</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white transition">Contact</Link>
          </div> */}
          <div className="flex space-x-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-white hover:text-purple-300 transition">Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 rounded-md transition">Register</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-32">
          <div className="inline-flex items-center px-4 py-2 mb-8 bg-gray-800/50 border border-gray-700 rounded-full text-purple-400 text-sm font-medium">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
            AI-Powered Discussions • Now Live
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-300 to-purple-600">
              Professional Meetings
            </span>
            <br />
            <span className="text-white">Reimagined</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience crystal-clear audio, intelligent moderation, and real-time collaboration with AI-powered insights.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            {/* <Link 
              to="/demo" 
              className="relative group px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-bold shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </Link> */}
            <Link 
              to="/register" 
              className="px-8 py-4 border border-gray-700 rounded-lg font-bold hover:bg-gray-800/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Free Trial
            </Link>
          </div>

          {/* Trusted By Section */}
          {/* <div className="flex flex-col items-center">
            <p className="text-gray-500 text-sm mb-4">TRUSTED BY TEAMS AT</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-80">
              {['Google', 'Microsoft', 'Spotify', 'Netflix', 'Slack'].map((company) => (
                <div key={company} className="text-gray-400 font-medium">{company}</div>
              ))}
            </div>
          </div> */}
        </div>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Crystal Clear Audio</h3>
            <p className="text-gray-400">Studio-quality voice processing eliminates background noise and echo.</p>
          </div>
          
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">AI Moderation</h3>
            <p className="text-gray-400">Smart assistants keep discussions productive and on track.</p>
          </div>
          
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Real-Time Insights</h3>
            <p className="text-gray-400">Get actionable feedback and analytics during your meetings.</p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mb-32">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-4">Experience GDVerse</h2>
              <p className="text-gray-400 mb-8 max-w-2xl">See how GDVerse transforms your meetings with this interactive demo.</p>
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <button className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-900/40 to-gray-900/40 p-12 rounded-2xl border border-gray-700 mb-20">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Meetings?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Join thousands of professionals who communicate better with GDVerse.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02]"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/contact" 
              className="px-8 py-4 border border-gray-700 rounded-lg font-bold hover:bg-gray-800/50 transition-all duration-300 hover:scale-[1.02]"
            >
              Contact Us!
            </Link>
          </div>
        </div>
      </div>

      {/* Footer - Enhanced Version */}
<footer className="bg-gray-900/70 border-t border-gray-800 py-12 backdrop-blur-sm">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
      {/* Logo and Description */}
      <div className="md:col-span-2">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center transform hover:rotate-12 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">GDVerse</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">The future of professional communication powered by AI.</p>
        
        {/* Newsletter Subscription */}
        <div className="mt-6">
          <h4 className="text-gray-300 font-medium mb-3">Stay Updated</h4>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Your email" 
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm w-full text-white placeholder-gray-500"
            />
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-r-lg text-sm font-medium transition-colors">
              Subscribe
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">We'll never spam you. Unsubscribe anytime.</p>
        </div>
      </div>
      
      
    </div>
    
    {/* Bottom Section */}
    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 mb-4 md:mb-0">
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} GDVerse. All rights reserved.</p>
        <div className="hidden md:block w-px h-4 bg-gray-700"></div>
        <div className="flex space-x-4">
          <Link to="/sitemap" className="text-gray-500 hover:text-gray-300 transition text-sm">Sitemap</Link>
          <Link to="/cookies" className="text-gray-500 hover:text-gray-300 transition text-sm">Cookies</Link>
          <Link to="/accessibility" className="text-gray-500 hover:text-gray-300 transition text-sm">Accessibility</Link>
        </div>
      </div>
      
      {/* Social Links with Hover Effects */}
      <div className="flex space-x-6">
        {[
          { 
            name: 'Twitter',
            icon: <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />,
            color: 'hover:text-blue-400'
          },
          { 
            name: 'LinkedIn',
            icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />,
            color: 'hover:text-blue-500'
          },
          { 
            name: 'GitHub',
            icon: <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />,
            color: 'hover:text-gray-300'
          },
          { 
            name: 'Discord',
            icon: <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />,
            color: 'hover:text-indigo-400'
          }
        ].map((social) => (
          <Link 
            key={social.name}
            to="#" 
            className={`text-gray-500 transition-colors ${social.color} relative group`}
            aria-label={social.name}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {social.icon}
            </svg>
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {social.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
</footer>

      {/* Floating Animation Styles */}
    <style jsx="true" global="true">{`
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`}</style>
    </div>
  );
}

export default LandingPage;