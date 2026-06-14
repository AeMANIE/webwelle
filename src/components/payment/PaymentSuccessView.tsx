'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Mail } from 'lucide-react';
import {
  PAYMENT_SUCCESS_CONTENT,
  ZOOM_SCHEDULER_URL,
} from '@/lib/payment-success-content';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function PaymentSuccessView() {
  const c = PAYMENT_SUCCESS_CONTENT;

  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[320px] w-[400px] rounded-full bg-brand/10 blur-[80px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center mb-10"
        >
          <div className="relative inline-flex mb-6">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-success/20 blur-xl scale-150"
            />
            <CheckCircle2
              className="relative w-20 h-20 text-success"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {c.headline}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {c.intro}
          </p>
        </motion.div>

        {/* CTA Card */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-card rounded-2xl p-8 sm:p-10 border border-brand/30 shadow-[0_0_40px_rgba(140,54,201,0.12)] mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
            {c.ctaTitle}
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {c.ctaDescription}
          </p>

          <a
            href={ZOOM_SCHEDULER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 bg-brand text-brand-foreground px-8 py-4 rounded-xl hover:bg-brand/90 transition-all font-semibold text-base shadow-[0_4px_24px_rgba(140,54,201,0.35)] hover:shadow-[0_6px_32px_rgba(140,54,201,0.45)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="w-5 h-5" />
            {c.ctaButton}
          </a>

          <p className="mt-5 text-sm text-muted-foreground">
            {c.emailNote}
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-card/60 rounded-2xl p-8 border border-border mb-10"
        >
          <h2 className="text-xl font-semibold text-foreground mb-8">
            {c.stepsTitle}
          </h2>

          <div className="relative space-y-0">
            {c.steps.map((step, index) => (
              <div key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                {index < c.steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[15px] top-10 bottom-0 w-px bg-gradient-to-b from-primary/60 to-primary/10"
                  />
                )}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support + Home */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center space-y-6 pb-4"
        >
          <p className="text-sm text-muted-foreground">
            Fragen?{' '}
            <a
              href={`mailto:${c.supportEmail}`}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Mail className="w-3.5 h-3.5" />
              {c.supportEmail}
            </a>
          </p>
          <a
            href="/"
            className="inline-block text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ← {c.homeLink}
          </a>
        </motion.div>
      </div>
    </div>
  );
}
