import { 
  triggerToaster,
  getPrivateTxList,
  getTransaction,
  getWalletInfo
 } from '../actionCreators';
import Config from '../../config';
import { DASHBOARD_UPDATE } from '../storeType';
import fetchType from '../../util/fetchType';
import { resolve } from 'path';

export const getDashboardUpdate = (coin, activeCoinProps) => {
  return dispatch => {
    const _fetchConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coin: coin,
        rpc2cli: Config.rpc2cli,
        token: Config.token,
      }),
    };

    return fetch(
      `http://127.0.0.1:${Config.agamaPort}/shepherd/native/dashboard/update`,
      fetchType(
        JSON.stringify({
          coin: coin,
          rpc2cli: Config.rpc2cli,
          token: Config.token,
        })
      ).post
    )
    .catch((error) => {
      console.log(error);
      dispatch(
        triggerToaster(
          'getDashboardUpdate',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      let resultObj = {mainJson: json, privateTxList: [], txInfoList: null};

      const _addresses = resultObj.mainJson.result.addresses;
      let privateAddrs = [];
      for (let i = 0; i < _addresses.private.length; i++) {
        privateAddrs.push(_addresses.private[i].address);
      }

      let promiseArray = [];
      for (let i = 0; i < privateAddrs.length; i++) {
        let getPrivateTxListPromise = getPrivateTxList(coin, privateAddrs[i]);
        promiseArray.push(getPrivateTxListPromise);
      }

      let getWalletInfoPromise = getWalletInfo(coin);

      promiseArray.push(getWalletInfoPromise);
      promiseArray.push(resultObj);
      return Promise.all(promiseArray);
    })
    .catch((error) => {
      console.log(error);
    })
    .then(returnList => {
      let resultObj = returnList.pop();
      resultObj.walletInfo = returnList.pop();

      let _privateTxList = [];
      for (let i = 0; i < returnList.length; i++) {
        _privateTxList = _privateTxList.concat(returnList[i]);
      }

      let privateTxCount = 1000

      //TODO: Loop through each addresslist and pop elements until
      // you reach transactionCountPrivate

      if (Config.transactionCountPrivate >= 0) {
        privateTxCount = Math.trunc(Config.transactionCountPrivate);
      }
      
      if (_privateTxList.length > privateTxCount && privateTxCount !== 0){
        _privateTxList = _privateTxList.slice(0, (privateTxCount));
      }
      else if (privateTxCount === 0){
        _privateTxList = [];
      }

      let privateTxData = [resultObj];

      if (_privateTxList.length > 0) {
        _privateTxList.sort((a, b) => {
          return (a.txid < b.txid) ? -1 : (a.txid > b.txid) ? 1 : 0;
        });
      }

      resultObj.privateTxList = _privateTxList;

      return getTransactionGroups(coin, _privateTxList, privateTxData);
    })
    .then(returnList => {
      let resultObj = returnList.shift();

      for (let i = 0; i < returnList.length; i++) {
        let tx = returnList[i];
        let pvtx = resultObj.privateTxList[i];
        tx.amount = pvtx.amount;
        tx.memo = pvtx.memo;
        tx.address = pvtx.address;
        tx.category = 'receive';
      }

      let json = resultObj.mainJson;

      if ((json.result.getinfo.error && json.result.getinfo.error === 'daemon is busy') &&
        (json.result.z_getoperationstatus.error && json.result.z_getoperationstatus.error === 'daemon is busy') &&
        (json.result.listtransactions.error && json.result.listtransactions.error === 'daemon is busy') &&
        (json.result.listtransactions.error && json.result.listtransactions.error === 'daemon is busy')) {
          dispatch(getDashboardUpdateState('error', false, coin, json, null, null));
        } else {
          let _listtransactions = json.result.listtransactions;
      
          if (_listtransactions &&
              _listtransactions.error) {
            _listtransactions = null;
          } else if (
            _listtransactions &&
            _listtransactions.result &&
            _listtransactions.result.length
          ) {
            _listtransactions = _listtransactions.result;
          } else if (
            !_listtransactions ||
            (!_listtransactions.result || !_listtransactions.result.length)
          ) {
            _listtransactions = 'no data';
          }
      
          if (coin === 'CHIPS') {
            dispatch(getDashboardUpdateState('chips', false, coin, json, _listtransactions, null));
          } else {

            //console.log(_listtransactions)

            let publicTxCount = 1000

            if (Config.transactionCountPublic > 0) {
              publicTxCount = Math.trunc(Config.transactionCountPublic);
            }

            if (_listtransactions !== 'no data'){
              if (_listtransactions.length > publicTxCount) {
                _listtransactions = _listtransactions.slice(-1*(publicTxCount));
              }
  
              _listtransactions = _listtransactions.filter(
                (tx) => {
                  if (tx.category === 'stake') {
                    if (tx.amount > 0) {
                      return true;
                    }
                    else {
                      return false;
                    }
                  }
                  else {
                    return true
                  }
              });
            } else {
              _listtransactions = [];
            }
            
              
            let allTransactions = _listtransactions.concat(returnList);
      
            // calc transparent balance properly
            let _tbalance = resultObj.walletInfo.balance;
            let _ibalance = resultObj.walletInfo.immature_balance;
      
            json.result.z_gettotalbalance.result.transparent = _tbalance.toFixed(8);
            json.result.z_gettotalbalance.result.total = Number(json.result.z_gettotalbalance.result.transparent) + Number(json.result.z_gettotalbalance.result.interest) + Number(json.result.z_gettotalbalance.result.private) + Number(_ibalance);
            json.result.z_gettotalbalance.result.total = json.result.z_gettotalbalance.result.total.toFixed(8);
            json.result.z_gettotalbalance.result.immature = _ibalance.toFixed(8);
            
            // dirty hack to trigger dashboard render
            if (!activeCoinProps ||
                (activeCoinProps && !activeCoinProps.balance && !activeCoinProps.addresses)) {
                setTimeout(() => {
                  dispatch(getDashboardUpdateState('standard', false, coin, json, _listtransactions, allTransactions));
                }, 100);
              }
              dispatch(getDashboardUpdateState('standard', false, coin, json, _listtransactions, allTransactions));
          }
        }

    });
  }
}

export const getTransactionGroups = (coin, array, results) => {
  let txInputGroups = [{ coin: coin, group: array.slice(0, 100)}];
  let numCounted = txInputGroups[0].group.length;

  while (numCounted < array.length) {
    txInputGroups.push({coin: coin, group: array.slice(numCounted, numCounted + 100)});
    numCounted += txInputGroups[txInputGroups.length - 1].group.length;
  }

  return txInputGroups.reduce((p, a) => {
    return p.then(chainResults => {
      return getTransactions(a.coin, a.group).then( txGroup => {
        return chainResults.concat(txGroup);
      })
    })},
    Promise.resolve(results)
  )
}

export const getTransactions = (coin, array) => {
  let promiseArray = [];
  for (let i = 0; i < array.length; i++)
  {
    promiseArray.push(getTransaction(coin, array[i].txid));
  }
  return Promise.all(promiseArray);
}

export const getDashboardUpdateState = (type, fakeResponse, coin, json, _listtransactions, allTransactions) => {
  
  if (fakeResponse || type === 'error') {
    return {
      type: DASHBOARD_UPDATE,
      progress: null,
      opids: null,
      txhistory: null,
      balance: null,
      addresses: null,
      coin: coin,
      getinfoFetchFailures: 0,
      rescanInProgress: true,
    };
  }

  else if (type === 'chips') {
    return {
      type: DASHBOARD_UPDATE,
      progress: json.result.getinfo.result,
      opids: null,
      txhistory: _listtransactions,
      balance: {
        transparent: json.result.getbalance.result,
        total: json.result.getbalance.result,
      },
      addresses: json.result.addresses,
      coin: coin,
      getinfoFetchFailures: 0,
      rescanInProgress: false,
    };
  }

  else if (type === 'standard') {
    return {
      type: DASHBOARD_UPDATE,
      progress: json.result.getinfo.result,
      opids: json.result.z_getoperationstatus.result,
      txhistory: allTransactions,
      balance: json.result.z_gettotalbalance.result,
      addresses: json.result.addresses,
      coin: coin,
      getinfoFetchFailures: 0,
      rescanInProgress: false,
    };
  }
}