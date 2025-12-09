'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Shield, 
  Brain,
  ArrowRight,
  Check,
  Star,
  BookOpen,
  GraduationCap,
  Sparkles,
  Zap,
  ArrowDown
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: GraduationCap,
      title: 'Learn How Technical Indicators Work',
      description: 'We don\'t just give you signals—we teach you how each indicator works. Understand SMA, EMA, RSI, MACD, and Bollinger Bands with detailed explanations, visualizations, and real-world examples.',
      color: 'from-blue-500 via-cyan-500 to-teal-500',
      delay: 0.1
    },
    {
      icon: Brain,
      title: 'AI-Powered Trading Signals',
      description: 'Get intelligent buy/sell/hold recommendations based on technical analysis. Every signal comes with explanations of which indicators triggered it and why.',
      color: 'from-purple-500 via-pink-500 to-rose-500',
      delay: 0.2
    },
    {
      icon: Target,
      title: 'Strategic Portfolio Management',
      description: 'Organize investments into goal-based portfolios with different risk profiles and time horizons.',
      color: 'from-green-500 via-emerald-500 to-teal-500',
      delay: 0.3
    },
    {
      icon: BarChart3,
      title: 'Backtesting & Paper Trading',
      description: 'Test your strategies on historical data before risking real money. Perfect your approach with paper trading.',
      color: 'from-indigo-500 via-purple-500 to-violet-500',
      delay: 0.4
    },
    {
      icon: Shield,
      title: 'Risk Management Tools',
      description: 'Built-in position sizing, portfolio risk limits, and performance tracking to protect your capital.',
      color: 'from-teal-500 via-cyan-500 to-blue-500',
      delay: 0.5
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Detailed P/L tracking, profit/loss analysis, and portfolio performance metrics across all your investments.',
      color: 'from-yellow-500 via-orange-500 to-red-500',
      delay: 0.6
    }
  ];

  const differentiators = [
    {
      title: 'Traditional Trading Platforms',
      items: [
        'Just buy and sell stocks',
        'Black-box signals (no explanation)',
        'Basic charts and prices',
        'No strategy testing',
        'Limited portfolio insights'
      ],
      color: 'text-slate-400'
    },
    {
      title: 'Horizon Trading',
      items: [
        'Learn how each indicator works (SMA, EMA, RSI, MACD, etc.)',
        'Understand why signals are generated',
        'Technical analysis with detailed explanations',
        'Backtest strategies before trading',
        'Paper trade risk-free',
        'Comprehensive portfolio analytics',
        'Goal-based portfolio management'
      ],
      color: 'text-green-400'
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="p-2.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-green-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Horizon
              </span>
            </motion.div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="hover:bg-slate-800/50"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/20"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30 rounded-full mb-8 backdrop-blur-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-300">Technical Analysis & Portfolio Management Platform</span>
          </motion.div>
          
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
              Trade Smarter,
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent animate-gradient">
              Not Harder
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Horizon isn't just another trading platform. We don't just give signals—we{' '}
            <span className="text-green-400 font-semibold relative">
              <span className="absolute inset-0 bg-green-500/20 blur-xl"></span>
              <span className="relative">teach how technical indicators work</span>
            </span>
            {', '}
            provide{' '}
            <span className="text-blue-400 font-semibold relative">
              <span className="absolute inset-0 bg-blue-500/20 blur-xl"></span>
              <span className="relative">intelligent portfolio management</span>
            </span>
            {', '}and enable{' '}
            <span className="text-purple-400 font-semibold relative">
              <span className="absolute inset-0 bg-purple-500/20 blur-xl"></span>
              <span className="relative">strategy backtesting</span>
            </span>
            {' '}to make you a smarter investor.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="text-lg px-10 py-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-2xl shadow-green-500/30 hover:shadow-green-500/40 transition-all duration-300 group"
            >
              Start Trading Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push('/login')}
              className="text-lg px-10 py-6 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all duration-300"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="flex flex-col items-center gap-2 text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <span className="text-sm">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GlassCard className="p-8 h-full border-2 border-transparent hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Comparison Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            More Than Just{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trading
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            See how Horizon goes beyond basic buy/sell functionality to give you a complete investment management solution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {differentiators.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <GlassCard className={`p-10 h-full border-2 ${section.color === 'text-green-400' ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5' : 'border-slate-700/50'}`}>
                <h3 className={`text-3xl font-bold mb-8 ${section.color}`}>
                  {section.title}
                </h3>
                <ul className="space-y-5">
                  {section.items.map((item, itemIndex) => (
                    <motion.li 
                      key={itemIndex} 
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: itemIndex * 0.1 }}
                    >
                      {section.color === 'text-green-400' ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-green-500/30">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-slate-300 text-lg leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            How <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Horizon</span> Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Create Portfolio', desc: 'Set up goal-based portfolios with your risk profile', icon: Target },
            { step: '2', title: 'Analyze Markets', desc: 'Use technical indicators to identify trading opportunities', icon: BarChart3 },
            { step: '3', title: 'Test Strategies', desc: 'Backtest on historical data before risking capital', icon: Brain },
            { step: '4', title: 'Execute & Track', desc: 'Trade with confidence and monitor performance', icon: TrendingUp }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative"
              >
                <GlassCard className="p-8 text-center border-2 border-transparent hover:border-blue-500/30 transition-all duration-500 group">
                  {/* Connecting line (desktop only) */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent -z-10" />
                  )}
                  
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-500/30 group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-500">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Educational Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full mb-6 backdrop-blur-sm">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Educational Platform</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              We Don't Just Give Signals—<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                We Teach You
              </span>
            </h2>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Unlike other platforms that treat technical indicators as a black box, Horizon explains exactly how each indicator works. When you see a buy signal, you'll understand:
            </p>
            <ul className="space-y-4 mb-8">
              {[
                'What each indicator calculates (SMA, EMA, RSI, MACD, Bollinger Bands)',
                'How the indicator is derived from price data',
                'What the indicator values mean in real market terms',
                'Why the indicator triggered a specific signal',
                'Visual representations of indicator calculations'
              ].map((item, index) => (
                <motion.li 
                  key={index} 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-green-500/30">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-300 text-lg leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
            <p className="text-lg text-slate-300">
              <span className="text-blue-400 font-semibold">Learn by doing</span>—understand technical analysis while you trade, not just follow blind signals.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.02 }}
          >
            <GlassCard className="p-10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/20 shadow-2xl">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    Example: RSI Indicator
                  </h3>
                  <p className="text-slate-300 mb-4 leading-relaxed">
                    When RSI shows 75, Horizon explains:
                  </p>
                  <ul className="space-y-3 text-sm text-slate-400 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>RSI = Relative Strength Index (0-100 scale)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>Calculated from average gains vs losses over 14 periods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>75 means stock is overbought (70+ threshold)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>This suggests a potential sell signal</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t border-slate-700/50 pt-8">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Example: MACD Crossover
                  </h3>
                  <p className="text-slate-300 mb-4 leading-relaxed">
                    When MACD crosses above signal line, Horizon shows:
                  </p>
                  <ul className="space-y-3 text-sm text-slate-400 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>MACD = Moving Average Convergence Divergence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Shows relationship between 12-day and 26-day EMAs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Crossover indicates momentum shift</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>This triggers a buy signal with explanation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <GlassCard className="p-16 text-center bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-green-500/30 shadow-2xl shadow-green-500/20 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 animate-pulse" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to Elevate Your{' '}
                <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Trading?
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join Horizon today and experience the difference between trading and intelligent portfolio management.{' '}
                <span className="text-blue-400 font-semibold">Learn how technical indicators work</span> while you trade.
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  size="lg"
                  onClick={() => router.push('/register')}
                  className="text-lg px-12 py-7 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-2xl shadow-green-500/40 hover:shadow-green-500/50 transition-all duration-300 group"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                Start with $10,000 in paper money • No credit card required
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-xl py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-green-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Horizon Trading
              </span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Horizon Trading. All rights reserved. Powered by Alpha Vantage API.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
