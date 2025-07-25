// src/icons/Deposit/Deposit.tsx
import { SVGProps } from "react";

export default function Deposit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      className='lucide lucide-banknote-arrow-up-icon lucide-banknote-arrow-up'
      xmlns='http://www.w3.org/2000/svg'
      {...props} // allows overriding size, className, etc.
    >
      <path d='M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5' />
      <path d='M18 12h.01' />
      <path d='M19 22v-6' />
      <path d='m22 19-3-3-3 3' />
      <path d='M6 12h.01' />
      <circle cx={12} cy={12} r={2} />
    </svg>
  );
}
