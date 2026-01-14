import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  /** Animation variant: 'fade' for subtle, 'slide' for directional */
  variant?: 'fade' | 'slide' | 'fadeSlide';
}

// Subtle fade animation - minimal and professional
const fadeVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn' as const,
    },
  },
};

// Slide animation - subtle directional movement
const slideVariants = {
  initial: {
    opacity: 0,
    x: 8,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

// Combined fade + slide (default) - balanced and polished
const fadeSlideVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      when: 'beforeChildren' as const,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const variantMap = {
  fade: fadeVariants,
  slide: slideVariants,
  fadeSlide: fadeSlideVariants,
};

export function PageTransition({ children, variant = 'fadeSlide' }: PageTransitionProps) {
  const location = useLocation();
  const variants = variantMap[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Stagger container for child animations
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function StaggerContainer({ children, className = '', delay = 0 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// Fade in animation wrapper
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function FadeIn({ children, delay = 0, direction = 'up', className = '' }: FadeInProps) {
  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale in animation wrapper
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className = '' }: ScaleInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

// Slide in animation wrapper
interface SlideInProps {
  children: ReactNode;
  delay?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function SlideIn({ children, delay = 0, direction = 'left', className = '' }: SlideInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: direction === 'left' ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
