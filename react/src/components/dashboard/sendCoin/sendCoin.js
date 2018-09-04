import React from 'react';
import { connect } from 'react-redux';
import Config from '../../../config';
import translate from '../../../translate/translate';
import {
  triggerToaster,
  sendNativeTx,
  getKMDOPID,
  clearLastSendToResponseState,
  shepherdElectrumSend,
  shepherdElectrumSendPreflight,
  shepherdGetRemoteBTCFees,
  shepherdGetLocalBTCFees,
  shepherdGetRemoteTimestamp,
  copyString,
  loginWithPin,
} from '../../../actions/actionCreators';
import Store from '../../../store';
import {
  AddressListRender,
  SendRender,
  SendFormRender,
  _SendFormRender,
} from './sendCoin.render';
import mainWindow from '../../../util/mainWindow';
import Slider, { Range } from 'rc-slider';
import ReactTooltip from 'react-tooltip';
import {
  secondsToString,
  checkTimestamp,
} from 'agama-wallet-lib/src/time';
import { explorerList } from 'agama-wallet-lib/src/coin-helpers';
import { isPositiveNumber } from 'agama-wallet-lib/src/utils';

const { shell } = window.require('electron');
const SPV_MAX_LOCAL_TIMESTAMP_DEVIATION = 60; // seconds

// TODO: - render z address trim

const _feeLookup = [
  'fastestFee',
  'halfHourFee',
  'hourFee',
  'advanced'
];

class SendCoin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 0,
      addressType: null,
      sendFrom: null,
      sendFromAmount: 0,
      privateAddrList: false,
      shieldCoinbase: false,
      sendTo: '',
      amount: 0,
      memo: '',
      memoHEX: '',
      fee: 0,
      addressSelectorOpen: false,
      renderAddressDropdown: true,
      subtractFee: false,
      lastSendToResponse: null,
      coin: null,
      spvVerificationWarning: false,
      spvPreflightSendInProgress: false,
      btcFees: {},
      btcFeesType: 'halfHourFee',
      btcFeesAdvancedStep: 9,
      btcFeesSize: 0,
      btcFeesTimeBasedStep: 1,
      spvPreflightRes: null,
      kvSend: false,
      kvSendTag: '',
      kvSendTitle: '',
      kvSendContent: '',
      kvHex: '',
      pin: '',
      noUtxo: false,
    };
    this.defaultState = JSON.parse(JSON.stringify(this.state));
    this.updateInput = this.updateInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.openDropMenu = this.openDropMenu.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.checkZAddressCount = this.checkZAddressCount.bind(this);
    this.setRecieverFromScan = this.setRecieverFromScan.bind(this);
    this.renderOPIDListCheck = this.renderOPIDListCheck.bind(this);
    this.SendFormRender = _SendFormRender.bind(this);
    this.isTransparentTx = this.isTransparentTx.bind(this);
    this.toggleSubtractFee = this.toggleSubtractFee.bind(this);
    this.isFullySynced = this.isFullySynced.bind(this);
    this.setSendAmountAll = this.setSendAmountAll.bind(this);
    this.setSendToSelf = this.setSendToSelf.bind(this);
    this.fetchBTCFees = this.fetchBTCFees.bind(this);
    this.onSliderChange = this.onSliderChange.bind(this);
    this.onSliderChangeTime = this.onSliderChangeTime.bind(this);
    this.togglePrivateAddrList = this.togglePrivateAddrList.bind(this);
    this.toggleShieldCoinbase = this.toggleShieldCoinbase.bind(this);
    this.toggleKvSend = this.toggleKvSend.bind(this);
    this.verifyPin = this.verifyPin.bind(this);
    this.setMemoHex = this.setMemoHex.bind(this);
    //this.loadTestData = this.loadTestData.bind(this);
  }

  verifyPin() {
    loginWithPin(this.state.pin, mainWindow.pinAccess)
    .then((res) => {
      if (res.msg === 'success') {
        this.refs.pin.value = '';

        this.setState({
          pin: '',
        });

        this.changeSendCoinStep(2);
      }
    });
  }

  /*loadTestData() {
    this.setState({
      kvSendTag: 'test',
      kvSendTitle: 'This is a test kv',
      kvSendContent: 'test test test test',
    });
  }*/

  toggleKvSend() {
    if (this.state.kvSend) {
      this.setState({
        kvSend: !this.state.kvSend,
        amount: '',
        sendTo: '',
      });
    } else {
      this.setState({
        kvSend: !this.state.kvSend,
        amount: 0.0001,
        sendTo: this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub,
      });
    }
  }

  setSendAmountAll() {
    const _amount = this.state.amount;
    const _amountSats = this.state.amount * 100000000;
    const _balanceSats = this.props.ActiveCoin.balance.balanceSats;
    let _fees = mainWindow.spvFees;
    _fees.BTC = 0;

    if (this.props.ActiveCoin.mode === 'native') {
      if (this.state.sendFrom){
        let _sendFromAmount = Number(this.state.sendFromAmount);
        let _sendFromAmountSats = _sendFromAmount * 100000000;
        let _sendToAmount = (_sendFromAmountSats - 10000)/100000000;
        this.setState({
          amount: _sendToAmount,
        });
      }
      else if (!this.state.sendFrom && !this.state.privateAddrList){
        let _sendFromAmount = Number(this.props.ActiveCoin.balance.transparent);
        let _sendFromAmountSats = _sendFromAmount * 100000000;
        let _sendToAmount = (_sendFromAmountSats - 10000)/100000000;
        this.setState({
          amount: _sendToAmount,
        });
      }
      else {
        this.setState({
          amount: translate('DASHBOARD.SEND_FROMADDR_REQ'),
        });
      }
    } else {
      this.setState({
        amount: Number((0.00000001 * (_balanceSats - _fees[this.props.ActiveCoin.coin])).toFixed(8)),
      });
    }
  }

  setSendToSelf() {
    this.setState({
      sendTo: this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub,
    });
  }

  copyTXID(txid) {
    Store.dispatch(copyString(txid, translate('SEND.TXID_COPIED')));
  }

  openExplorerWindow(txid) {
    const url = explorerList[this.props.ActiveCoin.coin].split('/').length - 1 > 2 ? `${explorerList[this.props.ActiveCoin.coin]}${txid}` : `${explorerList[this.props.ActiveCoin.coin]}/tx/${txid}`;
    return shell.openExternal(url);
  }

  SendFormRender() {
    return _SendFormRender.call(this);
  }

  toggleSubtractFee() {
    this.setState({
      subtractFee: !this.state.subtractFee,
    });
  }

  componentWillMount() {
    document.addEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  componentWillReceiveProps(props) {

    if (this.props.ActiveCoin.coin !== props.ActiveCoin.coin) {
      if(this.props.ActiveCoin.coin !== 'VRSC'){
        this.setState({
          shieldCoinbase: false,
        });
      }  
    }

    if (this.props.ActiveCoin.coin !== props.ActiveCoin.coin &&
        this.props.ActiveCoin.lastSendToResponse) {
      Store.dispatch(clearLastSendToResponseState());
    }
    this.checkZAddressCount(props);

    if (this.props.ActiveCoin.activeSection !== props.ActiveCoin.activeSection &&
        this.props.ActiveCoin.activeSection !== 'send') {
      this.fetchBTCFees();

      if (this.props.ActiveCoin.mode === 'spv') {
        shepherdGetRemoteTimestamp()
        .then((res) => {
          if (res.msg === 'success') {
            if (Math.abs(checkTimestamp(res.result)) > SPV_MAX_LOCAL_TIMESTAMP_DEVIATION) {
              Store.dispatch(
                triggerToaster(
                  translate('SEND.CLOCK_OUT_OF_SYNC'),
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'warning',
                  false
                )
              );
            }
          }
        });
      }
    }
  }

  setRecieverFromScan(receiver) {
    try {
      const recObj = JSON.parse(receiver);

      if (recObj &&
          typeof recObj === 'object') {
        if (recObj.coin === this.props.ActiveCoin.coin) {
          if (recObj.amount) {
            this.setState({
              amount: recObj.amount,
            });
          }
          if (recObj.address) {
            this.setState({
              sendTo: recObj.address,
            });
          }
        } else {
          Store.dispatch(
            triggerToaster(
              translate('SEND.QR_COIN_MISMATCH_MESSAGE_IMPORT_COIN') +
              recObj.coin +
              translate('SEND.QR_COIN_MISMATCH_MESSAGE_ACTIVE_COIN') +
              this.props.ActiveCoin.coin +
              translate('SEND.QR_COIN_MISMATCH_MESSAGE_END'),
              translate('SEND.QR_COIN_MISMATCH_TITLE'),
              'warning'
            )
          );
        }
      }
    } catch (e) {
      this.setState({
        sendTo: receiver,
      });
    }

    document.getElementById('kmdWalletSendTo').focus();
  }

  handleClickOutside(e) {
    if (e.srcElement.className !== 'btn dropdown-toggle btn-info' &&
        (e.srcElement.offsetParent && e.srcElement.offsetParent.className !== 'btn dropdown-toggle btn-info') &&
        (e.path && e.path[4] && e.path[4].className.indexOf('showkmdwalletaddrs') === -1)) {
      this.setState({
        addressSelectorOpen: false,
      });
    }
  }

  checkZAddressCount(props) {
    const _addresses = this.props.ActiveCoin.addresses;
    const _defaultState = {
      currentStep: 0,
      addressType: null,
      sendFrom: null,
      sendFromAmount: 0,
      sendTo: '',
      amount: 0,
      fee: 0,
      addressSelectorOpen: false,
      renderAddressDropdown: true,
      subtractFee: false,
      lastSendToResponse: null,
    };
    let updatedState;

    if (_addresses &&
        (!_addresses.private || _addresses.private.length === 0)) {
      updatedState = {
        renderAddressDropdown: false,
        lastSendToResponse: props.ActiveCoin.lastSendToResponse,
        coin: props.ActiveCoin.coin,
      };
    } else {
      updatedState = {
        renderAddressDropdown: true,
        lastSendToResponse: props.ActiveCoin.lastSendToResponse,
        coin: props.ActiveCoin.coin,
      };
    }

    if (this.state.coin !== props.ActiveCoin.coin) {
      this.setState(Object.assign({}, _defaultState, updatedState));
    } else {
      this.setState(updatedState);
    }
  }

  renderAddressByType(type) {
    const _coinAddresses = this.props.ActiveCoin.addresses;
    let _items = [];

    if (_coinAddresses &&
        _coinAddresses[type] &&
        _coinAddresses[type].length) {
      _coinAddresses[type].map((address) => {
        if (address.amount > 0 &&
            (type !== 'public' || (address.canspend && type === 'public'))) {
          _items.push(
            <li
              className="selected"
              key={ address.address }>
              <a onClick={ () => this.updateAddressSelection(address.address, type, address.amount) }>
                <i className={ 'icon fa-eye' + (type === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
                <span className="text">
                  [ { address.amount } { this.props.ActiveCoin.coin } ]&nbsp;&nbsp;
                  { type === 'public' ? address.address : address.address.substring(0, 34) + '...' }
                </span>
                <span
                  className="glyphicon glyphicon-ok check-mark pull-right"
                  style={{ display: this.state.sendFrom === address.address ? 'inline-block' : 'none' }}></span>
              </a>
            </li>
          );
        }
      });

      return _items;
    } else {
      return null;
    }
  }

  renderOPIDListCheck() {
    if (this.state.renderAddressDropdown &&
        this.props.ActiveCoin.opids &&
        this.props.ActiveCoin.opids.length) {
      return true;
    }
  }

  renderSelectorCurrentLabel() {
    if (this.state.sendFrom) {
      return (
        <span>
          <i className={ 'icon fa-eye' + this.state.addressType === 'public' ? '' : '-slash' }></i>
          <span className="text">
            [ { this.state.sendFromAmount } { this.props.ActiveCoin.coin } ]  
            { this.state.addressType === 'public' ? this.state.sendFrom : this.state.sendFrom.substring(0, 34) + '...' }
          </span>
        </span>
      );
    } else {
      if (!this.state.privateAddrList && !this.state.shieldCoinbase){
        return (
          <span>
            { this.props.ActiveCoin.mode === 'spv' ? `[ ${this.props.ActiveCoin.balance.balance} ${this.props.ActiveCoin.coin} ] ${this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub}`
            : translate('INDEX.T_FUNDS') }
          </span>
        );
      }
      else if (!this.state.privateAddrList && this.state.shieldCoinbase) {
        return (
          <span>
            { this.props.ActiveCoin.mode === 'spv' ? `[ ${this.props.ActiveCoin.balance.balance} ${this.props.ActiveCoin.coin} ] ${this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub}` 
            : translate('INDEX.UNSHIELDED_FUNDS') }
          </span>
        );
      }
      else {
        return (
          <span>
            { this.props.ActiveCoin.mode === 'spv' ? `[ ${this.props.ActiveCoin.balance.balance} ${this.props.ActiveCoin.coin} ] ${this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub}` 
            : translate('INDEX.Z_ADDR_UNSELECTED') }
          </span>
        );
      }
    }
  }

  renderAddressList() {
    return AddressListRender.call(this);
  }

  renderOPIDLabel(opid) {
    const _satatusDef = {
      queued: {
        icon: 'warning',
        label: 'QUEUED',
      },
      executing: {
        icon: 'info',
        label: 'EXECUTING',
      },
      failed: {
        icon: 'danger',
        label: 'FAILED',
      },
      success: {
        icon: 'success',
        label: 'SUCCESS',
      },
    };

    return (
      <span className={ `label label-${_satatusDef[opid.status].icon}` }>
        <i className="icon fa-eye"></i>&nbsp;
        <span>{ translate(`KMD_NATIVE.${_satatusDef[opid.status].label}`) }</span>
      </span>
    );
  }

  renderOPIDResult(opid) {
    let isWaitingStatus = true;

    if (opid.status === 'queued') {
      isWaitingStatus = false;
      return (
        <i>{ translate('SEND.AWAITING') }...</i>
      );
    } else if (opid.status === 'executing') {
      isWaitingStatus = false;
      return (
        <i>{ translate('SEND.PROCESSING') }...</i>
      );
    } else if (opid.status === 'failed') {
      isWaitingStatus = false;
      return (
        <span>
          <strong>{ translate('SEND.ERROR_CODE') }:</strong> <span>{ opid.error.code }</span>
          <br />
          <strong>{ translate('KMD_NATIVE.MESSAGE') }:</strong> <span>{ opid.error.message }</span>
        </span>
      );
    } else if (opid.status === 'success') {
      isWaitingStatus = false;
      return (
        <span>
          <strong>{ translate('KMD_NATIVE.TXID') }:</strong> <span>{ opid.result.txid }</span>
          <br />
          <strong>{ translate('KMD_NATIVE.EXECUTION_SECONDS') }:</strong> <span>{ opid.execution_secs }</span>
        </span>
      );
    }

    if (isWaitingStatus) {
      return (
        <span>{ translate('SEND.WAITING') }...</span>
      );
    }
  }

  renderOPIDList() {
    if (this.props.ActiveCoin.opids &&
        this.props.ActiveCoin.opids.length) {
      return this.props.ActiveCoin.opids.map((opid) =>
        <tr key={ opid.id }>
          <td>{ this.renderOPIDLabel(opid) }</td>
          <td>{ opid.id }</td>
          <td>{ secondsToString(opid.creation_time) }</td>
          <td>{ this.renderOPIDResult(opid) }</td>
        </tr>
      );
    } else {
      return null;
    }
  }

  openDropMenu() {
    this.setState(Object.assign({}, this.state, {
      addressSelectorOpen: !this.state.addressSelectorOpen,
    }));
  }

  togglePrivateAddrList() {
    this.setState({
      privateAddrList: !this.state.privateAddrList,
      shieldCoinbase: false,
    });
  }

  toggleShieldCoinbase() {
    this.setState({
      shieldCoinbase: !this.state.shieldCoinbase,
    }, () => {
      if(this.state.shieldCoinbase){
        this.setState({
          sendFrom: null,
          amount: 0,
        });
      }
    });
  }

  updateAddressSelection(address, type, amount) {
    this.setState(Object.assign({}, this.state, {
      sendFrom: address,
      addressType: type,
      sendFromAmount: amount,
      addressSelectorOpen: !this.state.addressSelectorOpen,
    }));
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  encodeStringToHex(stringToConvert) {
    var hex;
    var i;

    var result = "";
    for (i=0; i<stringToConvert.length; i++) {
        hex = stringToConvert.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
  }

  fetchBTCFees() {
    if (this.props.ActiveCoin.mode === 'spv' &&
        this.props.ActiveCoin.coin === 'BTC') {
      shepherdGetRemoteBTCFees()
      .then((res) => {
        if (res.msg === 'success') {
          // TODO: check, approx fiat value
          this.setState({
            btcFees: res.result,
            btcFeesSize: this.state.btcFeesType === 'advanced' ? res.result.electrum[this.state.btcFeesAdvancedStep] : res.result.recommended[_feeLookup[this.state.btcFeesTimeBasedStep]],
          });
        } else {
          shepherdGetLocalBTCFees()
          .then((res) => {
            if (res.msg === 'success') {
              // TODO: check, approx fiat value
              this.setState({
                btcFees: res.result,
                btcFeesSize: this.state.btcFeesType === 'advanced' ? res.result.electrum[this.state.btcFeesAdvancedStep] : res.result.recommended[_feeLookup[this.state.btcFeesTimeBasedStep]],
              });
            } else {
              Store.dispatch(
                triggerToaster(
                  translate('SEND.CANT_GET_BTC_FEES'),
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
            }
          });
        }
      });
    }
  }

  changeSendCoinStep(step, back) {
    if (this.props.ActiveCoin.mode === 'spv') {
      shepherdGetRemoteTimestamp()
      .then((res) => {
        if (res.msg === 'success') {
          if (Math.abs(checkTimestamp(res.result)) > SPV_MAX_LOCAL_TIMESTAMP_DEVIATION) {
            Store.dispatch(
              triggerToaster(
                translate('SEND.CLOCK_OUT_OF_SYNC'),
                translate('TOASTR.WALLET_NOTIFICATION'),
                'warning',
                false
              )
            );
          }
        }
      });
    }

    if (step === 0) {
      this.fetchBTCFees();

      if (back) {
        this.setState({
          currentStep: 0,
          spvVerificationWarning: false,
          spvPreflightSendInProgress: false,
          pin: '',
          noUtxo: false,
        });
      } else {
        Store.dispatch(clearLastSendToResponseState());

        this.setState(this.defaultState);
      }
    }

    if (step === 1) {
      if (!this.validateSendFormData()) {
        return;
      } else {
        let kvHex;

        if (this.state.kvSend) {
          const kvEncode = mainWindow.kvEncode({
            tag: this.state.kvSendTag,
            content: {
              title: this.state.kvSendTitle,
              version: '01',
              body: this.state.kvSendContent,
            },
          });

          // console.warn(kvEncode);
          kvHex = kvEncode;
        }

        this.setState(Object.assign({}, this.state, {
          spvPreflightSendInProgress: this.props.ActiveCoin.mode === 'spv' ? true : false,
          currentStep: step,
          kvHex,
        }));

        // spv pre tx push request
        if (this.props.ActiveCoin.mode === 'spv') {
          shepherdElectrumSendPreflight(
            this.props.ActiveCoin.coin,
            this.state.amount * 100000000,
            this.state.sendTo,
            this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub,
            this.props.ActiveCoin.coin === 'BTC' ? this.state.btcFeesSize : null,
            this.state.kvSend,
            kvHex,
          )
          .then((sendPreflight) => {
            if (sendPreflight &&
                sendPreflight.msg === 'success') {
              this.setState(Object.assign({}, this.state, {
                spvVerificationWarning: !sendPreflight.result.utxoVerified,
                spvPreflightSendInProgress: false,
                spvPreflightRes: {
                  fee: sendPreflight.result.fee,
                  value: sendPreflight.result.value,
                  change: sendPreflight.result.change,
                  estimatedFee: sendPreflight.result.estimatedFee,
                },
              }));
            } else {
              this.setState(Object.assign({}, this.state, {
                spvPreflightSendInProgress: false,
                noUtxo: sendPreflight.result === 'no valid utxo' ? true : false,
              }));
            }
          });
        }
      }
    }

    if (step === 2) {
      this.setState(Object.assign({}, this.state, {
        currentStep: step,
      }));
      this.handleSubmit();
    }
  }

  handleSubmit() {
    if (!this.validateSendFormData()) {
      return;
    }

    if (this.props.ActiveCoin.mode === 'native') {
      Store.dispatch(
        sendNativeTx(
          this.props.ActiveCoin.coin,
          this.state
        )
      );

      if (this.state.addressType === 'private') {
        setTimeout(() => {
          Store.dispatch(
            getKMDOPID(
              null,
              this.props.ActiveCoin.coin
            )
          );
        }, 1000);
      }
    } else if (this.props.ActiveCoin.mode === 'spv') {
      // no op
      if (this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub) {
        Store.dispatch(
          shepherdElectrumSend(
            this.props.ActiveCoin.coin,
            this.state.amount * 100000000,
            this.state.sendTo,
            this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub,
            this.props.ActiveCoin.coin === 'BTC' ? this.state.btcFeesSize : null,
            this.state.kvSend,
            this.state.kvHex,
          )
        );
      }
    }
  }

  // TODO: reduce to a single toast
  validateSendFormData() {
    let valid = true;

    if (this.state.memo && this.state.sendTo.length === 95) {
      let hexMemo = this.encodeStringToHex(this.state.memo);
      this.setMemoHex(hexMemo);
    }

    if (this.props.ActiveCoin.mode === 'spv') {
      const _amount = this.state.amount;
      const _amountSats = Math.floor(this.state.amount * 100000000);
      const _balanceSats = this.props.ActiveCoin.balance.balanceSats;
      let _fees = mainWindow.spvFees;
      _fees.BTC = 0;

      if (Number(_amountSats) + _fees[this.props.ActiveCoin.coin] > _balanceSats) {
        Store.dispatch(
          triggerToaster(
            `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE')} ${Number((0.00000001 * (_balanceSats - _fees[this.props.ActiveCoin.coin])).toFixed(8))} ${this.props.ActiveCoin.coin}`,
            translate('TOASTR.WALLET_NOTIFICATION'),
            'error'
          )
        );
        valid = false;
      } else if (Number(_amountSats) < _fees[this.props.ActiveCoin.coin] && !this.state.kvSend) {
        Store.dispatch(
          triggerToaster(
            `${translate('SEND.AMOUNT_IS_TOO_SMALL', this.state.amount)}, ${translate('SEND.MIN_AMOUNT_IS', this.props.ActiveCoin.coin)} ${Number(_fees[this.props.ActiveCoin.coin] * 0.00000001)}`,
            translate('TOASTR.WALLET_NOTIFICATION'),
            'error'
          )
        );
        valid = false;
      }
    }

    if (!this.state.sendTo ||
        (this.state.sendTo && this.state.sendTo.substring(0, 2) !== 'zc')) {
      const _validateAddress = mainWindow.addressVersionCheck(this.props.ActiveCoin.coin, this.state.sendTo);
      let _msg;

      if (_validateAddress === 'Invalid pub address') {
        _msg = _validateAddress;
      } else if (!_validateAddress) {
        _msg = `${this.state.sendTo} ${translate('SEND.VALIDATION_IS_NOT_VALID_ADDR_P1')} ${this.props.ActiveCoin.coin} ${translate('SEND.VALIDATION_IS_NOT_VALID_ADDR_P2')}`;
      }

      if (_msg) {
        Store.dispatch(
          triggerToaster(
            _msg,
            translate('TOASTR.WALLET_NOTIFICATION'),
            'error'
          )
        );
        valid = false;
      }
    }

    if (!isPositiveNumber(this.state.amount) && Number(this.state.amount) !== 0) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.AMOUNT_POSITIVE_NUMBER'),
          translate('TOASTR.WALLET_NOTIFICATION'),
          'error'
        )
      );
      valid = false;
    }

    if (this.props.ActiveCoin.mode === 'native') {
      if (this.state.shieldCoinbase){
        if (this.state.sendFrom && this.state.addressType === 'public'){
          if (Number(this.state.sendFromAmount) <= 0.0001){
            Store.dispatch(
              triggerToaster(
                `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE_IN_ADDR')} ${Number(this.state.sendFromAmount)} ${this.props.ActiveCoin.coin}`,
                translate('TOASTR.WALLET_NOTIFICATION'),
                'error'
              )
            );
            valid = false;
          }
        }
        else if (!this.state.sendFrom){
          if (Number(this.props.ActiveCoin.balance.transparent) <= 0.0001){
            Store.dispatch(
              triggerToaster(
                `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE')} ${Number(this.props.ActiveCoin.balance.transparent)} ${this.props.ActiveCoin.coin}`,
                translate('TOASTR.WALLET_NOTIFICATION'),
                'error'
              )
            );
            valid = false;
          }
        }
        else {
          Store.dispatch(
            triggerToaster(
              `${translate('SEND.PLEASE_SELECT_COINBASE_ADDRESS')}`,
              translate('TOASTR.IMPROPER_ADDRESS'),
              'error'
            )
          );
          valid = false;
        }
      }
      else if (!this.state.shieldCoinbase && (this.state.addressType === 'public' && !this.state.privateAddrList)) {
        if (this.state.sendFrom) {
          if (this.state.sendTo && this.state.sendTo.length > 34) {
            if (Number(Number(this.state.amount) + 0.0001) > Number(this.state.sendFromAmount)) {
              Store.dispatch(
                triggerToaster(
                  `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE_IN_ADDR')} ${Number(this.state.sendFromAmount)} ${this.props.ActiveCoin.coin}`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              valid = false;
            }
          }
          else if (this.state.sendTo) {
            if (Number(Number(this.state.amount) + (this.state.subtractFee ? 0 : 0.0001)) > Number(this.props.ActiveCoin.balance.transparent)){
              Store.dispatch(
                triggerToaster(
                  `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE_IN_ADDR')} ${Number(this.state.sendFromAmount)} ${this.props.ActiveCoin.coin}`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              valid = false;
            }
          }
        }
        else {
          if (this.state.sendTo && this.state.sendTo.length > 34) {
            if (Number(Number(this.state.amount) + 0.0001) > Number(this.state.sendFromAmount)) {
              Store.dispatch(
                triggerToaster(
                  `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE')} ${Number(this.props.ActiveCoin.balance.transparent)} ${this.props.ActiveCoin.coin}`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              valid = false;
            }
          }
          else if (this.state.sendTo) {
            if (Number(Number(this.state.amount) + (this.state.subtractFee ? 0 : 0.0001)) > Number(this.props.ActiveCoin.balance.transparent)){
              Store.dispatch(
                triggerToaster(
                  `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE')} ${Number(this.props.ActiveCoin.balance.transparent)} ${this.props.ActiveCoin.coin}`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              valid = false;
            }
          }
        }
      }
      else if (!this.state.shieldCoinbase && (this.state.addressType === 'private' && this.state.privateAddrList)) {
        if (this.state.sendFrom) {
          if (this.state.sendTo && this.state.sendTo.length > 34) {
            if (Number(Number(this.state.amount) + 0.0001) > Number(this.state.sendFromAmount)) {
              Store.dispatch(
                triggerToaster(
                  `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE_IN_ADDR')} ${Number(this.state.sendFromAmount)} ${this.props.ActiveCoin.coin}`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              valid = false;
            }
          }
          else if (this.state.sendTo) {
            if (Number(Number(this.state.amount) + (this.state.subtractFee ? 0 : 0.0001)) > (Number(this.props.ActiveCoin.balance.total) - Number(this.props.ActiveCoin.balance.transparent) - (this.props.ActiveCoin.balance.immature ? Number(this.props.ActiveCoin.balance.immature) : 0))){
              Store.dispatch(
                triggerToaster(
                  `${translate('SEND.INSUFFICIENT_FUNDS')} ${translate('SEND.MAX_AVAIL_BALANCE_IN_ADDR')} ${Number(this.state.sendFromAmount)} ${this.props.ActiveCoin.coin}`,
                  translate('TOASTR.WALLET_NOTIFICATION'),
                  'error'
                )
              );
              valid = false;
            }
          }
        }
      }

      
      
      if (this.state.sendTo.length > 34 &&
        this.state.sendTo.substring(0, 2) === 'zc' &&
        (!this.state.sendFrom && !this.state.privateAddrList) && 
        !this.state.shieldCoinbase) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.SELECT_SOURCE_ADDRESS'),
          translate('TOASTR.WALLET_NOTIFICATION'),
          'error'
        )
      );
      valid = false;
    }

    if (!this.state.sendFrom && this.state.privateAddrList) {
      Store.dispatch(
        triggerToaster(
          translate('SEND.SELECT_SOURCE_ADDRESS'),
          translate('TOASTR.WALLET_NOTIFICATION'),
          'error'
        )
      );
      valid = false;
    }
    

    //Error checking for VRSC because it bypasses electrum
    if (this.props.ActiveCoin.coin === 'VRSC'){
      if(!this.state.sendTo){
        Store.dispatch(
          triggerToaster(
            translate('SEND.SELECT_TO_ADDRESS'),
            translate('TOASTR.WALLET_NOTIFICATION'),
            'error'
          )
        );
        valid = false;
      }

      if(this.state.shieldCoinbase && (!(this.state.sendTo.length > 34 && this.state.sendTo.substring(0, 2) === 'zc'))){
        Store.dispatch(
          triggerToaster(
            translate('SEND.MUST_BE_Z_ADDR'),
            translate('TOASTR.WALLET_NOTIFICATION'),
            'error'
          )
        );
        valid = false;
      }

    }
  }
  return valid;
}

  isTransparentTx() {
    if (((this.state.sendFrom && this.state.sendFrom.length === 34) || (!this.state.sendFrom && !this.state.privateAddrList)) &&
        (this.state.sendTo && this.state.sendTo.length === 34)) {
      return true;
    }

    return false;
  }

  isFullySynced() {
    if (this.props.ActiveCoin.progress &&
        this.props.ActiveCoin.progress.longestchain &&
        this.props.ActiveCoin.progress.blocks &&
        this.props.ActiveCoin.progress.longestchain > 0 &&
        this.props.ActiveCoin.progress.blocks > 0 &&
        Number(this.props.ActiveCoin.progress.blocks) * 100 / Number(this.props.ActiveCoin.progress.longestchain) === 100) {
      return true;
    }
  }

  onSliderChange(value) {
    this.setState({
      btcFeesSize: this.state.btcFees.electrum[value],
      btcFeesAdvancedStep: value,
    });
  }

  setMemoHex(value) {
    this.setState({
      memoHEX: value,
    });
  }

  onSliderChangeTime(value) {
    this.setState({
      btcFeesSize: _feeLookup[value] === 'advanced' ? this.state.btcFees.electrum[this.state.btcFeesAdvancedStep] : this.state.btcFees.recommended[_feeLookup[value]],
      btcFeesType: _feeLookup[value] === 'advanced' ? 'advanced' : null,
      btcFeesTimeBasedStep: value,
    });
  }

  renderBTCFees() {
    if (this.props.ActiveCoin.mode === 'spv' &&
        this.props.ActiveCoin.coin === 'BTC' &&
        !this.state.btcFees.lastUpdated) {
      return (<div className="col-lg-6 form-group form-material">{ translate('SEND.FETCHING_BTC_FEES') }...</div>);
    } else if (
      this.props.ActiveCoin.mode === 'spv' &&
      this.props.ActiveCoin.coin === 'BTC' &&
      this.state.btcFees.lastUpdated
    ) {
      const _min = 0;
      const _max = this.state.btcFees.electrum.length - 1;
      const _confTime = [
        translate('SEND.CONF_TIME_LESS_THAN_30_MIN'),
        translate('SEND.CONF_TIME_WITHIN_3O_MIN'),
        translate('SEND.CONF_TIME_WITHIN_60_MIN'),
      ];
      const _minTimeBased = 0;
      const _maxTimeBased = 3;

      /*let _marks = {};

      for (let i = _min; i < _max; i++) {
        _marks[i] = i + 1;
      }*/

      return (
        <div className="col-lg-12 form-group form-material">
          <div>
            <div>
              { translate('SEND.FEE') }
              <span>
                <i
                  className="icon fa-question-circle settings-help"
                  data-html={ true }
                  data-tip={ this.state.btcFeesType === 'advanced' ? translate('SEND.BTC_FEES_DESC_P1') + '.<br />' + translate('SEND.BTC_FEES_DESC_P2') : translate('SEND.BTC_FEES_DESC_P3') + '<br />' + translate('SEND.BTC_FEES_DESC_P4') }></i>
                <ReactTooltip
                  effect="solid"
                  className="text-left" />
              </span>
            </div>
            <div className="send-target-block">
              { this.state.btcFeesType !== 'advanced' &&
                <span>{ translate('SEND.CONF_TIME') } <strong>{ _confTime[this.state.btcFeesTimeBasedStep] }</strong></span>
              }
              { this.state.btcFeesType === 'advanced' &&
                <span>{ translate('SEND.ADVANCED_SELECTION') }</span>
              }
            </div>
            <Slider
              className="send-slider-time-based margin-bottom-70"
              onChange={ this.onSliderChangeTime }
              defaultValue={ this.state.btcFeesTimeBasedStep }
              min={ _minTimeBased }
              max={ _maxTimeBased }
              dots={ true }
              marks={{
                0: 'fast',
                1: 'average',
                2: 'slow',
                3: 'advanced'
              }} />
            { this.state.btcFeesType === 'advanced' &&
              <div className="margin-bottom-20">
                <div className="send-target-block">
                  { translate('SEND.ESTIMATED_TO_BE_INCLUDED_P1') } <strong>{this.state.btcFeesAdvancedStep + 1} {(this.state.btcFeesAdvancedStep + 1) > 1 ? translate('SEND.ESTIMATED_TO_BE_INCLUDED_P2') : translate('SEND.ESTIMATED_TO_BE_INCLUDED_P3') }</strong>
                </div>
                <Slider
                  onChange={ this.onSliderChange }
                  defaultValue={ this.state.btcFeesAdvancedStep }
                  min={ _min }
                  max={ _max } />
              </div>
            }
            { this.state.btcFeesSize > 0 &&
              <div className="margin-top-10">
                { translate('SEND.FEE_PER_BYTE') } {this.state.btcFeesSize}, { translate('SEND.PER_KB') } { this.state.btcFeesSize * 1024 }
              </div>
            }
          </div>
        </div>
      );
    }
  }

  render() {
    if (this.props &&
        this.props.ActiveCoin &&
        (this.props.ActiveCoin.activeSection === 'send' || this.props.activeSection === 'send')) {
      return SendRender.call(this);
    }

    return null;
  }
}

const mapStateToProps = (state, props) => {
  let _mappedProps = {
    ActiveCoin: {
      addresses: state.ActiveCoin.addresses,
      coin: state.ActiveCoin.coin,
      mode: state.ActiveCoin.mode,
      opids: state.ActiveCoin.opids,
      balance: state.ActiveCoin.balance,
      activeSection: state.ActiveCoin.activeSection,
      lastSendToResponse: state.ActiveCoin.lastSendToResponse,
      progress: state.ActiveCoin.progress,
    },
    Dashboard: state.Dashboard,
  };

  if (props &&
      props.activeSection &&
      props.renderFormOnly) {
    _mappedProps.ActiveCoin.activeSection = props.activeSection;
    _mappedProps.renderFormOnly = props.renderFormOnly;
  }

  return _mappedProps;
};

export default connect(mapStateToProps)(SendCoin);
