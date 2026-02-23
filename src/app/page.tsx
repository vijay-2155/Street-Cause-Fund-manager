import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicBlogPosts } from "@/app/actions/blog";
import { RAZORPAY_PAYMENT_LINK } from "@/lib/constants";
import {
  IndianRupee,
  CalendarDays,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronRight,
  BookOpen,
  Heart,
  ExternalLink,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  // Fetch latest blog posts for landing page
  let blogPosts: any[] = [];
  try {
    const posts = await getPublicBlogPosts();
    blogPosts = (posts || []).slice(0, 3);
  } catch {}

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/icons/logo.png"
              alt="Street Cause Logo"
              width={40}
              height={40}
              className="rounded-xl sm:w-[52px] sm:h-[52px]"
            />
            <span className="text-[#1A1A1A] font-bold text-base sm:text-lg tracking-tight">
              Street Cause
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#6B7280] text-sm font-medium hover:text-[#0066FF] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[#6B7280] text-sm font-medium hover:text-[#0066FF] transition-colors">
              How it works
            </a>
            <a href="#about" className="text-[#6B7280] text-sm font-medium hover:text-[#0066FF] transition-colors">
              About
            </a>
            <Link href="/donate" className="text-[#6B7280] text-sm font-medium hover:text-[#0066FF] transition-colors">
              Donate
            </Link>
            {blogPosts.length > 0 && (
              <Link href="/blog" className="text-[#6B7280] text-sm font-medium hover:text-[#0066FF] transition-colors">
                Blog
              </Link>
            )}
          </div>

          {/* Auth Button */}
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0066FF] rounded-xl hover:bg-[#0052CC] transition-colors"
          >
            Sign In
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — Copy */}
          <div>
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#0066FF] bg-[#E6F2FF] px-3 py-1.5 rounded-full mb-4 sm:mb-6">
              <Zap className="w-3 h-3" />
              Fund Management Platform
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-[#1A1A1A] leading-[1.12] tracking-tight mb-4 sm:mb-5">
              Manage Your Cause,
              <br />
              <span className="text-[#0066FF]">Maximize Your Impact.</span>
            </h1>

            <p className="text-[#6B7280] text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg">
              A purpose-built fund management platform for NGO chapters. Track donations, approve expenses, run events, and maintain full financial transparency.
            </p>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#0066FF] rounded-xl hover:bg-[#0052CC] transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#1A1A1A] border-2 border-[#E5E7EB] rounded-xl hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                "Multi-role access",
                "Expense approvals",
                "Real-time reports",
              ].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-[#059669] bg-[#D1FAE5] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="relative hidden lg:block">
            {/* Outer card */}
            <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl p-5 shadow-xl">
              {/* Topbar */}
              <div className="flex items-center gap-2 mb-5">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="w-3 h-3 rounded-full bg-[#FF6B35]" />
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="ml-2 text-xs font-semibold text-[#6B7280]">
                  Street Cause — Dashboard
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white border border-[#E6F2FF] rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Funds Raised</p>
                  <p className="text-xl font-extrabold text-[#0066FF]">₹2,45,000</p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    <span className="text-[10px] font-semibold text-[#10B981]">+18% this month</span>
                  </div>
                </div>
                <div className="bg-white border border-[#FFF3EE] rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Donations</p>
                  <p className="text-xl font-extrabold text-[#FF6B35]">128</p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    <span className="text-[10px] font-semibold text-[#10B981]">+7 today</span>
                  </div>
                </div>
                <div className="bg-white border border-[#D1FAE5] rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Events</p>
                  <p className="text-xl font-extrabold text-[#10B981]">12</p>
                  <div className="mt-2 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-[#0066FF]" />
                    <span className="text-[10px] font-semibold text-[#0066FF]">3 active</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-[#1A1A1A] mb-3">Recent Activity</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Donation received", name: "Rahul M.", amount: "₹5,000", color: "#10B981", bg: "#D1FAE5" },
                    { label: "Expense approved", name: "Food Drive", amount: "₹1,200", color: "#FF6B35", bg: "#FFF3EE" },
                    { label: "New member", name: "Priya K.", amount: "Coordinator", color: "#8B5CF6", bg: "#F5F3FF" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: item.bg, color: item.color }}>
                          {item.name[0]}
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold text-[#1A1A1A]">{item.label}</p>
                          <p className="text-[10px] text-[#6B7280]">{item.name}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Queue */}
              <div className="bg-[#E6F2FF] border border-[#0066FF]/20 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
                  <div>
                    <p className="text-[11px] font-bold text-[#0066FF]">2 pending approvals</p>
                    <p className="text-[10px] text-[#6B7280]">Review expenses</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#0066FF]">Review →</span>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Live Dashboard
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ───────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "4000+", label: "Volunteers", color: "#0066FF" },
              { value: "14+", label: "Years of Impact", color: "#10B981" },
              { value: "₹50L+", label: "Funds Managed", color: "#FF6B35" },
              { value: "25+", label: "City Chapters", color: "#8B5CF6" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-4xl font-extrabold mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm font-medium text-[#9CA3AF]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0066FF] bg-[#E6F2FF] px-3 py-1.5 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-3 sm:mb-4 tracking-tight">
              Everything your NGO chapter needs
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-lg max-w-2xl mx-auto">
              Built specifically for community organizations that need financial accountability without complexity.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              {
                icon: IndianRupee,
                title: "Track Donations",
                desc: "Record every donation with donor details, payment modes, and generate acknowledgements.",
                color: "#0066FF",
                bg: "#E6F2FF",
                hoverBorder: "hover:border-[#0066FF]",
              },
              {
                icon: ShieldCheck,
                title: "Manage Expenses",
                desc: "Multi-level approval workflow with full audit trail for every rupee spent.",
                color: "#FF6B35",
                bg: "#FFF3EE",
                hoverBorder: "hover:border-[#FF6B35]",
              },
              {
                icon: CalendarDays,
                title: "Event Management",
                desc: "Create events, set targets, track participation, and allocate funds.",
                color: "#10B981",
                bg: "#D1FAE5",
                hoverBorder: "hover:border-[#10B981]",
              },
              {
                icon: FileSpreadsheet,
                title: "Reports & Export",
                desc: "Generate PDF and Excel reports for meetings, audits, and donor transparency.",
                color: "#8B5CF6",
                bg: "#F5F3FF",
                hoverBorder: "hover:border-[#8B5CF6]",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`border-2 border-[#E5E7EB] rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 ${feature.hoverBorder}`}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-5"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] mb-1 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#10B981] bg-[#D1FAE5] px-3 py-1.5 rounded-full mb-4">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
              Up and running in minutes
            </h2>
          </div>

          <div className="relative grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-[#E5E7EB]" />

            {[
              {
                step: "01",
                title: "Set up your club",
                desc: "Create your chapter profile, add your organization details, and configure financial settings.",
                color: "#0066FF",
                bg: "#E6F2FF",
              },
              {
                step: "02",
                title: "Add your team",
                desc: "Invite members and assign roles — Admins, Treasurers, and Coordinators — each with the right access.",
                color: "#10B981",
                bg: "#D1FAE5",
              },
              {
                step: "03",
                title: "Start tracking",
                desc: "Record donations, submit expenses for approval, and generate transparent reports for your chapter.",
                color: "#FF6B35",
                bg: "#FFF3EE",
              },
            ].map((step, i) => (
              <div key={step.step} className="relative text-center">
                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6" style={{ backgroundColor: step.bg }}>
                  <span className="text-xl sm:text-2xl font-extrabold" style={{ color: step.color }}>{step.step}</span>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-10 -right-4 w-8 h-8 items-center justify-center z-20">
                    <ArrowRight className="w-5 h-5 text-[#9CA3AF]" />
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] mb-2 sm:mb-3">{step.title}</h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLE OVERVIEW ───────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#8B5CF6] bg-[#F5F3FF] px-3 py-1.5 rounded-full mb-4">
              Role-based Access
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-3 sm:mb-4 tracking-tight">
              The right access for every role
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-lg max-w-xl mx-auto">
              Granular permissions ensure every team member sees exactly what they need.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                role: "Admin",
                icon: ShieldCheck,
                color: "#0066FF",
                bg: "#E6F2FF",
                perms: ["Full platform access", "Approve/reject expenses", "Manage team members", "Configure club settings", "Export all reports"],
              },
              {
                role: "Treasurer",
                icon: IndianRupee,
                color: "#10B981",
                bg: "#D1FAE5",
                perms: ["Record donations", "Review expense requests", "Generate financial reports", "Manage event funds", "Track payment modes"],
              },
              {
                role: "Coordinator",
                icon: Users,
                color: "#FF6B35",
                bg: "#FFF3EE",
                perms: ["Submit expense requests", "View event details", "Track own submissions", "View fund summary", "Add donation records"],
              },
            ].map((r) => (
              <div key={r.role} className="border border-[#E5E7EB] rounded-2xl p-5 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5" style={{ backgroundColor: r.bg }}>
                  <r.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: r.color }} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] mb-3 sm:mb-4">{r.role}</h3>
                <ul className="space-y-2">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: r.color }} />
                      <span className="text-xs sm:text-sm text-[#6B7280]">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOG SECTION ─────────────────────────────────────────── */}
      {blogPosts.length > 0 && (
        <section className="py-16 sm:py-24 bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0066FF] bg-[#E6F2FF] px-3 py-1.5 rounded-full mb-4">
                From Our Blog
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-3 sm:mb-4 tracking-tight">
                Stories, updates & announcements
              </h2>
              <p className="text-[#6B7280] text-sm sm:text-lg max-w-xl mx-auto">
                Stay up to date with our latest activities, events, and community impact.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {blogPosts.map((post: any) => {
                const categoryColors: Record<string, { bg: string; text: string }> = {
                  announcement: { bg: "#E6F2FF", text: "#0066FF" },
                  story: { bg: "#D1FAE5", text: "#10B981" },
                  update: { bg: "#FFF3EE", text: "#FF6B35" },
                  general: { bg: "#F5F3FF", text: "#8B5CF6" },
                };
                const cat = categoryColors[post.category] || categoryColors.general;

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.id}`}
                    className="group bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-lg hover:border-[#0066FF]/30 transition-all duration-200"
                  >
                    {/* Cover Image */}
                    {post.coverImageUrl ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-[#E6F2FF] to-[#F5F3FF] flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-[#0066FF]/30" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cat.bg, color: cat.text }}
                        >
                          {post.category}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] mb-1.5 group-hover:text-[#0066FF] transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-xs sm:text-sm text-[#6B7280] line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        {post.author?.fullName && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#0066FF] flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">
                                {post.author.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#6B7280] font-medium">{post.author.fullName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* View All Button */}
            <div className="text-center mt-8 sm:mt-12">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#0066FF] border-2 border-[#0066FF] rounded-xl hover:bg-[#0066FF] hover:text-white transition-colors"
              >
                View All Posts
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── DONATE SECTION ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF] via-[#0052CC] to-[#003D99]" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

            <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Support Our Cause
              </h2>
              <p className="text-blue-200 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
                Every rupee makes a difference. Donate securely through Razorpay and help us create lasting impact in communities across India.
              </p>

              {/* Donate Button */}
              <a
                href={RAZORPAY_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-[#0066FF] bg-white rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Heart className="w-5 h-5 text-red-500" />
                Donate Now via Razorpay
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>

              {/* How it works steps */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-10 max-w-md mx-auto">
                {[
                  { step: "1", label: "Click Donate", desc: "Open Razorpay" },
                  { step: "2", label: "Make Payment", desc: "UPI / Card / Net Banking" },
                  { step: "3", label: "Get Receipt", desc: "Instant confirmation" },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1.5 text-white text-xs sm:text-sm font-extrabold">
                      {s.step}
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-white">{s.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-blue-200">{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {["🔒 Secure Payment", "⚡ Instant", "📊 Transparent"].map((badge) => (
                  <span key={badge} className="text-[10px] sm:text-xs font-semibold text-white/80 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MISSION QUOTE ───────────────────────────────────────── */}
      <section id="about" className="bg-[#0066FF] py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left — Quote */}
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <Image src="/icons/logo.png" alt="Street Cause Logo" width={40} height={40} className="rounded-xl sm:w-12 sm:h-12" />
                <span className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-widest">
                  Street Cause
                </span>
              </div>
              <blockquote className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4 sm:mb-6 tracking-tight">
                &ldquo;A life without a Cause,
                <br />
                is a Life without an Effect.&rdquo;
              </blockquote>
              <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
                For over 14 years, Street Cause volunteers across 25 cities have been proving that community action changes lives. This platform is built to amplify that work.
              </p>
            </div>

            {/* Right — Vision image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <Image
                  src="/icons/vision.png"
                  alt="Street Cause Vision"
                  width={600}
                  height={420}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg flex items-center gap-2 sm:gap-3">
                <Image src="/icons/logo.png" alt="Street Cause" width={28} height={28} className="rounded-lg" />
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-[#1A1A1A]">Street Cause</p>
                  <p className="text-[9px] sm:text-[10px] text-[#6B7280]">14+ years of impact</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#0066FF] bg-[#E6F2FF] px-3 py-1.5 rounded-full mb-4 sm:mb-6">
            Get Started Today
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-3 sm:mb-4 tracking-tight">
            Ready to manage your cause?
          </h2>
          <p className="text-[#6B7280] text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
            Join chapters already using this platform to track every donation, approve every expense, and prove their impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-[#0066FF] rounded-xl hover:bg-[#0052CC] transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-[#1A1A1A] border-2 border-[#E5E7EB] rounded-xl hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
            >
              Read Our Blog
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-[#1A1A1A] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/icons/logo.png" alt="Street Cause Logo" width={28} height={28} className="rounded-lg" />
                <span className="text-white font-bold text-base">Street Cause</span>
              </div>
              <p className="text-[#6B7280] text-sm">Fund Manager — Built for community impact.</p>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6">
              <a href="#features" className="text-[#6B7280] text-sm hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#6B7280] text-sm hover:text-white transition-colors">How it works</a>
              <Link href="/donate" className="text-[#6B7280] text-sm hover:text-white transition-colors">Donate</Link>
              <Link href="/blog" className="text-[#6B7280] text-sm hover:text-white transition-colors">Blog</Link>
              <Link href="/sign-in" className="text-[#6B7280] text-sm hover:text-white transition-colors">Sign In</Link>
              <Link href="/privacy" className="text-[#6B7280] text-sm hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 sm:pt-8 space-y-2">
            <p className="text-[#4B5563] text-xs text-center">
              © 2026 Street Cause. All rights reserved. Built with ❤️ for community impact.
            </p>
            <p className="text-[#4B5563] text-xs text-center">
              Designed &amp; built by{" "}
              <span className="text-[#6B7280] font-semibold hover:text-white transition-colors cursor-default">
                Vijay Kumar Tholeti
              </span>{" "}
              for Street Cause 🚀
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
