import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const TAG = 'root'
const smallTree = 'https://gist.githubusercontent.com/keiono/2e9dee7cdedc5fce548acad71e21e052/raw/215cb50e7b0e71fb7200a846b551c31683a21e97/data1.json'

// Styles
const appStyle = {
  backgroundColor: '#eeeeee',
  color: '#EEEEEE',
  width: '100%',
  height: '100%',
};

const style = {
  width: '100%',
  height: '100%',
  backgroundColor: '#404040',
};

const titleStyle = {
  height: '2em',
  margin: 0,
  fontWeight: 100,
  color: '#777777',
  paddingTop: '0.2em',
  paddingLeft: '0.8em',
};

const renderPage = tree => {
  ReactDOM.render(
    <App
      tree={tree}
      style={style}
      appStyle={appStyle}
      titleStyle={titleStyle}
    />,
    document.getElementById(TAG)
  )
}

// Download the data and run the app
fetch(smallTree)
  .then(response => (response.json()))
  .then(tree => {
    renderPage(tree)
  });

registerServiceWorker();

