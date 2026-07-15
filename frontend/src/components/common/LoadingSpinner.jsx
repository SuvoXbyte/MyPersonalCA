import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', center = false, text = '' }) => {
  return (
    <div className={`spinner-wrapper ${center ? 'spinner-center' : ''}`}>
      <div className={`spinner spinner-${size}`} />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
