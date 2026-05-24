import { useNavigate } from "react-router-dom";
import { useRef } from "react";

export default function LandingPage() {
  const navigate = useNavigate();

  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const testimonialRef = useRef(null);

  const scrollToAbout = () => aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToTestimonials = () => testimonialRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="w-full">

      {/* ================= NAVBAR ================= */}
      <nav className="w-full px-14 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-md fixed top-0 left-0 z-50">
        <div className="flex items-center gap-3 text-4xl font-extrabold text-teal-600">
          💚 HealthSync
        </div>

        <div className="flex gap-10 text-2xl font-semibold text-gray-900">
          <p onClick={scrollToAbout} className="hover:text-teal-600 cursor-pointer">About</p>
          <p onClick={scrollToFeatures} className="hover:text-teal-600 cursor-pointer">Features</p>
          <p onClick={scrollToHow} className="hover:text-teal-600 cursor-pointer">How It Works</p>
          <p onClick={scrollToTestimonials} className="hover:text-teal-600 cursor-pointer">Testimonials</p>
        </div>

        <div className="flex gap-6 items-center">
          <button onClick={() => navigate("/login")} className="text-xl font-bold hover:text-teal-600">
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-4 text-2xl rounded-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold shadow-xl hover:scale-110 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <main className="h-screen w-full bg-gradient-to-br from-teal-200 via-teal-100 to-sky-200 flex items-center justify-center text-center px-6 pt-15">
        <div className="max-w-6xl">
          <span className="inline-block px-8 py-3 mb-6 text-2xl rounded-full bg-teal-200 text-teal-800 font-bold">
            ● AI-Powered Healthcare Platform
          </span>

          <h1 className="text-8xl font-extrabold leading-tight text-gray-900">
            Your Health Journey,<br />
            <span className="text-teal-600">Simplified</span>
          </h1>

          <p className="mt-10 text-3xl text-gray-700 max-w-5xl mx-auto leading-relaxed">
            Upload medical reports, get AI insights, track your health,
            and understand prescriptions in your language — all in one secure platform.
          </p>

          <div className="mt-16 flex justify-center gap-10">
            <button
              onClick={() => navigate("/signup")}
              className="px-14 py-7 text-3xl rounded-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold shadow-2xl hover:scale-110 transition"
            >
              Start Free Analysis →
            </button>
            <button className="px-14 py-7 text-3xl rounded-full bg-white shadow-xl hover:scale-105 transition font-semibold">
              ▶ Watch Demo
            </button>
          </div>
        </div>
      </main>

      {/* ================= ABOUT ================= */}
      <section ref={aboutRef} className="w-full bg-white py-24 px-20 flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/2">
          <span className="inline-block px-8 py-3 mb-6 text-2xl rounded-full bg-green-100 text-green-700 font-bold">
            About HealthSync
          </span>

          <h2 className="text-6xl font-extrabold text-gray-900 leading-snug">
            Revolutionizing Healthcare with <br />
            <span className="text-teal-600">AI</span>{" "}
            <span className="text-sky-500">Intelligence</span>
          </h2>

          <p className="mt-8 text-2xl text-gray-700 leading-relaxed">
            HealthSync bridges the gap between complex medical data and patient understanding.
            Our AI-powered platform analyzes your health records, tracks trends,
            and provides actionable insights.
          </p>

          <ul className="mt-14 space-y-5 text-2xl text-gray-800">
            <li className="flex items-center gap-3"><span className="text-green-600 text-3xl">✔</span> Automated report analysis</li>
            <li className="flex items-center gap-3"><span className="text-green-600 text-3xl">✔</span> Real-time risk prediction</li>
            <li className="flex items-center gap-3"><span className="text-green-600 text-3xl">✔</span> AI health assistant</li>
            <li className="flex items-center gap-3"><span className="text-green-600 text-3xl">✔</span> Prescription simplification</li>
          </ul>
        </div>

        <div className="lg:w-1/2 space-y-6">
          <InfoCard icon="⚡" title="Instant Analysis" text="Get insights within seconds." />
          <InfoCard icon="🔒" title="Secure Data" text="Encrypted & protected." />
          <InfoCard icon="🌐" title="Multi-Language" text="Understand in your language." />

          <div className="bg-gradient-to-r from-blue-50 to-green-50 shadow-lg rounded-2xl p-8 flex justify-between">
            <Stat value="50K+" label="Reports" />
            <Stat value="15+" label="Languages" />
            <Stat value="24/7" label="AI Support" />
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section ref={featuresRef} className="w-full bg-gray-200 pt-24 pb-32 px-20">
        <div className="text-center">
          <span className="px-6 py-2 bg-green-200 text-green-800 rounded-full text-2xl font-bold">
            Powerful Features
          </span>

          <h2 className="mt-8 text-6xl font-extrabold text-gray-900">
            Everything You Need for <span className="text-teal-600">Better</span>{" "}
            <span className="text-sky-600">Health</span>
          </h2>
        </div>

        <p className="mt-6 text-2xl text-gray-700 max-w-3xl mx-auto text-center leading-relaxed">
          Our comprehensive suite of tools empowers you to understand, track, and improve
          your health with confidence.
        </p>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <FeatureCard icon="📄" title="Smart Upload" text="Upload your medical reports in any format. Our Al instantly extracts key information, creates easy-to-understand summaries, and highlights important findings" />
          <FeatureCard icon="💓" title="Risk Assessment" text="Al-powered analysis that predicts potential health risks based on your medical history and current reports. Get personalized recommendations to stay ahead of health issues." />
          <FeatureCard icon="📊" title="Dashboard" text="Visualize your health journey with interactive charts and graphs. Track trends over time, monitor vital statistics, and see your progress at a glance." />
          <FeatureCard icon="📝" title="Presciptions Translator" text="Convert complex medical prescriptions into simple, understandable language. Available in 15+ languages to ensure you never miss important medication instructions." />
          <FeatureCard icon="❤️" title="Recovery Tracking" text="Post-treatment monitoring made easy. Track your recovery progress, log symptoms, and get Al-powered insights on your healing journey." />
          <FeatureCard icon="💬" title="AI Assistant" text="24/7 chatbot that answers your health queries, explains medical terms, and helps you understand your reports. Like having a doctor available anytime."/>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section ref={howRef} className="w-full bg-white py-28 px-20">
        <h2 className="text-center text-6xl font-extrabold">
          How It <span className="text-teal-600">Works</span>
        </h2>

        <p className="text-center mt-6 text-2xl text-gray-700">
          Get started in minutes. Our streamlined process makes health tracking effortless.
        </p>

        <div className="mt-24 flex flex-wrap lg:flex-nowrap justify-center gap-10">
          <WorkCard step="1" icon="👤" title="Create Account" desc="Sign up as a patient or doctor. Enter your basic details and medical history to get started." />
          <Arrow />
          <WorkCard step="2" icon="⬆️" title="Upload Reports" desc="Upload your lab results. prescriptions, or any medical documents. We support PDF, images, and more." />
          <Arrow />
          <WorkCard step="3" icon="🧠" title="AI Analysis" desc="Our advanced Al analyzes your reports, identifies patterns, and generates comprehensive insights." />
          <Arrow />
          <WorkCard step="4" icon="📈" title="Track Health" desc="View your health dashboard, track trends, and get personalized recommendations for better health." />
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section ref={testimonialRef} className="w-full bg-gray-300 py-28 px-20">
        <div className="text-center mb-20">
          <span className="px-8 py-3 bg-green-200 text-green-800 rounded-full text-2xl font-bold">
            Testimonials
          </span>

          <h2 className="mt-8 text-6xl font-extrabold text-gray-900">
            Loved by <span className="text-teal-600">Thousands</span>
          </h2>

          <p className="mt-6 text-2xl text-gray-700">
            See what doctors and patients say about HealthSync.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <TestimonialCard text="HealthSync has transformed how I interact with patients. The Al-powered summaries save me hours of paperwork and help patients understand their conditions better." name="Dr. Priya Sharma" role="Cardiologist" initials="PS" />
          <TestimonialCard text="Finally, I can understand my medical reports! The prescription translator feature is a game-changer. Now I know exactly what medicines I'm taking and why." name="Rajesh Kumar" role="Patient" initials="RK" />
          <TestimonialCard text="The risk assessment feature has helped me identify potential health issues in my patients early. It's like having an Al assistant that never misses a detail." name="Dr. Amit Patel" role="Physician" initials="AP" />
          <TestimonialCard text="After my surgery, the recovery tracking feature helped me stay on top of my healing journey. The Al chatbot answered all my midnight worries!" name="Sneha Reddy" role="Patient" initials="SR" />
          <TestimonialCard text="The trend analysis across patient reports is incredibly valuable. It helps me spot patterns that might otherwise go unnoticed in busy practice." name="Dr. Meera Gupta" role="Oncologist" initials="MG" />
          <TestimonialCard text="Managing my diabetes has never been easier. The dashboard shows me exactly how my levels have changed over time. Highly recommend to everyone!" name="Vikram Singh" role="Patient" initials="VS" />
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="w-full py-32 px-20 bg-gradient-to-br from-green-700 via-teal-600 to-sky-600 text-center text-white relative overflow-hidden">
        <span className="inline-flex items-center gap-2 px-8 py-3 mb-10 rounded-full bg-white/20 backdrop-blur text-xl font-semibold">
          ✨ Start Your Journey Today
        </span>

        <h2 className="text-7xl font-extrabold leading-tight">
          Ready to Take Control of Your Health?
        </h2>

        <p className="mt-8 text-2xl max-w-4xl mx-auto text-white/90 leading-relaxed">
          Join thousands of users who are already experiencing smarter, more personalized
          healthcare. Start your free analysis today.
        </p>

        <div className="mt-16 flex justify-center gap-8 flex-wrap">
          <button
            onClick={() => navigate("/signup")}
            className="px-14 py-6 text-2xl rounded-full bg-white text-green-700 font-bold shadow-xl hover:scale-110 transition"
          >
            Get Started Free →
          </button>

          <button className="px-14 py-6 text-2xl rounded-full border-2 border-white/60 text-white font-semibold hover:bg-white/10 transition">
            Schedule a Demo
          </button>
        </div>

        <p className="mt-10 text-lg text-white/80">
          No credit card required • Free forever for basic features • HIPAA compliant
        </p>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-neutral-900 text-gray-400 px-20 py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          <div>
            <div className="flex items-center gap-3 text-3xl font-extrabold text-white mb-6">
              💚 HealthSync
            </div>

            <p className="text-lg leading-relaxed">
              Empowering patients and doctors with AI-powered health insights.
              Your health data, simplified and secure.
            </p>

            <div className="mt-8 space-y-3 text-lg">
              <p>✉ support@healthsync.com</p>
              <p>📞 +91 1800-123-4567</p>
              <p>📍 Mumbai, India</p>
            </div>
          </div>

          <div>
            <h4 className="text-white text-xl font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-lg">
              <li>Features</li>
              <li>How It Works</li>
              <li>Pricing</li>
              <li>FAQ</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xl font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-lg">
              <li>About Us</li>
              <li>Careers</li>
              <li>Blog</li>
              <li>Press</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xl font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-lg">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>HIPAA Compliance</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-lg">
            © 2024 HealthSync. All rights reserved.
          </p>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">f</div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">🐦</div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">in</div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">📷</div>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function FeatureCard({ icon, title, text }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 hover:scale-105 transition">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-6 text-3xl font-bold">{title}</h3>
      <p className="mt-4 text-xl text-gray-700">{text}</p>
    </div>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 flex gap-4">
      <div className="bg-blue-100 text-blue-500 p-4 rounded-xl text-3xl">{icon}</div>
      <div>
        <h3 className="text-3xl font-bold">{title}</h3>
        <p className="text-gray-600 text-xl">{text}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <h3 className="text-4xl font-extrabold text-teal-600">{value}</h3>
      <p className="text-gray-600 text-xl">{label}</p>
    </div>
  );
}

function WorkCard({ step, icon, title, desc }) {
  return (
    <div className="bg-white shadow-xl rounded-3xl p-10 text-center w-[320px] h-[460px] flex flex-col justify-between hover:scale-105 transition">
      <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
        {step}
      </div>
      <div className="text-6xl">{icon}</div>
      <h3 className="text-3xl font-bold">{title}</h3>
      <p className="text-xl text-gray-700">{desc}</p>
    </div>
  );
}

function Arrow() {
  return <div className="hidden lg:flex text-5xl text-teal-500">➡️</div>;
}

function TestimonialCard({ text, name, role, initials }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 hover:scale-105 transition">
      <div className="text-green-500 text-2xl mb-4">★★★★★</div>
      <p className="text-xl text-gray-700 mb-8">"{text}"</p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
          {initials}
        </div>
        <div>
          <h4 className="text-xl font-bold">{name}</h4>
          <p className="text-gray-600">{role}</p>
        </div>
      </div>
    </div>
  );
}
