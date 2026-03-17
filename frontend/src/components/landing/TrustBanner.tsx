import { motion } from 'framer-motion';

const TrustBanner = () => {
  const partners = [
    { name: 'Polygon', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Polygon_logo.svg' },
    { name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' },
    { name: 'Ethereum', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg' },
    { name: 'Polygon', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Polygon_logo.svg' },
    { name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' },
  ];

  return (
    <div className="py-20 bg-primary relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">
          Secured and Verified By
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale hover:opacity-100 grayscale-0 transition-all duration-700">
          {partners.map((partner, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1 }}
              className="h-7 md:h-9"
            >
              <img src={partner.logo} alt={partner.name} className="h-full w-auto" />
            </motion.div>
          ))}
        </div>
      </div>
      {/* Subtle Divider */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
};

export default TrustBanner;
