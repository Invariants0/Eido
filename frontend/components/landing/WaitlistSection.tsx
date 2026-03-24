'use client';

import { FormEvent, useState } from 'react';

import { WaitlistAPI } from '@/lib/api/waitlist.api';

export function WaitlistSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await WaitlistAPI.join({ name, email, note: note || undefined });
      setStatus('Joined waitlist successfully. We will contact you for beta access.');
      setName('');
      setEmail('');
      setNote('');
    } catch {
      setStatus('Unable to join waitlist right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="max-w-4xl mx-auto px-6 py-16">
      <div className="border border-white/10 bg-black/35 rounded-2xl p-6 md:p-8">
        <h2 className="text-3xl text-white font-bold">Join Beta Waitlist</h2>
        <p className="text-zinc-300 mt-2">
          Beta access is currently invitation-based. We use your info only for Eido launch updates and early access onboarding.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Name"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-white min-h-24"
          />
          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? 'Submitting...' : 'Join Waitlist'}
          </button>
        </form>

        {status && <p className="text-sm text-zinc-300 mt-3">{status}</p>}
      </div>
    </section>
  );
}
