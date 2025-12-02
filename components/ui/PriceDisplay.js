import React from 'react';

// PriceDisplay Component - displays price with smaller decimal portion
const PriceDisplay = ({ amount, className = '', darkMode }) => {
  const formattedAmount = amount.toFixed(2);
  const [dollars, cents] = formattedAmount.split('.');

  return (
    <span className={className}>
      ${dollars}
      <span className="text-[0.7em]">.{cents}</span>
    </span>
  );
};

export default PriceDisplay;
