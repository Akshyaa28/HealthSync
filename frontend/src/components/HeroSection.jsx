export default function HeroSection() {
  return (
    <div className="text-center max-w-6xl mx-auto relative z-10">

      <span className="inline-flex items-center gap-2 mb-10 px-6 py-2.5 text-base font-semibold bg-teal-100/80 text-teal-600 rounded-full shadow-sm">
        <span className="w-2.5 h-2.5 bg-teal-500 rounded-full"></span>
        AI-Powered Healthcare Platform
      </span>

      <h1 className="text-[64px] md:text-[84px] font-extrabold text-gray-900 leading-[1.05] tracking-tight">
        Your Health Journey,
        <span className="block text-teal-500 mt-3">
          Simplified
        </span>
      </h1>

      <p className="mt-10 text-gray-600 text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto">
        Upload your medical reports, get AI-powered insights, track your health
        trends, and understand prescriptions in your language. All in one secure
        platform.
      </p>

      <div className="mt-14 flex justify-center gap-8 flex-wrap">
        <button className="
          bg-gradient-to-r from-teal-500 to-blue-500
          text-white px-12 py-5 rounded-full font-semibold text-xl
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-2xl
          active:scale-95
        ">
          Start Free Analysis →
        </button>

        <button className="
          px-12 py-5 rounded-full border border-gray-300
          font-semibold text-xl text-gray-800
          transition-all duration-300
          hover:scale-105 hover:bg-white hover:shadow-lg
        ">
          ▶ Watch Demo
        </button>
      </div>

    </div>
  );
}
