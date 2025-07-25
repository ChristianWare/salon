import { SVGProps } from "react";

export default function Pause(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='-4 0 28 28'
      width='1em'
      height='1em'
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      {...props} // lets callers override size, color, className, etc.
    >
      <title>pause</title>
      <desc>Created with Sketch Beta.</desc>
      <g stroke='none' strokeWidth={1} fill='none' fillRule='evenodd'>
        <g transform='translate(-472 -571)' fill='currentColor'>
          <path d='M490 571 L486 571 C484.896 571 484 571.896 484 573 L484 597 C484 598.104 484.896 599 486 599 L490 599 C491.104 599 492 598.104 492 597 L492 573 C492 571.896 491.104 571 490 571 Z M478 571 L474 571 C472.896 571 472 571.896 472 573 L472 597 C472 598.104 472.896 599 474 599 L478 599 C479.104 599 480 598.104 480 597 L480 573 C480 571.896 479.104 571 478 571 Z' />
        </g>
      </g>
    </svg>
  );
}
