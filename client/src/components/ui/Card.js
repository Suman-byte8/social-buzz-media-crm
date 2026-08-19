import React from "react";

export default function Card({ 
  children, 
  className = "",
  elevation = "low",
  border = true,
  padding = true,
  fullHeight = false,
  ...props
}) {
  const elevationClasses = {
    low: "shadow-[0px_2px_4px_rgba(0,0,0,0.05)]",
    medium: "shadow-[0px_4px_6px_rgba(0,0,0,0.1)]",
    high: "shadow-[0px_6px_8px_rgba(0,0,0,0.15)]"
  };

  const borderClasses = border ? "border border-outline-variant" : "";
  const paddingClasses = padding ? "p-card-padding" : "";
  const bgClasses = "bg-white rounded-lg";
  const heightClasses = fullHeight ? "h-full" : "";
  
  return (
    <div 
      className={`${bgClasses} ${elevationClasses[elevation]} ${borderClasses} ${paddingClasses} ${heightClasses} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}