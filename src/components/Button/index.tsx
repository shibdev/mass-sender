import React from "react";
import cx from "classnames";
import "./style.scss";

interface IProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  fontFamily?: string;
  fontWeight?: string;
  gradient?: boolean;
}

const Button: React.FC<IProps> = ({
  children,
  className,
  onClick,
  fontFamily,
  fontWeight,
  gradient,
}) => {
  const textStyle = { fontFamily, fontWeight };
  return (
    <div className={gradient ? "button__gradient" : ""}>
      <button onClick={onClick} className={cx(className, "button")}>
        <div style={textStyle}>{children}</div>
      </button>
    </div>
  );
};

export default Button;
