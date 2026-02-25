import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
    scene: string;
    className?: string;
    variables?: Record<string, any>;
    onLoad?: (splineApp: any) => void;
}

export const SplineScene: React.FC<SplineSceneProps> = ({ scene, className, variables, onLoad }) => {
    const [loaded, setLoaded] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Defer Spline loading: wait for idle + 1.5s delay so the rest of the page loads first
    useEffect(() => {
        const timer = setTimeout(() => {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => setShouldRender(true));
            } else {
                setShouldRender(true);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleLoad = (splineApp: any) => {
        setLoaded(true);

        if (variables) {
            Object.entries(variables).forEach(([key, value]) => {
                try {
                    splineApp.setVariable(key, value);
                } catch (err) {
                    console.warn(`Failed to set Spline variable: ${key}`, err);
                }
            });
        }

        if (onLoad) {
            onLoad(splineApp);
        }
    };

    return (
        <div ref={containerRef} className={`relative w-full h-full min-h-[500px] ${className}`}>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-[32px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-white/40 text-sm font-medium animate-pulse">Loading 3D Scene...</p>
                    </div>
                </div>
            )}
            {shouldRender && (
                <Suspense fallback={null}>
                    <Spline
                        scene={scene}
                        onLoad={handleLoad}
                        style={{
                            opacity: loaded ? 1 : 0,
                            transition: 'opacity 0.8s ease-out',
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};
