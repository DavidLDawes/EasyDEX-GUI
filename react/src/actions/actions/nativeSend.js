import {
  DASHBOARD_ACTIVE_COIN_NATIVE_OPIDS,
  DASHBOARD_ACTIVE_COIN_SENDTO,
} from '../storeType';
import translate from '../../translate/translate';
import { triggerToaster } from '../actionCreators';
import Config from '../../config';
import Store from '../../store';
import fetchType from '../../util/fetchType';

export const sendNativeTx = (coin, _payload) => {
  let payload;
  let _apiMethod;
  let memoHex;

  if (!_payload.sendFrom && !_payload.privateAddrList && !_payload.shieldCoinbase) {
    _apiMethod = 'sendtoaddress';
  } else if (_payload.shieldCoinbase) {
    _apiMethod = 'z_shieldcoinbase';
  } else { 
    _apiMethod = 'z_sendmany';
  }

  if(_payload.memo){
    var hex;
    var i;

    var result = "";
    for (i=0; i<_payload.memo.length; i++) {
        hex = _payload.memo.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    memoHex = result;
  }

  return dispatch => {
    payload = {
      mode: null,
      chain: coin,
      cmd: _apiMethod,
      rpc2cli: Config.rpc2cli,
      token: Config.token,
      params:
        ((!_payload.sendFrom && !_payload.privateAddrList) || 
        (_payload.shieldCoinbase && (_payload.sendTo.length === 95 || _payload.sendTo.length === 78)) ||
        (!_payload.sendFrom && _payload.shieldCoinbase)) ?
        (_payload.shieldCoinbase ? 
          (!_payload.sendFrom ? 
            (
              [
                '*',
                _payload.sendTo
              ]
            )
            :
            (
              [
                _payload.sendFrom,
                _payload.sendTo
              ]
            )
        )
       :
       (_payload.subtractFee ?
          [
            _payload.sendTo,
            _payload.amount,
            '',
            '',
            true
          ]
          :
          [
            _payload.sendTo,
            _payload.amount
          ]
        ))
        :
        ((_payload.sendTo.length === 95 || _payload.sendTo.length === 78) && _payload.memo !== '' ? 
        [
          _payload.sendFrom,
          [{
            address: _payload.sendTo,
            amount: _payload.amount,
            memo: memoHex
          }]
        ]
        :
        [
          _payload.sendFrom,
          [{
            address: _payload.sendTo,
            amount: _payload.amount
          }]
        ]
      )
    };

    fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/cli`,
      fetchType(JSON.stringify({ payload })).post
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          'sendNativeTx',
          'Error',
          'error'
        )
      );
    })
    .then((response) => {
      const _response = response.text().then((text) => { return text; });
      return _response;
    })
    .then((json) => {
      if (json.indexOf('"code":') > -1) {
        let _message = json.substring(
          `${json.indexOf('"message":"') + 11}`,
          json.indexOf('"},"id":"jl777"')
        );

        if ((json.indexOf('"code":-4') > -1) && (coin !== 'VRSC' && coin !== 'VERUSTEST')) {
          dispatch(
            triggerToaster(
              translate('API.UNKNOWN_ERROR'),
              translate('TOASTR.UNKNOWN_ERROR'),
              'error',
            )
          );
        } 

        else if ((json.indexOf('"code":-4') > -1) && (coin === 'VRSC' || coin === 'VERUSTEST')) {
          dispatch(
            triggerToaster(
              translate('API.UNKNOWN_ERROR_VRSC'),
              translate('TOASTR.UNKNOWN_ERROR'),
              'error',
            )
          );
        }
        
        else if (json.indexOf('"code":-5') > -1) {
          dispatch(
            triggerToaster(
              translate('TOASTR.INVALID_ADDRESS', coin),
              translate('TOASTR.WALLET_NOTIFICATION'),
              'error',
            )
          );
        } 
        else if (json.indexOf('"code":-6') > -1) {
          if (_payload.shieldCoinbase){
            dispatch(
              triggerToaster(
                translate('TOASTR.NO_COINBASE_FUNDS'),
                translate('TOASTR.WALLET_NOTIFICATION'),
                'error',
              )
            );
          }
          else{
            dispatch(
              triggerToaster(
                translate('TOASTR.NO_FUNDS'),
                translate('TOASTR.WALLET_NOTIFICATION'),
                'error',
              )
            );
        }
        }
        else {
          if (Config.rpc2cli) {
            _message = JSON.parse(json).error.message;
          }

          dispatch(
            triggerToaster(
              _message,
              translate('TOASTR.WALLET_NOTIFICATION'),
              'error'
            )
          );
        }
      } else {
        if (_payload.shieldCoinbase){
          dispatch(sendToAddressState(JSON.parse(json).result.opid));
        }
        
        else {
          dispatch(sendToAddressState(JSON.parse(json).result));
        }

        dispatch(
          triggerToaster(
            translate('TOASTR.TX_SENT_ALT'),
            translate('TOASTR.WALLET_NOTIFICATION'),
            'success'
          )
        );
      }
    });
  }
}

export function getKMDOPIDState(json) {
  return {
    type: DASHBOARD_ACTIVE_COIN_NATIVE_OPIDS,
    opids: json,
  }
}

// remove?
export const getKMDOPID = (opid, coin) => {
  return dispatch => {
    const payload = {
      mode: null,
      chain: coin,
      cmd: 'z_getoperationstatus',
      rpc2cli: Config.rpc2cli,
      token: Config.token,
    };

    fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/cli`,
      fetchType(JSON.stringify({ payload })).post
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          'getKMDOPID',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      json = json.result;
      dispatch(getKMDOPIDState(json));
    });
  };
}

export const sendToAddressPromise = (coin, address, amount) => {
  return new Promise((resolve, reject) => {
    const payload = {
      mode: null,
      chain: coin,
      cmd: 'sendtoaddress',
      rpc2cli: Config.rpc2cli,
      token: Config.token,
      params: [
        address,
        amount,
        'KMD interest claim request',
        'KMD interest claim request',
        true
      ],
    };

    fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/cli`,
      fetchType(JSON.stringify({ payload })).post
    )
    .catch((error) => {
      console.log(error);
      Store.dispatch(
        triggerToaster(
          'sendToAddress',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      resolve(json);
    });
  });
}

export const sendToAddressState = (json) => {
  return {
    type: DASHBOARD_ACTIVE_COIN_SENDTO,
    lastSendToResponse: json,
  }
}

export const clearLastSendToResponseState = () => {
  return {
    type: DASHBOARD_ACTIVE_COIN_SENDTO,
    lastSendToResponse: null,
  }
}

export const validateAddressPromise = (coin, address) => {
  return new Promise((resolve, reject) => {
    const payload = {
      mode: null,
      chain: coin,
      cmd: 'validateaddress',
      params: [ address ],
      rpc2cli: Config.rpc2cli,
      token: Config.token,
    };

    fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/cli`,
      fetchType(JSON.stringify({ payload })).post
    )
    .catch((error) => {
      console.log(error);
      Store.dispatch(
        triggerToaster(
          'validateAddressPromise',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      resolve(json);
    });
  });
}