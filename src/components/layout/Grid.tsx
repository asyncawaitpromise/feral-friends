import React from 'react';

interface GridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface GridItemProps {
  children: React.ReactNode;
  span?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

const Grid: React.FC<GridProps> = ({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  // Build responsive grid classes
  const gridClasses = [
    'grid',
    cols.default ? `grid-cols-${cols.default}` : 'grid-cols-1',
    cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    cols.md ? `md:grid-cols-${cols.md}` : '',
    cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    cols.xl ? `xl:grid-cols-${cols.xl}` : '',
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

const GridItem: React.FC<GridItemProps> = ({
  children,
  span,
  className = ''
}) => {
  if (!span) {
    return <div className={className}>{children}</div>;
  }

  const spanClasses = [
    span.default ? `col-span-${span.default}` : '',
    span.sm ? `sm:col-span-${span.sm}` : '',
    span.md ? `md:col-span-${span.md}` : '',
    span.lg ? `lg:col-span-${span.lg}` : '',
    span.xl ? `xl:col-span-${span.xl}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={spanClasses}>
      {children}
    </div>
  );
};

// Flex-based layout components for more flexible layouts
interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  wrap = false,
  justify = 'start',
  align = 'start',
  gap = 'none',
  className = ''
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };

  const gapClasses = {
    none: '',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const flexClasses = [
    'flex',
    directionClasses[direction],
    wrap ? 'flex-wrap' : 'flex-nowrap',
    justifyClasses[justify],
    alignClasses[align],
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

// Stack component for vertical layouts with consistent spacing
interface StackProps {
  children: React.ReactNode;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  className = ''
}) => {
  const spacingClasses = {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={`flex flex-col ${spacingClasses[spacing]} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
};

export default Grid;
export { GridItem, Flex, Stack };