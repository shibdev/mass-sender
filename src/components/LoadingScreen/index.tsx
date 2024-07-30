import React from "react";
import "./style.scss";
import loadingAnimation from "./data/animation.json";
import Lottie from "lottie-react";
const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-screen__text">Fintopio sender</div>
      <Lottie animationData={loadingAnimation} loop autoPlay />
      <div className="loading-screen__text">Loading...</div>
    </div>
  );
};

export default LoadingScreen;
