import { siteContent } from '@/lib/content/siteContent';

export function NarrativeSections() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-zinc-200">
      <div id="what-is" className="space-y-3">
        <h2 className="text-3xl font-bold text-white">What Is Eido?</h2>
        <p className="text-zinc-300 max-w-3xl">{siteContent.whatIsEido}</p>
      </div>

      <div id="story" className="space-y-3">
        <h2 className="text-3xl font-bold text-white">Story / Why We&apos;re Building This</h2>
        <p className="text-zinc-300 max-w-3xl">{siteContent.story}</p>
      </div>

      <div id="how-it-works" className="space-y-4">
        <h2 className="text-3xl font-bold text-white">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {siteContent.howItWorks.map((step, index) => (
            <div key={step} className="border border-white/10 bg-black/30 rounded-xl p-4">
              <div className="text-xs font-mono text-primary mb-2">STEP {index + 1}</div>
              <p className="text-sm text-zinc-200">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="roadmap" className="space-y-4">
        <h2 className="text-3xl font-bold text-white">Roadmap + Milestones</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {siteContent.roadmap.map((item) => (
            <div key={item.phase} className="border border-white/10 bg-black/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg text-white font-semibold">{item.phase}</h3>
                <span className="text-xs px-2 py-1 rounded border border-primary/30 text-primary">{item.status}</span>
              </div>
              <p className="text-sm text-zinc-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="faq" className="space-y-4">
        <h2 className="text-3xl font-bold text-white">FAQ</h2>
        <div className="space-y-3">
          {siteContent.faq.map((item) => (
            <div key={item.q} className="border border-white/10 bg-black/30 rounded-xl p-4">
              <h3 className="text-white font-semibold">{item.q}</h3>
              <p className="text-sm text-zinc-300 mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
