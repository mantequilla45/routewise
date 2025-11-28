declare global {
    interface Window {
        google: any;
        googleMapsLoadPromise?: Promise<void>;
        initMap?: () => void;
    }
}

class GoogleMapsLoader {
    private static instance: GoogleMapsLoader;
    private loadPromise: Promise<void> | null = null;
    private isLoaded = false;

    private constructor() {}

    static getInstance(): GoogleMapsLoader {
        if (!GoogleMapsLoader.instance) {
            GoogleMapsLoader.instance = new GoogleMapsLoader();
        }
        return GoogleMapsLoader.instance;
    }

    async load(): Promise<void> {
        // If already loaded, return immediately
        if (this.isLoaded && window.google?.maps) {
            console.log('Google Maps already loaded');
            return Promise.resolve();
        }

        // If currently loading, return the existing promise
        if (this.loadPromise) {
            console.log('Google Maps is currently loading, waiting...');
            return this.loadPromise;
        }

        // Start loading
        this.loadPromise = new Promise((resolve, reject) => {
            // Check if Google Maps is already available
            if (window.google?.maps) {
                console.log('Google Maps found in window');
                this.isLoaded = true;
                resolve();
                return;
            }

            // Check if script is already in DOM
            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                console.log('Google Maps script already in DOM');
                
                // Wait for it to load
                const checkLoaded = setInterval(() => {
                    if (window.google?.maps) {
                        clearInterval(checkLoaded);
                        this.isLoaded = true;
                        resolve();
                    }
                }, 100);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkLoaded);
                    reject(new Error('Google Maps failed to load'));
                }, 10000);
                
                return;
            }

            // Load new script
            console.log('Loading Google Maps script...');
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDNtgUhuvViM6MQUzbr34ytetMlYfXrDaI&libraries=places&callback=initMap`;
            script.async = true;
            script.defer = true;
            
            window.initMap = () => {
                console.log('Google Maps initialized');
                this.isLoaded = true;
                delete window.initMap;
                resolve();
            };
            
            script.onerror = () => {
                this.loadPromise = null;
                reject(new Error('Failed to load Google Maps'));
            };
            
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    isReady(): boolean {
        return this.isLoaded && !!window.google?.maps;
    }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();