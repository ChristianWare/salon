// src/icons/Support/Support.tsx
import { SVGProps } from "react";

export default function Support(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      xmlns='http://www.w3.org/2000/svg'
      {...props} // allows overriding size, className, etc.
    >
      <path d='M3 11.3C3 6.32949 7.02944 2.30005 12 2.30005C16.9706 2.30005 21 6.32949 21 11.3M3 11.3H5C6.10457 11.3 7 12.1955 7 13.3V15.3C7 16.4046 6.10457 17.3 5 17.3M3 11.3V16.3C3 16.8523 3.44772 17.3 4 17.3H5M21 11.3H19C17.8954 11.3 17 12.1955 17 13.3V15.3C17 16.4046 17.8954 17.3 19 17.3H20C20.5523 17.3 21 16.8523 21 16.3V11.3ZM5 17.3V18.3C5 19.4046 5.89543 20.3 7 20.3H9M9 20.3C9 21.1285 9.67157 21.8 10.5 21.8H11.5C12.3284 21.8 13 21.1285 13 20.3C13 19.4716 12.3284 18.8 11.5 18.8H10.5C9.67157 18.8 9 19.4716 9 20.3Z' />
    </svg>
  );
}
