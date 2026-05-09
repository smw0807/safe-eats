interface AlertProps {
  type: 'error' | 'success' | 'warning';
  message: string;
  className?: string;
}

const styles: Record<AlertProps['type'], string> = {
  error: 'bg-red-50 border-red-200 text-red-600',
  success: 'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
};

export default function Alert({ type, message, className = '' }: AlertProps) {
  return (
    <div className={`p-3 rounded-lg text-sm border ${styles[type]} ${className}`}>{message}</div>
  );
}
