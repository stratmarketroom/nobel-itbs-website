'use client';

type PrintButtonProps = {
  label: string;
};

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <button type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
