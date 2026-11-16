'use client';

import { useEffect, useRef, useState } from 'react';

// Small, dependency-free React Bits effects used where they help the interface.
export function Magnet({ children, className = '', strength = 8 }) {
  const innerRef = useRef(null);

  function move(event) {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    innerRef.current?.style.setProperty('transform', `translate3d(${(x / strength).toFixed(1)}px, ${(y / strength).toFixed(1)}px, 0)`);
  }

  function reset() {
    if (innerRef.current) innerRef.current.style.transform = '';
  }

  return <span className={`rb-magnet ${className}`} onPointerMove={move} onPointerLeave={reset}><span ref={innerRef} className="rb-magnet-inner">{children}</span></span>;
}

export function ClickSpark({ children, className = '' }) {
  const [sparks, setSparks] = useState([]);
  const timerRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function burst(event) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const origin = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const next = Array.from({ length: 8 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 8;
      const id = ++idRef.current;
      return { id, x: origin.x, y: origin.y, dx: Math.cos(angle) * 27, dy: Math.sin(angle) * 27 };
    });
    setSparks(next);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSparks([]), 560);
  }

  return <span className={`rb-click-spark ${className}`} onClick={burst}>{children}<span className="rb-spark-field" aria-hidden="true">{sparks.map((spark) => <i key={spark.id} style={{ left: spark.x, top: spark.y, '--spark-x': `${spark.dx}px`, '--spark-y': `${spark.dy}px` }} />)}</span></span>;
}

export function SpotlightCard({ children, className = '', ...props }) {
  function aim(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }

  return <div className={`rb-spotlight ${className}`} onPointerMove={aim} {...props}>{children}</div>;
}

export function ShinyText({ children, className = '' }) {
  return <span className={`rb-shiny-text ${className}`}>{children}</span>;
}

export function ScrollReveal({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.add('is-visible');
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`rb-scroll-reveal ${className}`}>{children}</div>;
}

export function FadeContent({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.add('is-visible');
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`rb-fade-content ${className}`}>{children}</div>;
}

export function CountUp({ value, duration = 900 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(value);
      return undefined;
    }
    let frame = 0;
    let start;
    const tick = (time) => {
      if (start === undefined) start = time;
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      setCount(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return <span className="rb-count-up" aria-label={String(value)}>{count}</span>;
}
