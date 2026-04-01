import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'badge',
    secondary: 'badge',
    destructive: 'badge',
    outline: 'badge badge-outline',
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
};
