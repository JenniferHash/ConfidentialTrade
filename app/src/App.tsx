import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';

import { config } from './config/wagmi';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Dashboard />
            </main>
            
            {/* Footer */}
            <footer className="bg-white border-t mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Powered by <span className="font-semibold">Zama's FHE Technology</span> - 
                    Keeping your data confidential while enabling verifiable computations
                  </p>
                  <div className="flex justify-center space-x-6 text-sm text-gray-500">
                    <a href="https://docs.zama.ai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                      Zama Documentation
                    </a>
                    <a href="https://github.com/zama-ai/fhevm" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                      FHEVM GitHub
                    </a>
                  </div>
                </div>
              </div>
            </footer>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;