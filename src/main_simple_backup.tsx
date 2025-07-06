import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleThreeTest from './components/SimpleThreeTest';
import './styles/globals.css';

const App = () => {
  return (
    <div className="w-full h-screen bg-gray-900">
      <SimpleThreeTest />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
