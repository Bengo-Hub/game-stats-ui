declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface RuntimeCaching {
        urlPattern: RegExp | string | ((options: { url: URL; event?: ExtendableEvent }) => boolean);
        handler: string | ((options: unknown) => Promise<Response>);
        options?: {
            cacheName?: string;
            expiration?: {
                maxEntries?: number;
                maxAgeSeconds?: number;
            };
            networkTimeoutSeconds?: number;
            cacheableResponse?: {
                statuses?: number[];
                headers?: Record<string, string>;
            };
            broadcastUpdate?: {
                channelName?: string;
            };
            fetchOptions?: unknown;
            matchOptions?: unknown;
        };
    }

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        scope?: string;
        sw?: string;
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        publicExcludes?: string[];
        buildExcludes?: string[];
        cacheStartUrl?: boolean;
        dynamicStartUrl?: boolean;
        dynamicStartUrlRedirect?: string;
        fallbacks?: {
            document?: string;
            image?: string;
            audio?: string;
            video?: string;
            font?: string;
        };
        cacheId?: string;
        cleanupOutdatedCaches?: boolean;
        clientsClaim?: boolean;
        skipWaiting?: boolean;
        runtimeCaching?: RuntimeCaching[];
        customWorkerDir?: string;
    }

    function withPWAInit(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

    export default withPWAInit;
}
