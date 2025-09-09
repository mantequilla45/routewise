'use client';

export default function LandingPage() {
  const numberOfDashes = 10;
  const dashDelay = 0.4;

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <style jsx>{`
        @keyframes move-down {
          from {
            top: -120px;
          }
          to {
            top: 100vh;
          }
        }
        
        .road-dash {
          position: absolute;
          width: 80px;
          height: 120px;
          background-color: #FFCC66;
          animation: move-down 4s linear infinite;
        }
      `}</style>
      
      <main className="max-w-7xl w-full mx-auto bg-[#404040] h-screen flex items-center justify-center overflow-hidden relative">
        {/* Left lane */}
        {[...Array(numberOfDashes)].map((_, i) => (
          <div 
            key={`left-${i}`}
            className="road-dash" 
            style={{ left: '40%', animationDelay: `${i * dashDelay}s` }} 
          />
        ))}
        
        {/* Right lane */}
        {[...Array(numberOfDashes)].map((_, i) => (
          <div 
            key={`right-${i}`}
            className="road-dash" 
            style={{ right: '40%', animationDelay: `${i * dashDelay}s` }} 
          />
        ))}
      </main>
    </div>
  );
}