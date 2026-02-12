"use client";

import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const isDragging = useRef(false);

  // Check scroll position to show/hide gradients
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDown.current = true;
    isDragging.current = false;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
    // Reset dragging flag after a short delay to allow click handler to check it
    setTimeout(() => {
      isDragging.current = false;
    }, 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll speed multiplier
    
    // Only mark as dragging if moved significantly (e.g. > 5px)
    if (Math.abs(walk) > 5) {
      isDragging.current = true;
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleClick = (slug: string | null) => {
    if (isDragging.current) {
      return;
    }
    onSelectCategory(slug);
  };

  return (
    <div className="relative group w-full max-w-full">
      {/* Left Gradient Mask */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300",
          showLeftGradient ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Right Gradient Mask */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300",
          showRightGradient ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide cursor-grab select-none w-full"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onScroll={checkScroll}
      >
        <button
          onClick={() => handleClick(null)}
          className={cn(
            "px-5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
            selectedCategory === null
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 scale-105"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:scale-105"
          )}
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleClick(category.slug)}
            className={cn(
              "px-5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
              selectedCategory === category.slug
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:scale-105"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}