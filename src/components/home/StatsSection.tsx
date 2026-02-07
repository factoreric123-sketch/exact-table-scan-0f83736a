import { useEffect, useState, useRef } from "react";

const stats = [
  { value: 1000, suffix: "+", label: "Restaurants" },
  { value: 50000, suffix: "+", label: "Scans/Month" },
  { value: 4.9, suffix: "/5", label: "Rating" },
  { value: 100, suffix: "ms", label: "Load Time", prefix: "<" },
];

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const Counter = ({ end, suffix, prefix }: { end: number; suffix: string; prefix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [isVisible, end]);

    return (
      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
        {prefix}
        {end > 100 ? count.toLocaleString() : count.toFixed(1)}
        {suffix}
      </div>
    );
  };

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Counter end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              <div className="text-muted-foreground mt-2 text-sm lg:text-base">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm lg:text-base">
            Trusted by restaurants worldwide • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
