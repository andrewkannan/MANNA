interface ArtCardProps {
  reference: string;
  text: string;
  imageUrl: string;
}

export default function ArtCard({ reference, text, imageUrl }: ArtCardProps) {
  return (
    <div className="w-full max-w-[400px] mx-auto bg-[#FDFBF7] shadow-xl rounded-lg overflow-hidden flex flex-col items-center p-6 border border-[#EAE5D9]">
      {/* Image Container with white border effect inside the cream card */}
      <div className="w-full aspect-[4/5] bg-white p-2 shadow-sm mb-8">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      </div>

      {/* Text Content */}
      <h2 className="font-serif text-2xl text-[#2C2825] mb-4 text-center">
        {reference}
      </h2>
      <p className="font-serif text-[#4A4541] text-center text-sm leading-relaxed max-w-[90%]">
        {text}
      </p>
    </div>
  );
}
