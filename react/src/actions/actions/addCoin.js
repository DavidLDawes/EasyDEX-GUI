import { ACTIVE_HANDLE } from '../storeType';
import translate from '../../translate/translate';
import Config from '../../config';
import urlParams from '../../util/url';
import fetchType from '../../util/fetchType';
import mainWindow from '../../util/mainWindow';

import {
  triggerToaster,
  toggleAddcoinModal,
  getDexCoins,
  shepherdElectrumCoins,
} from '../actionCreators';
import {
  startCurrencyAssetChain,
  startAssetChain,
  startCrypto,
  checkAC,
  acConfig,
} from '../../components/addcoin/payload';

export const iguanaActiveHandleState = (json) => {
  return {
    type: ACTIVE_HANDLE,
    isLoggedIn: json.status === 'unlocked' ? true : false,
    handle: json,
  }
}

export const activeHandle = () => {
  return dispatch => {
    const _urlParams = {
      token: Config.token,
    };
    return fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/auth/status${urlParams(_urlParams)}`,
      fetchType.get
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          'activeHandle',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      dispatch(
        iguanaActiveHandleState(json)
      );
    });
  }
}

export const shepherdElectrumAuth = (seed) => {
  return dispatch => {
    return fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/electrum/login`,
      fetchType(
        JSON.stringify({
          seed,
          iguana: true,
          token: Config.token,
        })
      ).post
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          'shepherdElectrumAuth',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      if (json.msg !== 'error') {
        dispatch(activeHandle());
        dispatch(shepherdElectrumCoins());
      } else {
        dispatch(
          triggerToaster(
            translate('TOASTR.INCORRECT_WIF'),
            'Error',
            'error'
          )
        );
      }
    });
  }
}

export const shepherdElectrumAddCoin = (coin) => {
  return dispatch => {
    const _urlParams = {
      coin,
      token: Config.token,
    };
    return fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/electrum/coins/add${urlParams(_urlParams)}`,
      fetchType.get
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          'shepherdElectrumAddCoin',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      dispatch(
        addCoinResult(coin, '0')
      );
    });
  }
}

export const addCoin = (coin, mode, startupParams, genproclimit) => {
  if (mode === 0 ||
      mode === '0') {
    return dispatch => {
      dispatch(shepherdElectrumAddCoin(coin));
    }
  } else {
    return dispatch => {
      dispatch(shepherdGetConfig(coin, mode, startupParams, genproclimit));
    }
  }
}

const handleErrors = (response) => {
  let _parsedResponse;

  if (!response.ok) {
    return null;
  } else {
    _parsedResponse = response.text().then((text) => { return text; });
    return _parsedResponse;
  }
}

export const shepherdHerd = (coin, mode, path, startupParams, genproclimit) => {
  let acData;
  let herdData = {
    'ac_name': coin,
    'ac_options': [
      '-daemon=0',
      '-server',
      `-ac_name=${coin}`
    ],
  };

  if (acConfig[coin]) {
    for (let key in acConfig[coin]) {
      if (key === 'pubkey') {
        const pubKeys = mainWindow.getPubkeys();

        if (pubKeys &&
            pubKeys[coin.toLowerCase()]) {
          herdData['ac_options'].push(`-pubkey=${pubKeys[coin.toLowerCase()].pubHex}`);
        }
      } else if (key === 'genproclimit') {
        if (genproclimit) {
          herdData['ac_options'].push(`-genproclimit=${genproclimit + 1}`);
        } else {
          herdData['ac_options'].push(`-genproclimit=1`);
        }
      } else {
        herdData['ac_options'].push(`-${key}=${acConfig[coin][key]}`);
      }
    }
  }

  if (!acConfig[coin] ||
      (acConfig[coin] && !acConfig[coin].addnode)) {
    herdData['ac_options'].push('-addnode=78.47.196.146');
  }

  if (coin === 'ZEC') {
    herdData = {
      'ac_name': 'zcashd',
      'ac_options': [
        '-daemon=0',
        '-server=1',
      ],
    };
  }

  if (coin === 'KMD') {
    herdData = {
      'ac_name': 'komodod',
      'ac_options': [
        '-daemon=0',
        '-addnode=78.47.196.146',
      ],
    };
  }

  if (coin === 'VRSC') { 
      herdData = {
        'ac_name': 'VRSC',
        'ac_options': [
          '-daemon=0',
          '-server',
          '-ac_algo=verushash',
          '-ac_cc=1',
          '-ac_supply=0',
          '-ac_eras=3',
          '-ac_reward=0,38400000000,2400000000',
          '-ac_halving=1,43200,1051920',
          '-ac_decay=100000000,0,0',
          '-ac_end=10080,226080,0',
          '-addnode=185.25.48.236',
          '-addnode=185.64.105.111',
          '-ac_timelockgte=19200000000',
          '-ac_timeunlockfrom=129600',
          '-ac_timeunlockto=1180800',
          '-ac_veruspos=50',
        ]
      };

    //Checking for VRSC specific config commands  
    if(Config.autoStakeVRSC) {
      herdData['ac_options'].push('-mint');
      console.log('VRSC Staking set to default');
    }
    if(Config.stakeGuard.length === 78) {
      herdData['ac_options'].push('-cheatcatcher=' + Config.stakeGuard);
      console.log('Cheatcatching enabled at address ' + Config.stakeGuard);
    }
    
  }

  if (startupParams) {
    herdData['ac_custom_param'] = startupParams.type;

    if (startupParams.value) {
      herdData['ac_custom_param_value'] = startupParams.value;
    }
  }

  // TODO: switch statement
  if (coin === 'KMD') {
    acData = startCrypto(
      path.result,
      coin,
      mode
    );
  } else {
    const supply = startAssetChain(
      path.result,
      coin,
      mode,
      true
    );
    acData = startAssetChain(
      path.result,
      coin,
      mode
    );
    // herdData.ac_options.push(`-ac_supply=${supply}`);
  }

  return dispatch => {
    let _herd;

    if (coin === 'CHIPS') {
      _herd = 'chipsd';
      herdData = {};
    } else {
      _herd = coin !== 'ZEC' ? 'komodod' : 'zcashd';
    }

    return fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/herd`,
      fetchType(
        JSON.stringify({
          herd: _herd,
          options: herdData,
          token: Config.token,
        })
      ).post
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          translate('FAILED_SHEPHERD_HERD'),
          translate('TOASTR.SERVICE_NOTIFICATION'),
          'error'
        )
      );
    })
    .then(handleErrors)
    .then((json) => {
      if (json) {
        dispatch(
          addCoinResult(coin, mode)
        );
      } else {
        dispatch(
          triggerToaster(
            `${translate('TOASTR.ERROR_STARTING_DAEMON', coin)} ${translate('TOASTR.PORT_IS_TAKEN', acData)}`,
            translate('TOASTR.SERVICE_NOTIFICATION'),
            'error',
            false
          )
        );
      }
    });
  }
}

export const addCoinResult = (coin, mode) => {
  const modeToValue = {
    '0': 'spv',
    '-1': 'native',
    '1': 'staking',
    '2': 'mining',
  };

  return dispatch => {
    dispatch(
      triggerToaster(
        `${coin} ${translate('TOASTR.STARTED_IN')} ${modeToValue[mode].toUpperCase()} ${translate('TOASTR.MODE')}`,
        translate('TOASTR.COIN_NOTIFICATION'),
        'success'
      )
    );
    dispatch(toggleAddcoinModal(false, false));

    if (Number(mode) === 0) {
      dispatch(activeHandle());
      dispatch(shepherdElectrumCoins());
      dispatch(getDexCoins());

      setTimeout(() => {
        dispatch(activeHandle());
        dispatch(shepherdElectrumCoins());
        dispatch(getDexCoins());
      }, 500);
      setTimeout(() => {
        dispatch(activeHandle());
        dispatch(shepherdElectrumCoins());
        dispatch(getDexCoins());
      }, 1000);
      setTimeout(() => {
        dispatch(activeHandle());
        dispatch(shepherdElectrumCoins());
        dispatch(getDexCoins());
      }, 2000);
    } else {
      dispatch(activeHandle());
      dispatch(getDexCoins());

      setTimeout(() => {
        dispatch(activeHandle());
        dispatch(getDexCoins());
      }, 500);
      setTimeout(() => {
        dispatch(activeHandle());
        dispatch(getDexCoins());
      }, 1000);
      setTimeout(() => {
        dispatch(activeHandle());
        dispatch(getDexCoins());
      }, 5000);
    }
  }
}

export const _shepherdGetConfig = (coin, mode, startupParams) => {
  return dispatch => {
    return fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/getconf`,
      fetchType(
        JSON.stringify({
          chain: 'komodod',
          token: Config.token,
        })
      ).post
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          '_shepherdGetConfig',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(
      json => dispatch(
        shepherdHerd(
          coin,
          mode,
          json,
          startupParams
        )
      )
    );
  }
}

export const shepherdGetConfig = (coin, mode, startupParams, genproclimit) => {
  if (coin === 'KMD' &&
      mode === '-1') {
    return dispatch => {
      return fetch(
        `http://127.0.0.1:${Config.agamaPort}/shepherd/getconf`,
        fetchType(
          JSON.stringify({
            chain: 'komodod',
            token: Config.token,
          })
        ).post
      )
      .catch((error) => {
        console.log(error);
        dispatch(
          triggerToaster(
            'shepherdGetConfig',
            'Error',
            'error'
          )
        );
      })
      .then(response => response.json())
      .then(
        json => dispatch(
          shepherdHerd(
            coin,
            mode,
            json,
            startupParams
          )
        )
      );
    }
  } else {
    return dispatch => {
      return fetch(
        `http://127.0.0.1:${Config.agamaPort}/shepherd/getconf`,
        fetchType(
          JSON.stringify({
            chain: coin,
            token: Config.token,
          })
        ).post
      )
      .catch((error) => {
        console.log(error);
        dispatch(
          triggerToaster(
            'shepherdGetConfig',
            'Error',
            'error'
          )
        );
      })
      .then(response => response.json())
      .then(
        json => dispatch(
          shepherdHerd(
            coin,
            mode,
            json,
            startupParams,
            genproclimit
          )
        )
      );
    }
  }
}