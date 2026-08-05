import React from 'react';
import { Drama as Instagram, MessageCircle } from 'lucide-react';
import { site } from '@/data/site';

const SHOP_LINKS = [
  { label: 'Sarees', href: '#sarees' },
  { label: 'Garden Glow', href: '#skincare' },
  { label: 'Story', href: '#story' },
];

const HELP_LINKS = [
  { label: 'Contact', href: '#contact' },
  { label: 'Shipping', href: '#contact' },
  { label: 'Returns', href: '#contact' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#2E2825] text-[#FAF5F8] py-14 mt-10 overflow-hidden" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="font-serif-display text-3xl text-[#EBA8C5]">{site.name}</div>
            <p className="mt-3 text-sm text-white/60 max-w-md leading-relaxed">
              Handwoven sarees and slow-crafted Garden Glow herbal skincare. Kanchipuram, Tamil Nadu.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={site.contact.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #EBA8C5 0%, #8B2956 100%)',
                  boxShadow: 'inset 0 -3px 6px rgba(60,10,30,0.3), inset 0 3px 6px rgba(255,255,255,0.35)',
                }}
                data-testid="footer-instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a
                href={site.contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #C9B5DD 0%, #7B6B9A 100%)',
                  boxShadow: 'inset 0 -3px 6px rgba(50,30,60,0.3), inset 0 3px 6px rgba(255,255,255,0.35)',
                }}
                data-testid="footer-whatsapp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
          <FooterCol title="Shop" items={SHOP_LINKS} />
          <FooterCol title="Help" items={HELP_LINKS} />
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40">
          <div>
            © {new Date().getFullYear()} {site.name}. Made with love in Kanchipuram.
          </div>
          <div className="mt-2 sm:mt-0">Woven heritage · Grown glow</div>
        </div>
      </div>
    </footer>
  );
}

const FooterCol = ({ title, items }) => (
  <div>
    <div className="text-xs uppercase tracking-widest text-white/50">{title}</div>
    <ul className="mt-4 space-y-2 text-sm text-white/80">
      {items.map((it) => (
        <li key={it.label}>
          <a href={it.href} className="hover:text-[#EBA8C5] transition-colors">
            {it.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);
