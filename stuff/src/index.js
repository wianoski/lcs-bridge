import React from 'react';
import ReactDOM from 'react-dom';
import './Asset/index.css';
import './Asset/chartist.css';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';
import * as serviceWorker from './Backend/serviceWorker';
import env from './env.json'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
import 'firebase/auth'
import 'firebase/messaging'
import Routes from './Backend/Routes'
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import moment from 'moment-timezone';
import 'moment/locale/id'
moment.locale('id')

firebase.initializeApp(env.firebaseApi)
export var fs = firebase.firestore()
export var db = firebase.database()
export var auth = firebase.auth()
export var base = firebase
const palette = {
  primary: { main: '#0D47A1' },
  secondary: { main: '#FDD835' }
};
const themeName = 'Tory Blue Bright Sun Rabbit';

const Index = () => {
  var head = document.getElementsByTagName('head')[0];
  var insertBefore = head.insertBefore;
  head.insertBefore = function (newElement, referenceElement) {
    if (newElement.href && newElement.href.indexOf('https://fonts.googleapis.com/css?family=Roboto') === 0) {
      return;
    }
    insertBefore.call(head, newElement, referenceElement);
  };
  const theme = createMuiTheme({ palette, themeName });
  return (
    <MuiThemeProvider theme={theme}>
      <MuiPickersUtilsProvider libInstance={moment} utils={MomentUtils} locale={'id'}>
        <Routes />
      </MuiPickersUtilsProvider>
    </MuiThemeProvider>
  )
}

ReactDOM.render(
  <Index />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
