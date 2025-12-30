type WipPageProps = {
  title: string;
  label: string;
  message: string;
};

function WipPage({ title, label, message }: WipPageProps) {
  return (
    <section className="wip-panel">
      <p className="wip-label">{label}</p>
      <h2>{title}</h2>
      <p className="wip-message">{message}</p>
    </section>
  );
}

export default WipPage;
