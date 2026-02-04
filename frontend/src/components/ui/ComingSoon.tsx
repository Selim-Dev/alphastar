import { LucideIcon, Sparkles, Rocket } from 'lucide-react';
import { Card } from './Card';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  estimatedRelease?: string;
}

/**
 * ComingSoon Component
 * Beautiful overlay for features under development with stunning visuals
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  features,
  estimatedRelease,
}: ComingSoonProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300/40 dark:bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300/40 dark:bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300/40 dark:bg-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <Card className="max-w-3xl w-full p-8 md:p-12 text-center space-y-8 relative overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-card/95 border-2 shadow-2xl">
        {/* Decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-primary/5 dark:via-transparent dark:to-accent/5 pointer-events-none" />
        
        {/* Sparkle decorations */}
        <div className="absolute top-8 right-8 text-blue-400 dark:text-primary/20 animate-pulse">
          <Sparkles size={24} />
        </div>
        <div className="absolute bottom-8 left-8 text-purple-400 dark:text-accent/20 animate-pulse animation-delay-1000">
          <Sparkles size={20} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-8">
          {/* Icon with animated glow and floating effect */}
          <div className="flex justify-center">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 dark:from-primary/30 dark:to-accent/30 rounded-full blur-3xl animate-pulse" />
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-primary/10 dark:via-accent/5 dark:to-blue-500/10 border-2 border-blue-300 dark:border-primary/30 shadow-xl">
                <Icon className="h-20 w-20 text-blue-600 dark:text-primary drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Title with gradient */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-primary dark:via-accent dark:to-primary bg-clip-text text-transparent animate-gradient">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Coming Soon Badge with rocket */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-primary/10 dark:to-accent/10 border-2 border-blue-300 dark:border-primary/30 shadow-lg">
            <Rocket className="h-5 w-5 text-blue-600 dark:text-primary animate-bounce" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-blue-700 dark:text-primary">Coming Soon</span>
            </div>
          </div>

          {/* Features List with enhanced styling */}
          {features && features.length > 0 && (
            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400 dark:to-primary/50" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wider">
                  Planned Features
                </h3>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400 dark:to-primary/50" />
              </div>
              <div className="grid gap-4 text-left max-w-2xl mx-auto">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-muted/50 dark:to-muted/30 border border-gray-200 dark:border-border/50 transition-all duration-300 hover:bg-white dark:hover:bg-muted hover:border-blue-300 dark:hover:border-primary/30 hover:shadow-lg hover:scale-[1.02]"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-primary/20 dark:to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 dark:from-primary dark:to-accent" />
                    </div>
                    <span className="text-sm text-gray-800 dark:text-foreground leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Release with enhanced styling */}
          {estimatedRelease && (
            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-muted/50 border border-gray-300 dark:border-border">
                <span className="text-sm text-gray-600 dark:text-muted-foreground">Estimated Release:</span>
                <span className="text-sm font-bold text-blue-700 dark:text-primary">{estimatedRelease}</span>
              </div>
            </div>
          )}

          {/* Decorative animated dots */}
          <div className="flex justify-center gap-3 pt-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-primary dark:to-accent"
                style={{
                  animation: `pulse 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default ComingSoon;
