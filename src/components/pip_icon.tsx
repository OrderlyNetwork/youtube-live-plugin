import React from "react";

export interface PipIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  disabled?: boolean;
}

export const PipIcon: React.FC<PipIconProps> = ({
  size = "1em",
  disabled = false,
  style,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      aria-disabled={disabled || undefined}
      aria-hidden="true"
      focusable="false"
      style={{
        opacity: disabled ? 0.45 : undefined,
        pointerEvents: disabled ? "none" : undefined,
        ...style,
      }}
      {...props}
    >
      <path d="M894.976 64c70.656 0 128 57.344 128 128v639.488c0 70.656-57.344 128-128 128H128c-70.656 0-128-57.344-128-128V192c0-70.656 57.344-128 128-128h766.976z m0 95.744H128c-15.36 0-28.672 11.264-31.232 26.112l-0.512 5.632v639.488c0 15.36 11.264 28.672 26.112 31.232l5.632 0.512h767.488c15.36 0 28.672-11.264 31.232-26.112l0.512-5.632V192c0-15.36-11.264-28.672-26.112-31.232l-6.144-1.024z m-127.488 287.744c35.328 0 64 28.672 64 64v192c0 35.328-28.672 64-64 64H468.992c-35.328 0-64-28.672-64-64V511.488c0-35.328 28.672-64 64-64h298.496z m0 0" />
    </svg>
  );
};

export default PipIcon;
