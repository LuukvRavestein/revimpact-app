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
                <Button>{t.navSignIn}</Button>
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
              {t.marketing.features.title}
            </h2>
            <p className="text-xl text-impact-dark/70 max-w-2xl mx-auto">
              {t.marketing.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-impact-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.marketing.features.smartUpload.title}</h3>
              <p className="text-impact-dark/70">
                {t.marketing.features.smartUpload.description}
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-impact-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.marketing.features.aiQbr.title}</h3>
              <p className="text-impact-dark/70">
                {t.marketing.features.aiQbr.description}
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-impact-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.marketing.features.impactAnalytics.title}</h3>
              <p className="text-impact-dark/70">
                {t.marketing.features.impactAnalytics.description}
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
              {t.marketing.howItWorks.title}
            </h2>
            <p className="text-xl text-impact-dark/70">
              {t.marketing.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-impact-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.marketing.howItWorks.step1.title}</h3>
              <p className="text-impact-dark/70">
                {t.marketing.howItWorks.step1.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-impact-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.marketing.howItWorks.step2.title}</h3>
              <p className="text-impact-dark/70">
                {t.marketing.howItWorks.step2.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-impact-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">{t.marketing.howItWorks.step3.title}</h3>
              <p className="text-impact-dark/70">
                {t.marketing.howItWorks.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-impact-blue text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            {t.marketing.cta.title}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t.marketing.cta.subtitle}
          </p>
          <Link href="https://app.revimpact.nl/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              {t.marketing.cta.button}
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
              <h4 className="font-semibold mb-4">{t.marketing.footer.product}</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">{t.marketing.footer.features}</a></li>
                <li><a href="#" className="hover:text-white">{t.marketing.footer.pricing}</a></li>
                <li><a href="#" className="hover:text-white">{t.marketing.footer.api}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.marketing.footer.company}</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">{t.marketing.footer.about}</a></li>
                <li><a href="#" className="hover:text-white">{t.marketing.footer.blog}</a></li>
                <li><a href="#" className="hover:text-white">{t.marketing.footer.careers}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.marketing.footer.support}</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">{t.marketing.footer.helpCenter}</a></li>
                <li><a href="#" className="hover:text-white">{t.marketing.footer.contact}</a></li>
                <li><a href="#" className="hover:text-white">{t.marketing.footer.status}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>{t.marketing.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
