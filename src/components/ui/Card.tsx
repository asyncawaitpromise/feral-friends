import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick
}) => {
  const baseClasses = [
    'rounded-lg transition-all duration-200',
    onClick ? 'cursor-pointer' : '',
    hover ? 'hover:shadow-lg hover:-translate-y-1' : ''
  ].join(' ');

  const variantClasses = {
    default: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    flat: 'bg-gray-50'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
      style={onClick ? { minHeight: '44px', minWidth: '44px' } : undefined}
    >
      {children}
    </Component>
  );
};

export default Card;