"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLanguage } from "@/contexts/LanguageContext"

export default function MarketingPage() {
  const { t } = useLanguage()
  return (
    <main className="min-h-screen bg-gradient-to-br from-impact-light to-white">
      {/* Header */}
      <header className="border-b border-impact-dark/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-impact-dark">RevImpact</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Link href="https://app.revimpact.nl/signin">
                <Button>{t.signIn}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-impact-dark mb-6">
            {t.marketing.hero.title.split(' ').slice(0, -1).join(' ')}
            <span className="text-impact-blue block">{t.marketing.hero.title.split(' ').slice(-1)[0]}</span>
          </h1>
          <p className="text-xl md:text-2xl text-impact-dark/80 mb-8 max-w-3xl mx-auto">
            {t.marketing.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://app.revimpact.nl/signin">
              <Button size="lg" className="text-lg px-8 py-4">
                {t.marketing.hero.ctaPrimary}
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
              {t.marketing.hero.ctaSecondary}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-impact-dark mb-4">
              Everything you need to measure customer impact
            </h2>
            <p className="text-xl text-impact-dark/70 max-w-2xl mx-auto">
              From data upload to actionable insights, RevImpact helps you understand and improve customer success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-impact-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Data Upload</h3>
              <p className="text-impact-dark/70">
                Upload Excel or CSV files and let our AI automatically map your customer data fields.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-impact-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered QBRs</h3>
              <p className="text-impact-dark/70">
                Generate comprehensive Quarterly Business Reviews automatically from your customer data.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-impact-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Impact Analytics</h3>
              <p className="text-impact-dark/70">
                Track customer success metrics and identify opportunities for growth and retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-impact-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-impact-dark mb-4">
              How it works
            </h2>
            <p className="text-xl text-impact-dark/70">
              Get started in minutes, not months
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-impact-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Your Data</h3>
              <p className="text-impact-dark/70">
                Import your customer data from Excel or CSV files. Our system automatically detects and maps your data fields.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-impact-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Generate QBRs</h3>
              <p className="text-impact-dark/70">
                Create comprehensive Quarterly Business Reviews with AI-powered insights and recommendations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-impact-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Impact</h3>
              <p className="text-impact-dark/70">
                Monitor customer success metrics and make data-driven decisions to improve retention and growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-impact-blue text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to make customer impact measurable?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join forward-thinking companies that are already using RevImpact to drive customer success.
          </p>
          <Link href="https://app.revimpact.nl/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-impact-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">RevImpact</h3>
              <p className="text-white/70">
                Make customer impact measurable with AI-powered insights.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 RevImpact. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
