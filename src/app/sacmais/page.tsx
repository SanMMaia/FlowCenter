export default function SacmaisPage() {
  return (
    <div className="position-relative w-100 h-100">
      <iframe 
        src="https://app2.sacmais.com.br/" 
        className="w-100 h-100 border-0 position-absolute"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        title="Sacmais"
      />
    </div>
  );
}
