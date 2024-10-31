import PropTypes from 'prop-types';

const Alert = ({ children, className = "", variant = "default", ...props }) => {
  const baseStyles = "relative w-full rounded-lg border p-4 mb-4";
  const variants = {
    default: "bg-background text-foreground border-gray-200",
    destructive: "border-red-500/50 text-red-600 dark:border-red-500 dark:text-red-500",
  };

  const alertClass = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <div role="alert" className={alertClass} {...props}>
      {children}
    </div>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'destructive'])
};

const AlertTitle = ({ children, className = "", ...props }) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h5>
);

AlertTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

const AlertDescription = ({ children, className = "", ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);

AlertDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export { Alert, AlertTitle, AlertDescription };