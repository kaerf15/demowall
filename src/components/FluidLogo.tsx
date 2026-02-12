"use client";

interface FluidLogoProps {
  text?: string;
  className?: string;
}

export function FluidLogo({ text = "DemoWall", className = "" }: FluidLogoProps) {
  return (
    <div className={`flex flex-col justify-center select-none ${className}`}>
      <div 
        className="font-syne font-bold text-xl sm:text-2xl tracking-normal bg-clip-text text-transparent bg-gradient-to-r from-[#608BC1] via-[#A6CDC6] to-[#608BC1] animate-shimmer-text pr-1 leading-[0.85]"
        style={{
          backgroundSize: "200% auto",
        }}
      >
        {text}
      </div>
      <div 
        className="flex justify-between w-full text-[0.5rem] sm:text-[0.6rem] font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#608BC1] via-[#A6CDC6] to-[#608BC1] animate-shimmer-text pr-1 mt-1"
        style={{
          backgroundSize: "200% auto",
        }}
      >
        {Array.from("独立开发者产品交流社区").map((char, index) => (
          <span key={index}>{char}</span>
        ))}
      </div>
    </div>
  );
}
