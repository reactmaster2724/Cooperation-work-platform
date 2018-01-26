import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {getLocaleMessages} from '../../locales';
import {getThemeSource} from '../../themes';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { IntlProvider } from 'react-intl'
import { AppLayout }  from '../../containers/AppLayout';
import firebase from 'firebase';
import { withFirebase } from 'firekit';
import createHistory from 'history/createBrowserHistory'
import { Router, Route, Switch } from 'react-router-dom';

const history = createHistory();

class Root extends Component {

  handlePresence = (user) => {
    const { firebaseApp }= this.props;
    let myConnectionsRef = firebaseApp.database().ref(`users/${user.uid}/connections`);

    let lastOnlineRef = firebaseApp.database().ref(`users/${user.uid}/lastOnline`);
    lastOnlineRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

    var con = myConnectionsRef.push(true)
    con.onDisconnect().remove();
  }


  onAuthStateChanged = (user) => {
    const {
      clearInitialization,
      watchConnection,
      firebaseApp,
      watchList,
      watchPath
    }= this.props;

    clearInitialization();

    if(user){

      this.handlePresence(user);
      setTimeout(()=>{ watchConnection();}, 1000);

      const userData={
        displayName: user.displayName?user.displayName:'UserName',
        email: user.email?user.email:'-',
        photoURL: user.photoURL,
        emailVerified:user.emailVerified,
        isAnonymous:user.isAnonymous,
        uid: user.uid,
        providerData: user.providerData,
      };

      watchList(`user_grants/${user.uid}`);
      watchPath(`admins/${user.uid}`);

      firebaseApp.database().ref(`users/${user.uid}`).update(userData);

      return userData;

    }else{
      return null;
    }

  }

  componentWillMount () {
    const { watchAuth }= this.props;
    watchAuth(this.onAuthStateChanged);
  }

  componentWillUnmount() {
    const { clearApp }= this.props;
    clearApp();
  }

  render() {
    const { locale, muiTheme, messages}= this.props;

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <IntlProvider locale={locale} messages={messages}>
          <Router history={history} >
            <Switch>
              <Route children={(props)=><AppLayout {...props}/>}/>
            </Switch>
          </Router>
        </IntlProvider>
      </MuiThemeProvider>
    );
  }

}

Root.propTypes = {
  locale: PropTypes.string.isRequired,
  source: PropTypes.object.isRequired,
  messages: PropTypes.object.isRequired,
  muiTheme: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const { theme, locale } = state;

  const source=getThemeSource(theme);
  const messages=getLocaleMessages(locale);
  const muiTheme=getMuiTheme(source);

  return {
    locale,
    source,
    messages,
    muiTheme
  };
};


export default connect(
  mapStateToProps
)(withFirebase(Root));
