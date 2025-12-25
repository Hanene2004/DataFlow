import { motion } from 'framer-motion';

export function SkeletonDashboard() {
    const shimmer = {
        animate: {
            backgroundPosition: ['-200% 0', '200% 0'],
            transition: {
                repeat: Infinity,
                duration: 1.5,
                ease: "linear"
            }
        }
    } as any;

    const SkeletonCard = ({ className }: { className: string }) => (
        <div className={`active:scale-95 bg-gray-200 dark:bg-slate-800 rounded-2xl overflow-hidden relative ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent skew-x-12"
                variants={shimmer}
                animate="animate"
                style={{ backgroundSize: '200% 100%' }}
            />
        </div>
    );

    return (
        <div className="space-y-8 p-6">
            {/* Header Skeleton */}
            <div className="h-48 rounded-3xl bg-gray-200 dark:bg-slate-800 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent skew-x-12"
                    variants={shimmer}
                    animate="animate"
                    style={{ backgroundSize: '200% 100%' }}
                />
            </div>

            {/* Early Warning Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <SkeletonCard key={i} className="h-32" />
                ))}
            </div>

            {/* Main Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Cards Area */}
                <SkeletonCard className="h-[400px]" />

                {/* Smart Analysis Area */}
                <SkeletonCard className="h-[400px]" />

                {/* Big Chart Area */}
                <SkeletonCard className="h-[500px] lg:col-span-2" />
            </div>
        </div>
    );
}
