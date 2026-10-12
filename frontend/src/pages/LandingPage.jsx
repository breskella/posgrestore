import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  ShieldCheckIcon,
  ZapIcon,
  CloudIcon,
  DownloadIcon,
  LayoutDashboardIcon,
  ArrowRightIcon,
  SparklesIcon,
  MailIcon,
  SendIcon,
  LockIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Code2Icon,
} from "lucide-react";
import emailjs from "@emailjs/browser";


/* ─── Tiny scroll-reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/* ─── Feature card data ─── */
const FEATURES = [
  {
    icon: ZapIcon,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "hover:shadow-amber-500/20",
    title: "Lightning-Fast Performance",
    desc: "Optimistic UI updates give instant feedback before the server responds. Image previews load locally before upload completes.",
    badges: ["Optimistic Updates", "Image Previews"],
  },
  {
    icon: ShieldCheckIcon,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "hover:shadow-emerald-500/20",
    title: "Secure Authentication",
    desc: "Enterprise-grade security: bcrypt hashing, Helmet HTTP headers, CORS policies, and Arcjet rate limiting out of the box.",
    badges: ["bcrypt", "Helmet", "CORS", "Arcjet"],
  },
  {
    icon: CloudIcon,
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "hover:shadow-sky-500/20",
    title: "Cloud Storage",
    desc: "Cloudinary integration delivers fast, auto-optimized image uploads with smart compression and global CDN delivery.",
    badges: ["Cloudinary CDN", "Auto-Optimize"],
  },
  {
    icon: DownloadIcon,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "hover:shadow-violet-500/20",
    title: "Data Export",
    desc: "Generate and download instant CSV reports of your entire inventory for offline analysis and business reporting.",
    badges: ["Instant CSV", "Full Inventory"],
  },
  {
    icon: LayoutDashboardIcon,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    glow: "hover:shadow-rose-500/20",
    title: "Intuitive Dashboard",
    desc: "A responsive, DaisyUI-powered interface with theme switching, sort/filter, pagination, and real-time search.",
    badges: ["Responsive", "Theme Switching"],
  },
  {
    icon: BarChart3Icon,
    color: "from-cyan-500 to-indigo-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    glow: "hover:shadow-cyan-500/20",
    title: "PostgreSQL + Neon",
    desc: "Serverless PostgreSQL on Neon with connection pooling. Robust relational data with real-time activity tracking.",
    badges: ["Neon DB", "Pooled Connections"],
  },
];

const STATS = [
  { value: "100%", label: "Uptime Target" },
  { value: "< 200ms", label: "Avg API Response" },
  { value: "PERN", label: "Stack" },
  { value: "JWT + bcrypt", label: "Auth Security" },
];

const TECH_PILLS = [
  "React 19", "Vite", "Tailwind CSS", "DaisyUI", "Zustand",
  "Node.js", "Express", "PostgreSQL", "Neon DB",
  "Cloudinary", "Arcjet", "JWT", "bcrypt", "Helmet",
];

/* ─────────────────────────────────────────────────────────────── */

const LandingPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    emailjs
      .send(
        "service_3bboead",
        "template_lrae4p6",
        { name: formData.name, email: formData.email, message: formData.message },
        "5UDLFuwD1_X71xDbQ"
      )
      .then(() => {
        setLoading(false);
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      })
      .catch(() => {
        setLoading(false);
        alert("Failed to send message. Please try again.");
      });
  };

  /* Reveal refs */
  const [statsRef, statsVisible] = useReveal();
  const [featuresRef, featuresVisible] = useReveal(0.05);
  const [techRef, techVisible] = useReveal();
  const [whyRef, whyVisible] = useReveal();
  const [contactRef, contactVisible] = useReveal();

  return (
    <div className="min-h-screen bg-base-300 flex flex-col overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 w-full z-50 px-5 md:px-12 flex items-center justify-between transition-all duration-300 ${
          isScrolled
            ? "bg-base-100/70 backdrop-blur-xl shadow-lg border-b border-base-content/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-colors duration-300">
            <ShoppingCartIcon className="size-5 text-primary" />
          </div>
          <span className="text-lg font-extrabold font-mono tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            POSGRESTORE
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-base-content/70">
          {[["#features", "Features"], ["#tech", "Tech Stack"], ["#contact", "Contact"]].map(
            ([href, label]) => (
              <a
                key={label}
                href={href}
                className="relative py-1 hover:text-primary transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {label}
              </a>
            )
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="btn btn-ghost btn-sm font-semibold">
            Login
          </Link>
          <Link
            to="/signup"
            className="btn btn-primary btn-sm relative overflow-hidden btn-shine shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-200"
          >
            Get Started <ArrowRightIcon className="size-4 ml-1" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden btn btn-ghost btn-sm"
          onClick={() => setMobileMenuOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          <div className="flex flex-col gap-1.5 w-5">
            <span className={`block h-0.5 bg-base-content transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 bg-base-content transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-base-content transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-base-100/95 backdrop-blur-xl border-b border-base-content/10 shadow-xl p-5 flex flex-col gap-4 md:hidden">
            {[["#features", "Features"], ["#tech", "Tech Stack"], ["#contact", "Contact"]].map(
              ([href, label]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base-content/80 hover:text-primary font-medium transition-colors"
                >
                  {label}
                </a>
              )
            )}
            <div className="flex gap-3 pt-2 border-t border-base-content/10">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost btn-sm flex-1">Login</Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm flex-1">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-5 pt-28 pb-20 overflow-hidden text-center">
        {/* Animated blobs */}
        <div className="blob absolute top-[-80px] left-[-100px] w-[420px] h-[420px] bg-primary/15 blur-3xl pointer-events-none opacity-70" />
        <div className="blob absolute bottom-[-60px] right-[-80px] w-[380px] h-[380px] bg-secondary/15 blur-3xl pointer-events-none opacity-60" style={{ animationDelay: "2s" }} />
        <div className="blob absolute top-1/2 left-1/3 w-[260px] h-[260px] bg-accent/10 blur-3xl pointer-events-none opacity-50" style={{ animationDelay: "4s" }} />

        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle, hsl(var(--bc)) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="hero-animate hero-animate-delay-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-8 shadow-sm">
            <SparklesIcon className="size-3.5" style={{ animation: "spin 3s linear infinite" }} />
            Full-Stack PERN Product Management Platform
            <SparklesIcon className="size-3.5" />
          </div>

          {/* Floating icon */}
          <div className="float-anim hero-animate hero-animate-delay-1 flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-secondary blur-xl opacity-40 scale-110" />
              <div className="relative p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm">
                <ShoppingCartIcon className="size-14 text-primary drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="hero-animate hero-animate-delay-2 text-5xl md:text-7xl lg:text-8xl font-extrabold font-mono tracking-wider leading-none mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary gradient-text-anim">
              POSGRESTORE
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="hero-animate hero-animate-delay-3 text-base md:text-xl text-base-content/65 max-w-2xl mx-auto leading-relaxed mb-4">
            The{" "}
            <span className="text-primary font-semibold">secure</span>,{" "}
            <span className="text-secondary font-semibold">high-performance</span> inventory dashboard built on the PERN stack — manage products at the speed of thought.
          </p>

          <p className="hero-animate hero-animate-delay-3 text-sm text-base-content/40 mb-10 max-w-xl mx-auto">
            Optimistic updates · Cloudinary images · CSV exports · JWT auth · bcrypt · Arcjet rate limiting
          </p>

          {/* CTA buttons */}
          <div className="hero-animate hero-animate-delay-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="btn btn-primary btn-lg relative overflow-hidden btn-shine gap-2 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              <LockIcon className="size-5" />
              Login to Dashboard
              <ArrowRightIcon className="size-5" />
            </Link>
            <Link
              to="/signup"
              className="btn btn-outline btn-lg gap-2 hover:bg-base-content/5 border-base-content/20 transition-all duration-200"
            >
              Create Free Account
              <ChevronRightIcon className="size-5" />
            </Link>
          </div>

          {/* Trust signals */}
          <div className="hero-animate hero-animate-delay-4 mt-12 flex flex-wrap items-center justify-center gap-5 text-xs text-base-content/40 font-medium">
            {["No credit card required", "Production-ready stack", "Open source"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2Icon className="size-3.5 text-success" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-40">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-base-content/50">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-base-content/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-base-content/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ═══════════════════════════════════════════ */}
      <div
        ref={statsRef}
        className={`border-y border-base-content/10 bg-base-100/40 backdrop-blur-sm py-10 px-5 lp-hidden ${statsVisible ? "lp-visible" : ""}`}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="flex flex-col gap-1" style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="text-2xl md:text-3xl font-extrabold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                {value}
              </span>
              <span className="text-xs text-base-content/50 uppercase tracking-widest font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-5">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div
            ref={featuresRef}
            className={`text-center mb-16 lp-hidden ${featuresVisible ? "lp-visible" : ""}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mb-5">
              <SparklesIcon className="size-3.5" /> Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold font-mono leading-tight mb-4">
              Everything you need to{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                run your store
              </span>
            </h2>
            <p className="text-base-content/55 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Built with modern technologies, POSGRESTORE combines speed, security, and simplicity into one powerful platform.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, bg, border, glow, title, desc, badges }, idx) => (
              <div
                key={title}
                className={`feature-card group relative rounded-2xl border ${border} ${bg} p-7 cursor-default
                  hover:-translate-y-2 hover:shadow-2xl ${glow}
                  transition-all duration-300 ease-out overflow-hidden
                  lp-hidden ${featuresVisible ? "lp-visible" : ""}`}
                style={{ transitionDelay: featuresVisible ? `${idx * 85}ms` : "0ms" }}
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${color} mb-5 shadow-lg`}>
                  <Icon className="size-6 text-white drop-shadow" />
                </div>

                <h3 className="text-lg font-bold mb-2.5 text-base-content">{title}</h3>
                <p className="text-sm text-base-content/55 leading-relaxed mb-4">{desc}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <span
                      key={b}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${color} text-white/90 shadow-sm`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TECH STACK PILLS ════════════════════════════════════ */}
      <section
        id="tech"
        ref={techRef}
        className={`py-20 px-5 bg-base-100/30 backdrop-blur-sm border-y border-base-content/10 lp-hidden ${techVisible ? "lp-visible" : ""}`}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Code2Icon className="size-3.5" /> Tech Stack
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold font-mono mb-4">
            Built with the{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              best tools
            </span>
          </h2>
          <p className="text-base-content/50 text-sm md:text-base mb-10 max-w-xl mx-auto">
            Every layer of the stack is chosen for performance, developer experience, and reliability.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {TECH_PILLS.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-base-100 border border-base-content/10 text-sm font-semibold text-base-content/70 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-default shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY POSGRESTORE ═════════════════════════════════════ */}
      <section
        ref={whyRef}
        className={`py-24 px-5 lp-hidden ${whyVisible ? "lp-visible" : ""}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold mb-6">
                <CheckCircle2Icon className="size-3.5" /> Why POSGRESTORE
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold font-mono mb-5 leading-tight">
                Designed for store owners who{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                  demand more
                </span>
              </h2>
              <p className="text-base-content/60 text-base leading-relaxed mb-8">
                Most dashboards sacrifice either speed or security. POSGRESTORE is engineered from the ground up to deliver both — a snappy, responsive UI backed by a hardened API layer.
              </p>
              <ul className="space-y-3.5">
                {[
                  "Instant UI updates with zero latency feel",
                  "Military-grade authentication & session handling",
                  "Automatic image optimization via Cloudinary CDN",
                  "One-click CSV export for inventory reports",
                  "Real-time activity feed & audit trail",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-base-content/70">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link to="/signup" className="btn btn-primary gap-2 shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-200">
                  Start for Free <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>

            {/* Right: mock dashboard preview */}
            <div className="relative">
              <div className="blob absolute -top-8 -right-8 w-56 h-56 bg-primary/15 blur-3xl pointer-events-none" />
              <div className="relative bg-base-100/80 backdrop-blur-xl border border-base-content/10 rounded-3xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-sm text-base-content/80">Inventory Overview</span>
                  <span className="badge badge-success badge-sm">Live</span>
                </div>
                {[
                  { name: "Running Shoes X9", price: "$129.99", stock: 42, color: "text-emerald-500" },
                  { name: "Leather Backpack Pro", price: "$89.00", stock: 17, color: "text-amber-500" },
                  { name: "Wireless Earbuds", price: "$59.99", stock: 0, color: "text-rose-500" },
                  { name: "Smart Water Bottle", price: "$34.50", stock: 88, color: "text-sky-500" },
                ].map(({ name, price, stock, color }) => (
                  <div key={name} className="flex items-center justify-between py-3 border-b border-base-content/8 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-base-content/85">{name}</p>
                      <p className="text-xs text-base-content/45">{price}</p>
                    </div>
                    <span className={`text-xs font-bold ${color}`}>
                      {stock === 0 ? "Out of stock" : `${stock} in stock`}
                    </span>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button className="btn btn-primary btn-xs flex-1">+ Add Product</button>
                  <button className="btn btn-ghost btn-xs">Export CSV</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTACT ═════════════════════════════════════════════ */}
      <section
        id="contact"
        ref={contactRef}
        className={`relative py-24 px-5 bg-base-100/50 backdrop-blur-xl border-t border-base-content/10 overflow-hidden lp-hidden ${contactVisible ? "lp-visible" : ""}`}
      >
        <div className="blob absolute -top-20 right-1/4 w-72 h-72 bg-primary/12 blur-3xl pointer-events-none" />
        <div className="blob absolute -bottom-20 left-1/4 w-72 h-72 bg-secondary/12 blur-3xl pointer-events-none" style={{ animationDelay: "3s" }} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4 shadow-inner">
              <MailIcon className="size-7 text-primary animate-bounce" />
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold font-mono mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Get in Touch
            </h2>
            <p className="text-base-content/55 text-sm md:text-base max-w-lg mx-auto">
              Want to subscribe POSGRESTORE for your store or have a question? Drop us a message and we'll get back to you quickly.
            </p>
          </div>

          <div className="card bg-base-100/80 backdrop-blur-xl border border-base-content/10 shadow-2xl rounded-3xl p-6 md:p-10 relative overflow-hidden">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-lg animate-bounce">
                  ✓
                </div>
                <h3 className="text-2xl font-bold">Message Sent!</h3>
                <p className="text-base-content/55 text-sm">Thank you for reaching out. We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text font-semibold text-xs uppercase tracking-wider">Name / Store</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmed (Supermarket)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input input-bordered w-full bg-base-200/50 focus:input-primary transition-all duration-300 focus:scale-[1.01]"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text font-semibold text-xs uppercase tracking-wider">Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="store@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input input-bordered w-full bg-base-200/50 focus:input-primary transition-all duration-300 focus:scale-[1.01]"
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label className="label pb-1.5">
                    <span className="label-text font-semibold text-xs uppercase tracking-wider">Message</span>
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="I want to subscribe my store to POSGRESTORE..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="textarea textarea-bordered w-full bg-base-200/50 focus:textarea-primary transition-all duration-300 focus:scale-[1.005]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full gap-2 text-base font-semibold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-200 relative overflow-hidden btn-shine"
                >
                  <SendIcon className="size-4" />
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-base-content/10 bg-base-100 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-base-content/40">
          <div className="flex items-center gap-2 font-bold font-mono tracking-widest text-base-content/60">
            <ShoppingCartIcon className="size-4 text-primary" />
            POSGRESTORE
          </div>
          <p>© 2026 POSGRESTORE. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-primary transition-colors">Sign Up</Link>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
