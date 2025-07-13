import React from 'react';
import Button from './Button';
import { useScreenReader } from '../../hooks/useAccessibility';

interface AccessibleButtonProps extends React.ComponentProps<typeof Button> {
  announceOnClick?: string;
  describedBy?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  announceOnClick,
  describedBy,
  onClick,
  children,
  ...props
}) => {
  const { announce } = useScreenReader();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (announceOnClick) {
      announce(announceOnClick);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      aria-describedby={describedBy}
      role="button"
    >
      {children}
    </Button>
  );
};

export default AccessibleButton;