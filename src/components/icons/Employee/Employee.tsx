import { SVGProps } from "react";

export default function Employee(props: SVGProps<SVGSVGElement>) {
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
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M13.5 8h-3' />
      <path d='m15 2-1 2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3' />
      <path d='M16.899 22A5 5 0 0 0 7.1 22' />
      <path d='m9 2 3 6' />
      <circle cx='12' cy='15' r='3' />
    </svg>
  );
}
