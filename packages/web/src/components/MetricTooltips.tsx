import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: string;
  isVisible: boolean;
  iconRef: React.RefObject<SVGSVGElement>;
  onClose: () => void;
  position?: 'bottom-left' | 'bottom-right';
}

const Tooltip = ({ content, isVisible, iconRef, onClose, position = 'bottom-right' }: TooltipProps) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current && isVisible) {
      const rect = iconRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64
      const tooltipHeight = 80; // Approximate height

      const top = rect.bottom + window.scrollY + 8; // Position below the icon

      let left;
      if (position === 'bottom-left') {
        // Align right edge of tooltip with right edge of icon
        left = rect.right - tooltipWidth;
      } else {
        // Align left edge of tooltip with left edge of icon
        left = rect.left;
      }

      // Prevent cutoff on the right edge
      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 8;
      }

      // Prevent cutoff on the left edge
      if (left < 8) {
        left = 8;
      }

      setStyle({ 
        position: 'absolute', 
        left: `${left}px`, 
        width: `${tooltipWidth}px`, 
        top: `${top}px`,
        transform: 'none' // Remove vertical centering
      });
    }

    const handleScroll = () => {
      if (isVisible) onClose();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && iconRef.current && !iconRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, iconRef, onClose]);

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div 
      ref={tooltipRef}
      className="bg-white p-3 rounded-lg shadow-xl text-xs text-gray-800 border border-gray-200 z-[9999]"
      style={style}
    >
      {content}
    </div>,
    document.body
  );
};

interface MetricTooltipProps {
  content:string;
  iconColor: string;
  position?: 'bottom-left' | 'bottom-right';
}

const MetricTooltip = ({ content, iconColor, position }: MetricTooltipProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);

  return (
    <div className="inline-block ml-1 relative">
      <svg 
        ref={iconRef}
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-4 w-4 ${iconColor} cursor-help`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
            <Tooltip 
        content={content}
        isVisible={showTooltip}
        iconRef={iconRef}
        onClose={() => setShowTooltip(false)}
        position={position}
      />
    </div>
  );
};

export const GrindabilityTooltip = ({ position }: { position?: 'bottom-left' | 'bottom-right' }) => (
    <MetricTooltip 
    content="How suitable the cafe is for studying or working. Considers factors like available seating, outlet access, WiFi quality, and noise level."
    iconColor="text-blue-500"
    position={position}
  />
);

export const VibeTooltip = ({ position }: { position?: 'bottom-left' | 'bottom-right' }) => (
    <MetricTooltip 
    content="The overall atmosphere and ambiance of the cafe. Includes decor, music, and general feel."
    iconColor="text-pink-500"
    position={position}
  />
);

export const CoffeeQualityTooltip = ({ position }: { position?: 'bottom-left' | 'bottom-right' }) => (
    <MetricTooltip 
    content="The quality of the coffee itself. Based on factors like bean origin, roasting, and taste."
    iconColor="text-yellow-500"
    position={position}
  />
);

export const StudentFriendlyTooltip = ({ position }: { position?: 'bottom-left' | 'bottom-right' }) => (
    <MetricTooltip 
    content="A rating of how student-friendly the cafe is. This includes factors like price, atmosphere, and amenities."
    iconColor="text-green-500"
    position={position}
  />
);
