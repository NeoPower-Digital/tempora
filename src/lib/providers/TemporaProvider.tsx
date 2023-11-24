import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UseInkProvider } from 'useink';
import { APP_NAME } from '../constants/app.const';
import useChainsConfig from '../hooks/useChainsConfig';

interface TemporaProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

const TemporaProvider: React.FC<TemporaProviderProps> = ({ children }) => {
  const originChain = useChainsConfig();

  return (
    <QueryClientProvider client={queryClient}>
      <UseInkProvider
        config={{
          dappName: APP_NAME,
          chains: [originChain],
          wallet: {
            skipAutoConnect: false,
          },
        }}
      >
        {children}
      </UseInkProvider>
    </QueryClientProvider>
  );
};

export default TemporaProvider;
