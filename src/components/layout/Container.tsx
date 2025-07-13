import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  centerContent?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  padding = 'md',
  className = '',
  centerContent = false
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 py-4 sm:px-6 sm:py-6',
    lg: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12'
  };

  const baseClasses = [
    'mx-auto w-full',
    sizeClasses[size],
    paddingClasses[padding],
    centerContent ? 'flex items-center justify-center' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

export default Container;