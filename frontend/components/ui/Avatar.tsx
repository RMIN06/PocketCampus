// components/ui/Avatar.tsx
import { forwardRef, ImgHTMLAttributes } from "react";

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name?: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "rounded";
}

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  (
    {
      src,
      name,
      color = "#2D4F1E",
      size = "md",
      shape = "circle",
      className = "",
      alt,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-12 w-12 text-lg",
      xl: "h-16 w-16 text-xl",
    };

    const shapeStyles = {
      circle: "rounded-full",
      rounded: "rounded-xl",
    };

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const getColorFromName = (name: string) => {
      // Simple hash-based color selection for consistent avatar colors
      // Warm Craft palette: dark fills only, so white initials stay ≥4.5:1.
      const colors = [
        "#2D4F1E", "#3E6329", "#C4593D", "#223B15", "#8A5A2B",
        "#4A4A4A", "#5B6E3A", "#99432B", "#6E8B3D", "#705336",
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    const avatarColor = src ? undefined : (color || (name ? getColorFromName(name) : "#2D4F1E"));

    if (src) {
      return (
        <img
          ref={ref}
          src={src}
          alt={alt || name || "Avatar"}
          className={`${sizeStyles[size]} ${shapeStyles[shape]} object-cover shrink-0 ${className}`}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={`${sizeStyles[size]} ${shapeStyles[shape]} flex items-center justify-center font-medium text-white shrink-0 ${className}`}
        style={{ backgroundColor: avatarColor }}
        {...props}
      >
        {name ? getInitials(name) : "?"}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";