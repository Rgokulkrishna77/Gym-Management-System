import { forwardRef, useId } from 'react';

// Accessible form controls that work with react-hook-form's register():
//   <Input label="Name" error={errors.name?.message} {...register('name')} />
function Wrapper({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

const aria = (id, error) => ({ 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined });

export const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <input id={id} ref={ref} {...aria(id, error)} className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />
    </Wrapper>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, children, ...props }, ref) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <select id={id} ref={ref} {...aria(id, error)} className={`input ${error ? 'input-error' : ''}`} {...props}>
        {children}
      </select>
    </Wrapper>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, rows = 3, ...props }, ref) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <textarea id={id} ref={ref} rows={rows} {...aria(id, error)} className={`input ${error ? 'input-error' : ''}`} {...props} />
    </Wrapper>
  );
});
