import MyPaymentsContainer from '@/components/my-payments/MyPaymentsContainer';

export default function MyPaymentsPage() {
  return (
    <>
      <h2 className="text-3xl font-bold mb-2">My Payments</h2>
      <p className="mb-8">Visualize your incoming and outgoing payments</p>
      <MyPaymentsContainer />
    </>
  );
}
