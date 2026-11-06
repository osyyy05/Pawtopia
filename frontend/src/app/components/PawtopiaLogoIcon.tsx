interface PawtopiaLogoIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PawtopiaLogoIcon({
  size = 'md',
  className = '',
}: PawtopiaLogoIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <img
      src="/pawtopia-logo.png"
      alt="Pawtopia"
      className={`${sizeClasses[size]} object-contain shrink-0 ${className}`}
    />
  );
}