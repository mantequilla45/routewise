import Image from 'next/image';

export default function ContributeFooter() {
  return (
    <footer className="mt-16 bg-white/90 backdrop-blur-sm border-t border-gray-200">
      <div className="container min-w-[100vw] px-4 sm:px-6 lg:px-20 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          <div className="flex items-center gap-4">
            <div className="text-center lg:text-left">
              <Image
                src="/routewise.svg"
                alt="Routewise"
                width={48}
                height={48}
                className="h-10 sm:h-12 w-auto opacity-90"
              />
              <p className="text-xs sm:text-sm text-gray-600">
                Mapping the future of public transport
              </p>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">
              🛡️ All contributions are reviewed before publication
            </p>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md">
              Thank you for helping improve public transportation in your community
            </p>
          </div>
        </div>

        <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} Routewise. Your contribution makes a difference.
          </p>
        </div>
      </div>
    </footer>
  );
}
