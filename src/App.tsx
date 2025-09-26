import { Header } from './components/Header';
import { WalletConnect } from './components/WalletConnect';
import { SignatureForm } from './components/SignatureForm';
import { SignatureVerifier } from './components/SignatureVerifier';
import { InfoCard } from './components/InfoCard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <WalletConnect />
          <SignatureForm />
          <SignatureVerifier />
          <InfoCard />
        </div>
      </main>
    </div>
  );
}

export default App;