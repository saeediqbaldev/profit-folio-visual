import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Zap, 
  ChevronRight, 
  Check,
  Plus,
  Minus,
  Menu,
  X,
  ArrowRight,
  LineChart,
  PieChart,
  Target,
  BookOpen,
  Users
} from "lucide-react";

interface LandingPageProps {
  onNavigateToAuth?: () => void;
}

const LandingPage = ({ onNavigateToAuth }: LandingPageProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [animatedStats, setAnimatedStats] = useState({ trades: 0, users: 0, winRate: 0 });

  const handleAuthClick = () => {
    if (onNavigateToAuth) {
      onNavigateToAuth();
    } else {
      sessionStorage.setItem('skip-landing', 'true');
      window.location.reload();
    }
  };

  // Animated counter effect
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        trades: Math.floor(50000 * progress),
        users: Math.floor(2500 * progress),
        winRate: Math.floor(67 * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: BookOpen, title: "Trade Journal", description: "Log every trade with detailed entries, screenshots, and notes for comprehensive analysis." },
    { icon: LineChart, title: "Performance Analytics", description: "Visualize your trading patterns with advanced charts and metrics." },
    { icon: Target, title: "Strategy Tracking", description: "Track multiple strategies and compare their performance over time." },
    { icon: Shield, title: "Secure & Private", description: "Your trading data is encrypted and securely stored in the cloud." },
  ];

  const faqs = [
    { q: "What is a trading journal?", a: "A trading journal is a record-keeping tool that helps traders document their trades, analyze performance, and improve their strategies over time." },
    { q: "Is my data secure?", a: "Yes, we use industry-standard encryption and secure cloud infrastructure to protect your trading data." },
    { q: "Can I track multiple strategies?", a: "Absolutely! You can create and track multiple trading strategies, comparing their performance side by side." },
    { q: "Is there a mobile app?", a: "Our web app is fully responsive and works great on mobile devices. A dedicated mobile app is coming soon." },
    { q: "Can I export my data?", a: "Yes, you can export your trading data in various formats for further analysis or backup." },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-primary to-primary-glow rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">TradeJournal</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {['Home', 'Features', 'Stats', 'FAQs', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={handleAuthClick}>Sign In</Button>
              <Button onClick={handleAuthClick} className="bg-gradient-to-r from-primary to-primary-glow">
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border p-4 space-y-4 animate-fade-in">
            {['Home', 'Features', 'Stats', 'FAQs', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="block w-full text-left py-2 text-muted-foreground hover:text-foreground"
              >
                {item}
              </button>
            ))}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleAuthClick}>Sign In</Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-primary-glow" onClick={handleAuthClick}>
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 text-amber-500/20 animate-bounce" style={{ animationDuration: '3s' }}>
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div className="absolute top-40 right-20 w-16 h-16 text-slate-400/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div className="absolute bottom-40 left-1/4 w-12 h-12 text-orange-500/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="absolute top-60 right-1/3 w-14 h-14 text-blue-500/20 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }}>
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 22,12 12,22 2,12"/></svg>
          </div>
          
          {/* Chart Visual */}
          <div className="absolute bottom-20 right-10 w-64 h-40 opacity-10">
            <svg viewBox="0 0 100 50" className="text-primary">
              <polyline fill="none" stroke="currentColor" strokeWidth="2" points="0,40 20,35 40,25 60,30 80,15 100,20"/>
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Trusted by 2,500+ traders</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Master Your Trading with
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent"> Smart Journaling</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Track, analyze, and improve your trading performance with our comprehensive journal platform. 
            Built for serious traders who want to level up their game.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" onClick={handleAuthClick} className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all group">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollToSection('features')}>
              See Features
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Floating Chart Preview */}
          <div className="mt-16 relative">
            <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-success/80"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Performance Overview</span>
                </div>
                <div className="flex gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <div className="h-48 bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-end justify-around p-4 gap-2">
                {[60, 40, 75, 55, 80, 45, 70, 90, 65, 85, 50, 95].map((height, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t transition-all duration-500 ${i % 2 === 0 ? 'bg-primary' : 'bg-accent-blue'}`}
                    style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-primary">Trade Smarter</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you track, analyze, and improve your trading performance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary-glow/10 rounded-3xl p-8 sm:p-12">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-bold text-primary">{animatedStats.trades.toLocaleString()}+</div>
                <p className="text-muted-foreground">Trades Logged</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-bold text-primary">{animatedStats.users.toLocaleString()}+</div>
                <p className="text-muted-foreground">Active Traders</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-bold text-primary">{animatedStats.winRate}%</div>
                <p className="text-muted-foreground">Avg. Win Rate Improvement</p>
              </div>
            </div>
          </div>

          {/* Asset Icons */}
          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            {['Gold', 'Silver', 'BTC', 'ETH'].map((asset, i) => (
              <div key={asset} className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  asset === 'Gold' ? 'bg-amber-500/20 text-amber-500' :
                  asset === 'Silver' ? 'bg-slate-400/20 text-slate-400' :
                  asset === 'BTC' ? 'bg-orange-500/20 text-orange-500' :
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  <span className="font-bold text-sm">{asset === 'Gold' ? 'Au' : asset === 'Silver' ? 'Ag' : asset}</span>
                </div>
                <span className="text-xs text-muted-foreground">{asset}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-border/50 rounded-xl overflow-hidden bg-card">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  {openFaq === index ? <Minus className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-muted-foreground animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have improved their performance with our trading journal. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleAuthClick} className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant">
              <Users className="mr-2 h-5 w-5" />
              Create Free Account
            </Button>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-primary to-primary-glow rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">TradeJournal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 TradeJournal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
