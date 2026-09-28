import CIISLoader from "../Loader/CIISLoader";

const RouteBoundaryLoader = ({ label = "Loading page...", overlay = false }) => {
  return <CIISLoader text={label} overlay={overlay} />;
};

export default RouteBoundaryLoader;
