import SetupSection from '@/components/dashboard/SetupSection';

export default function Home() {
  return (
    <>
      <h2 className="text-3xl font-bold mb-2">Setup Proxy Accounts</h2>
      <p>
        This process will setup an account on each chain that can act on your
        behalf
      </p>

      <div className="w-full max-w-2xl mt-8 flex flex-col gap-4">
        <SetupSection />
      </div>
    </>
  );
}
