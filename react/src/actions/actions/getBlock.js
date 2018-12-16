import { triggerToaster } from '../actionCreators';
import Config from '../../config';
import Store from '../../store';
import fetchType from '../../util/fetchType';

export const getBlock = (coin, blockhash) => {
  return new Promise((resolve, reject) => {
    let payload = {
      mode: null,
      chain: coin,
      cmd: 'getblock',
      params: [
        blockhash
      ],
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
          'getMiningInfo',
          'Error',
          'error'
        )
      );
    })
    .then(response => response.json())
    .then(json => {
      let result = json.result ? json.result : json;
      resolve(result);
    });
  });
}