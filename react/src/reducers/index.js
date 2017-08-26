import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import { AddCoin } from './addcoin';
import { toaster } from './toaster';
import { Main } from './main';
import { Dashboard } from './dashboard';
import { ActiveCoin } from './activeCoin';
import { Atomic } from './atomic';
import { Settings } from './settings';
import { Interval } from './interval';
import { SyncOnly } from './syncOnly';
import { Errors } from './errors';
import { login } from "./login";

const appReducer = combineReducers({
  AddCoin,
  toaster,
  login,
  Main,
  Dashboard,
  ActiveCoin,
  Atomic,
  Settings,
  Interval,
  SyncOnly,
  Errors,
  routing: routerReducer,
});

// reset app state on logout
const initialState = appReducer({}, {});
const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = initialState;
  }

  return appReducer(state, action);
}

export default rootReducer;
