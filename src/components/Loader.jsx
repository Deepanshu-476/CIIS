import React from 'react';
import CIISLoader from '../Loader/CIISLoader';

const Loader = ({ message = 'Loading...', showMessage = true }) => {
  return <CIISLoader text={showMessage ? message : ''} />;
};

export default Loader;