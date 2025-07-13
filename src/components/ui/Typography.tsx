import React from 'react';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  component?: keyof JSX.IntrinsicElements;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'textPrimary' | 'textSecondary' | 'white';
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  component,
  color = 'textPrimary',
  align = 'left',
  weight,
  className = '',
  children,
  ...props
}) => {
  // Default component mapping
  const defaultComponent = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span'
  } as const;

  const Component = component || defaultComponent[variant];

  // Typography styles - mobile-first with responsive scaling
  const variantClasses = {
    h1: 'text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight',
    h2: 'text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight',
    h3: 'text-xl sm:text-2xl lg:text-3xl font-semibold leading-snug',
    h4: 'text-lg sm:text-xl lg:text-2xl font-semibold leading-snug',
    h5: 'text-base sm:text-lg lg:text-xl font-medium leading-normal',
    h6: 'text-sm sm:text-base lg:text-lg font-medium leading-normal',
    body1: 'text-base leading-relaxed',
    body2: 'text-sm leading-relaxed',
    caption: 'text-xs leading-normal',
    overline: 'text-xs uppercase tracking-wide font-medium leading-normal'
  };

  const colorClasses = {
    primary: 'text-green-600',
    secondary: 'text-blue-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    white: 'text-white'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const classes = [
    variantClasses[variant],
    colorClasses[color],
    alignClasses[align],
    weight ? weightClasses[weight] : '',
    className
  ].filter(Boolean).join(' ');

  return React.createElement(
    Component,
    {
      className: classes,
      ...props
    },
    children
  );
};

// Convenience components
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Body1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
);

export const Body2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body2" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export default Typography;