import React from 'react';
import translate from '../../../translate/translate';
import QRModal from '../qrModal/qrModal';
import ReactTooltip from 'react-tooltip';
import { formatValue } from 'agama-wallet-lib/src/utils';
import { explorerList } from 'agama-wallet-lib/src/coin-helpers';
import Config from '../../../config';
import mainWindow from '../../../util/mainWindow';

const kvCoins = {
  'KV': true,
  'BEER': true,
  'PIZZA': true,
};

export const AddressListRender = function() {
  return (
    <div>
    { this.props.ActiveCoin.mode === 'native' &&
    <div className="toggle-box padding-top-0">
      <span className="pointer">
       <label className="switch">
         <input
            type="checkbox"
            checked={ this.state.privateAddrList } />
            <div
            className="slider"
            onClick={ this.togglePrivateAddrList }></div>
        </label>
        <div
          className="toggle-label"
          onClick={ this.togglePrivateAddrList }>
          { translate('INDEX.TOGGLE_Z_ADDRESS_LIST') }
          <i
            className="icon fa-question-circle settings-help"
            data-tip={ translate('INDEX.TOGGLE_Z_ADDRESS_LIST_DESC') }></i>
          <ReactTooltip
            effect="solid"
            className="text-left" />
        </div>
      </span>
    </div>
    }
    <div className= { !this.state.privateAddrList && (this.props.ActiveCoin.coin === 'VRSC' || this.props.ActiveCoin.coin === 'VERUSTEST') && this.props.ActiveCoin.mode !== 'spv' ? "toggle-box padding-top-0" : 'hide'}>
      <span className="pointer">
       <label className="switch">
         <input
            type="checkbox"
            checked={ this.state.shieldCoinbase } />
            <div
            className="slider"
            onClick={ this.toggleShieldCoinbase }></div>
        </label>
        <div
          className="toggle-label"
          onClick={ this.toggleShieldCoinbase }>
          { translate('INDEX.TOGGLE_SHIELD_COINBASE') }
          <i
            className="icon fa-question-circle settings-help"
            data-tip={ translate('INDEX.TOGGLE_SHIELD_COINBASE_DESC') }></i>
          <ReactTooltip
            effect="solid"
            className="text-left" />
        </div>
      </span>
    </div>

    <div className={ `btn-group bootstrap-select form-control form-material showkmdwalletaddrs show-tick ${(this.state.addressSelectorOpen ? 'open' : '')}` }>
      <button
        type="button"
        className={ 'btn dropdown-toggle btn-info' + (this.props.ActiveCoin.mode === 'spv' ? ' disabled' : '') }
        onClick={ this.openDropMenu }>
        <span className="filter-option pull-left">{ this.renderSelectorCurrentLabel() }&nbsp;</span>
        <span className="bs-caret">
          <span className="caret"></span>
        </span>
      </button>
      <div className="dropdown-menu open">
        <ul className="dropdown-menu inner">
          <li
            className="selected"
            onClick={ () => this.updateAddressSelection(null, 'public', null) }>
            <a>
              <span className="text">
                { this.props.ActiveCoin.mode === 'spv' ? `[ ${this.props.ActiveCoin.balance.balance} ${this.props.ActiveCoin.coin} ] ${this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub}` 
                : this.state.privateAddrList ? translate('INDEX.Z_ADDR_UNSELECTED') : (this.state.shieldCoinbase ? translate('INDEX.UNSHIELDED_FUNDS') : translate('INDEX.T_FUNDS')) }
              </span>
              <span
                className="glyphicon glyphicon-ok check-mark pull-right"
                style={{ display: this.state.sendFrom === null ? 'inline-block' : 'none' }}></span>
            </a>
          </li>
          { this.state.shieldCoinbase ? null : (this.state.privateAddrList ? this.renderAddressByType('private') : this.renderAddressByType('public')) }
        </ul>
      </div>
    </div>
    </div>
  );
};

export const _SendFormRender = function() {
  return (
    <div className="extcoin-send-form">
      { this.state.renderAddressDropdown &&
        <div className="row">
          <div className="col-xlg-12 form-group form-material">
            <label className="control-label padding-bottom-10">
              { translate('INDEX.SEND_FROM') }
            </label>
            { this.renderAddressList() }
          </div>
        </div>
      }
      { !this.state.kvSend &&
        <div className="row">
          <div className="col-xlg-12 form-group form-material">
            { this.props.ActiveCoin.mode === 'spv' &&
              <button
                type="button"
                className="btn btn-default btn-send-self"
                onClick={ this.setSendToSelf }>
                { translate('SEND.SELF') }
              </button>
            }
            <label
              className="control-label"
              htmlFor="kmdWalletSendTo">{ translate('INDEX.SEND_TO') }</label>
            <input
            type="text"
            className="form-control"
            name="sendTo"
            onChange={ this.updateInput }
            value={ this.state.sendTo }
            id="kmdWalletSendTo"
            placeholder={ this.props.ActiveCoin.mode === 'spv' ? translate('SEND.ENTER_ADDRESS') : this.state.shieldCoinbase ? translate('SEND.ENTER_Z_ADDR') : translate('SEND.ENTER_T_OR_Z_ADDR') }
            autoComplete="off"
            required />
        </div>
        <div className={ this.state.shieldCoinbase ? 'hide' : "col-lg-12 form-group form-material" }>
          { 
              <button
                type="button"
                className="btn btn-default btn-send-self"
                onClick={ this.setSendAmountAll }>
                { translate('SEND.ALL') }
              </button>
            }
            <label
              className="control-label"
              htmlFor="kmdWalletAmount">
              { translate('INDEX.AMOUNT') }
            </label>
            <input
              type="text"
              className="form-control"
              name="amount"
              value={ this.state.amount !== 0 ? this.state.amount : '' }
              onChange={ this.updateInput }
              id="kmdWalletAmount"
              placeholder="Enter an amount"
              autoComplete="off" />
          </div>
          { (this.props.ActiveCoin.coin === 'VRSC' || this.props.ActiveCoin.coin === 'VERUSTEST') && (this.state.sendTo.length === 95 || this.state.sendTo.length === 78) && !this.state.shieldCoinbase &&
            <div className="col-lg-12 form-group form-material">
              <label
                className="control-label"
                htmlFor="kmdWalletMemo">
                { translate('INDEX.MESSAGE') }
              </label>
              <input
                type="text"
                className="form-control"
                name="memo"
                value={ this.state.memo !== '' ? this.state.memo : '' }
                onChange={ this.updateInput }
                id="kmdWalletMemo"
                placeholder="Attach a message to your transaction"
                autoComplete="off" />
            </div>
            }
          <div className={ 'col-lg-6 form-group form-material' + (this.isTransparentTx() && this.props.ActiveCoin.mode === 'native' ? '' : ' hide') }>
            { this.state.sendTo.length <= 34 && !this.state.shieldCoinbase && (this.props.ActiveCoin.coin !== 'VRSC' && this.props.ActiveCoin.coin !== 'VERUSTEST') &&
              <span className="pointer">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={ this.state.subtractFee } />
                  <div
                    className="slider"
                    onClick={ () => this.toggleSubtractFee() }></div>
                </label>
                <div
                  className="toggle-label"
                  onClick={ () => this.toggleSubtractFee() }>
                    { translate('DASHBOARD.SUBTRACT_FEE') }
                </div>
              </span>
            }
          </div>
          { this.renderBTCFees() }
          <div className="col-lg-6 form-group form-material hide">
            <label
              className="control-label"
              htmlFor="kmdWalletFee">
              { translate('INDEX.FEE') }
            </label>
            <input
              type="text"
              className="form-control"
              name="fee"
              onChange={ this.updateInput }
              id="kmdWalletFee"
              placeholder="Enter an amount"
              value={ this.state.fee !== 0 ? this.state.fee : '' }
              autoComplete="off" />
          </div>
          <div className="col-lg-12 hide">
            <span>
              <strong>{ translate('INDEX.TOTAL') }:</strong>&nbsp;
              { this.state.amount } - { this.state.fee }/kb = { Number(this.state.amount) - Number(this.state.fee) }&nbsp;
              { this.props.ActiveCoin.coin }
            </span>
          </div>
          { (!this.isFullySynced() || !navigator.onLine) &&
            this.props.ActiveCoin &&
            this.props.ActiveCoin.mode === 'native' &&
            <div className="col-lg-12 padding-top-20 padding-bottom-20 send-coin-sync-warning">
              <i className="icon fa-warning color-warning margin-right-5"></i>&nbsp;
              <span className="desc">{ translate('SEND.SEND_NATIVE_SYNC_WARNING') }</span>
            </div>
          }
          <div className="col-lg-12">
            <button
              type="button"
              className="btn btn-primary waves-effect waves-light pull-right"
              onClick={ this.props.renderFormOnly ? this.handleSubmit : () => this.changeSendCoinStep(1) }
              disabled={
                (!this.state.sendTo ||
                !this.state.amount) &&
                !this.state.shieldCoinbase
              }>
              { this.state.shieldCoinbase ? translate('INDEX.SHIELD_ADDR') : translate('INDEX.SEND') } { this.state.shieldCoinbase ? '' : this.state.amount } { this.state.shieldCoinbase ? '' : this.props.ActiveCoin.coin }
            </button>
          </div>
        </div>
      }
      { this.state.kvSend &&
        <div className="row">
          {/*<button
            type="button"
            className="btn btn-default btn-send-self"
            onClick={ this.loadTestData }>
            Load test data
          </button>*/}
          <div className="col-xlg-12 form-group form-material">
            <label
              className="control-label"
              htmlFor="kvSendTag">{ translate('KV.TAG') }</label>
            <input
              type="text"
              className="form-control"
              name="kvSendTag"
              onChange={ this.updateInput }
              value={ this.state.kvSendTag }
              id="kvSendTag"
              placeholder={ translate('KV.TITLE') }
              autoComplete="off"
              maxLength="64"
              required />
          </div>
          <div className="col-xlg-12 form-group form-material">
            <label
              className="control-label"
              htmlFor="kvSendTitle">{ translate('KV.TITLE') }</label>
            <input
              type="text"
              className="form-control"
              name="kvSendTitle"
              onChange={ this.updateInput }
              value={ this.state.kvSendTitle }
              id="kvSendTitle"
              placeholder={ translate('KV.ENTER_A_TITLE') }
              autoComplete="off"
              maxLength="128"
              required />
          </div>
          <div className="col-xlg-12 form-group form-material">
            <label
              className="control-label margin-bottom-10"
              htmlFor="kvSendContent">{ translate('KV.CONTENT') }</label>
            <textarea
              className="full-width height-400"
              rows="20"
              cols="80"
              id="kvSendContent"
              name="kvSendContent"
              onChange={ this.updateInput }
              value={ this.state.kvSendContent }></textarea>
          </div>
          <div className="col-xlg-12 form-group form-material">
            { (4096 - this.state.kvSendContent.length) > 0 &&
              <span>{ translate('KV.CHARS_LEFT') }:  { 4096 - this.state.kvSendContent.length }</span>
            }
            { (4096 - this.state.kvSendContent.length) < 0 &&
              <span>{ translate('KV.KV_ERR_TOO_LONG') }</span>
            }
          </div>
          <div className="col-lg-12">
            <button
              type="button"
              className="btn btn-primary waves-effect waves-light pull-right"
              onClick={ this.props.renderFormOnly ? this.handleSubmit : () => this.changeSendCoinStep(1) }
              disabled={
                !this.state.kvSendContent
              }>
              { translate('INDEX.SEND') } KV { this.props.ActiveCoin.coin }
            </button>
          </div>
        </div>
      }
    </div>
  );
}

export const SendRender = function() {
  if (this.props.renderFormOnly) {
    return (
      <div>{ this.SendFormRender() }</div>
    );
  } else {
    return (
      <div className="col-sm-12 padding-top-10 coin-send-form">
        <div className="col-xlg-12 col-md-12 col-sm-12 col-xs-12">
          <div className="steps row margin-top-10">
            <div className={ 'step col-md-4' + (this.state.currentStep === 0 ? ' current' : '') }>
              <span className="step-number">1</span>
              <div className="step-desc">
                <span className="step-title">{ translate('INDEX.FILL_SEND_FORM') }</span>
                <p>{ translate('INDEX.FILL_SEND_DETAILS') }</p>
              </div>
            </div>
            <div className={ 'step col-md-4' + (this.state.currentStep === 1 ? ' current' : '') }>
              <span className="step-number">2</span>
              <div className="step-desc">
                <span className="step-title">{ translate('INDEX.CONFIRMING') }</span>
                <p>{ translate('INDEX.CONFIRM_DETAILS') }</p>
              </div>
            </div>
            <div className={ 'step col-md-4' + (this.state.currentStep === 2 ? ' current' : '') }>
              <span className="step-number">3</span>
              <div className="step-desc">
                <span className="step-title">{ translate('INDEX.PROCESSING_TX') }</span>
                <p>{ translate('INDEX.PROCESSING_DETAILS') }</p>
              </div>
            </div>
          </div>
        </div>

        <div className={ 'col-xlg-12 col-md-12 col-sm-12 col-xs-12' + (this.state.currentStep === 0 ? '' : ' hide') }>
          <div className="panel">
            <div className="panel-heading">
              <h3 className="panel-title">
                { translate('INDEX.SEND') } { this.props.ActiveCoin.coin }
              </h3>
              { this.props.ActiveCoin.mode === 'spv' &&
                Config.experimentalFeatures &&
                kvCoins[this.props.ActiveCoin.coin] &&
                <div className="kv-select-block">
                  <button
                    type="button"
                    className={ 'btn btn-default' + (this.state.kvSend ? ' active' : '') }
                    onClick={ this.toggleKvSend }>
                    { translate('KV.SEND_KV') }
                  </button>
                  <button
                    type="button"
                    className={ 'btn btn-default margin-left-10' + (!this.state.kvSend ? ' active' : '') }
                    onClick={ this.toggleKvSend }>
                    { translate('KV.SEND_TX') }
                  </button>
                </div>
              }
            </div>
            <div className="qr-modal-send-block">
              <QRModal
                mode="scan"
                setRecieverFromScan={ this.setRecieverFromScan } />
            </div>
            <div className="panel-body container-fluid">
            { this.SendFormRender() }
            </div>
          </div>
        </div>

        <div className={ 'col-xlg-12 col-md-12 col-sm-12 col-xs-12' + (this.state.currentStep === 1 ? '' : ' hide') }>
          <div className="panel">
            <div className="panel-body">
              <div className="row">
                <div className="col-xs-12">
                  <strong>{ translate('INDEX.TO') }</strong>
                </div>
                <div className={this.state.shieldCoinbase ? "col-lg-6 col-sm-6 col-xs-12 overflow" : "col-lg-6 col-sm-6 col-xs-12 overflow-hidden"}>{ this.state.sendTo }</div>
                <div className="col-lg-6 col-sm-6 col-xs-6">
                  { this.state.shieldCoinbase ? '' : this.state.amount } { this.state.shieldCoinbase ? '' : this.props.ActiveCoin.coin }
                </div>
                <div className={ this.state.subtractFee ? 'col-lg-6 col-sm-6 col-xs-12 padding-top-10 bold' : 'hide' }>
                  { translate('DASHBOARD.SUBTRACT_FEE') }
                </div>
              </div>

              { this.state.sendFrom &&
                <div className="row padding-top-20">
                  <div className="col-xs-12">
                    <strong>{ translate('INDEX.FROM') }</strong>
                  </div>
                  <div className="col-lg-6 col-sm-6 col-xs-12 overflow-hidden">{ this.state.sendFrom }</div>
                  <div className="col-lg-6 col-sm-6 col-xs-6 confirm-currency-send-container">
                    { this.state.shieldCoinbase ? '' : Number(this.state.amount) } { this.state.shieldCoinbase ? '' : this.props.ActiveCoin.coin }
                  </div>
                </div>
              }
              { this.state.spvPreflightRes &&
                <div className="row padding-top-20">
                  <div className="col-xs-12">
                    <strong>{ translate('SEND.FEE') }</strong>
                  </div>
                  <div className="col-lg-12 col-sm-12 col-xs-12">
                    { formatValue(this.state.spvPreflightRes.fee * 0.00000001) } ({ this.state.spvPreflightRes.fee } { translate('SEND.SATS') })
                  </div>
                </div>
              }
              { this.state.spvPreflightRes &&
                <div className="row padding-top-20">
                  { this.state.spvPreflightRes.change === 0 &&
                    <div className="col-lg-12 col-sm-12 col-xs-12">
                      <strong>{ translate('SEND.ADJUSTED_AMOUNT') }</strong>
                      <span>
                        <i
                          className="icon fa-question-circle settings-help send-btc"
                          data-tip={ translate('SEND.MAX_AVAIL_AMOUNT_TO_SPEND') }></i>
                        <ReactTooltip
                          effect="solid"
                          className="text-left" />
                      </span>
                      &nbsp;{ formatValue((this.state.spvPreflightRes.value * 0.00000001) - (this.state.spvPreflightRes.fee * 0.00000001)) }
                    </div>
                  }
                  { this.state.spvPreflightRes.estimatedFee < 0 &&
                    <div className="col-lg-12 col-sm-12 col-xs-12 padding-bottom-20">
                      <strong>{ translate('SEND.KMD_INTEREST') }</strong>&nbsp;
                      { Math.abs(formatValue(this.state.spvPreflightRes.estimatedFee * 0.00000001)) } { translate('SEND.TO') } { this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub }
                    </div>
                  }
                  { this.state.spvPreflightRes.change > 0 &&
                    <div className="col-lg-12 col-sm-12 col-xs-12">
                      <strong>{ translate('SEND.TOTAL_AMOUNT_DESC') }</strong>&nbsp;
                      { Number((((this.state.spvPreflightRes.fee) * 0.00000001) + ((this.state.spvPreflightRes.value) * 0.00000001)).toFixed(8)) }
                    </div>
                  }
                </div>
              }
              { Config.requirePinToConfirmTx &&
                mainWindow.pinAccess &&
                <div className="row padding-top-30">
                  <div className="col-lg-12 col-sm-12 col-xs-12 form-group form-material">
                    <label
                      className="control-label bold"
                      htmlFor="pinNumber">
                      { translate('SEND.PIN_NUMBER') }
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="pin"
                      ref="pin"
                      value={ this.state.pin }
                      onChange={ this.updateInput }
                      id="pinNumber"
                      placeholder={ translate('SEND.ENTER_YOUR_PIN') }
                      autoComplete="off" />
                  </div>
                </div>
              }
              { this.state.noUtxo &&
                <div className="padding-top-20">{ translate('SEND.NO_VALID_UTXO_ERR') }</div>
              }
              { this.state.spvPreflightSendInProgress &&
                <div className="padding-top-20">{ translate('SEND.SPV_VERIFYING') }...</div>
              }
              { this.state.spvVerificationWarning &&
                <div className="padding-top-20 fs-15">
                  <strong className="color-warning">{ translate('SEND.WARNING') }:</strong>&nbsp;
                  { translate('SEND.WARNING_SPV_P1') }<br />
                  { translate('SEND.WARNING_SPV_P2') }
                </div>
              }
              <div className="widget-body-footer">
                <a
                  className="btn btn-default waves-effect waves-light"
                  onClick={ () => this.changeSendCoinStep(0, true) }>{ translate('INDEX.BACK') }</a>
                <div className="widget-actions pull-right">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={ Config.requirePinToConfirmTx && mainWindow.pinAccess ? this.verifyPin : () => this.changeSendCoinStep(2) }>
                    { translate('INDEX.CONFIRM') }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={ 'col-xlg-12 col-md-12 col-sm-12 col-xs-12' + (this.state.currentStep === 2 ? '' : ' hide') }>
          <div className="panel">
            <div className="panel-heading">
              <h4 className="panel-title">
                { translate('INDEX.TRANSACTION_RESULT') }
              </h4>
              <div className="overflow-x">
                { this.state.lastSendToResponse &&
                  !this.state.lastSendToResponse.msg &&
                  <table className="table table-hover table-striped">
                    <thead>
                      <tr>
                        <th className="padding-left-30">{ translate('INDEX.KEY') }</th>
                        <th className="padding-left-30">{ translate('INDEX.INFO') }</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="padding-left-30">
                        { translate('SEND.RESULT') }
                        </td>
                        <td className="padding-left-30">
                          <span className="label label-success">{ translate('SEND.SUCCESS_SM') }</span>
                        </td>
                      </tr>
                      { ((this.state.sendFrom && this.props.ActiveCoin.mode === 'native') ||
                        this.props.ActiveCoin.mode === 'spv') &&
                        <tr>
                          <td className="padding-left-30">
                          { translate('INDEX.SEND_FROM') }
                          </td>
                          <td className="padding-left-30">
                            { this.props.ActiveCoin.mode === 'spv' ? this.props.Dashboard.electrumCoins[this.props.ActiveCoin.coin].pub : this.state.sendFrom }
                          </td>
                        </tr>
                      }
                      <tr>
                        <td className="padding-left-30">
                        { translate('INDEX.SEND_TO') }
                        </td>
                        <td className="padding-left-30">
                          { this.state.sendTo }
                        </td>
                      </tr>
                      {!this.state.shieldCoinbase && 
                      <tr>
                        <td className="padding-left-30">
                        { translate('INDEX.AMOUNT') }
                        </td>
                        <td className="padding-left-30">
                          { this.state.amount }
                        </td>
                      </tr>
                      }
                      <tr>
                        <td className="padding-left-30">{ translate('SEND.TRANSACTION_ID') }</td>
                        <td className="padding-left-30">
                          { this.props.ActiveCoin.mode === 'spv' ? (this.state.lastSendToResponse && this.state.lastSendToResponse.txid ? this.state.lastSendToResponse.txid : '') : this.state.lastSendToResponse }
                          { ((this.props.ActiveCoin.mode === 'spv' &&
                            this.state.lastSendToResponse &&
                            this.state.lastSendToResponse.txid) ||
                            (this.props.ActiveCoin.mode === 'native' && this.state.lastSendToResponse && this.state.lastSendToResponse.length === 64)) &&
                            <button
                              className="btn btn-default btn-xs clipboard-edexaddr margin-left-10"
                              title={ translate('INDEX.COPY_TO_CLIPBOARD') }
                              onClick={ () => this.copyTXID(this.props.ActiveCoin.mode === 'spv' ? (this.state.lastSendToResponse && this.state.lastSendToResponse.txid ? this.state.lastSendToResponse.txid : '') : this.state.lastSendToResponse) }>
                              <i className="icon wb-copy"></i> { translate('INDEX.COPY') }
                            </button>
                          }
                          { ((this.props.ActiveCoin.mode === 'spv' &&
                            this.state.lastSendToResponse &&
                            this.state.lastSendToResponse.txid) ||
                            (this.props.ActiveCoin.mode === 'native' && this.state.lastSendToResponse && this.state.lastSendToResponse.length === 64)) &&
                            explorerList[this.props.ActiveCoin.coin] &&
                            <div className="margin-top-10">
                              <button
                                type="button"
                                className="btn btn-sm white btn-dark waves-effect waves-light pull-left"
                                onClick={ () => this.openExplorerWindow(this.props.ActiveCoin.mode === 'spv' ? (this.state.lastSendToResponse && this.state.lastSendToResponse.txid ? this.state.lastSendToResponse.txid : '') : this.state.lastSendToResponse) }>
                                <i className="icon fa-external-link"></i> { translate('INDEX.OPEN_TRANSACTION_IN_EPLORER', this.props.ActiveCoin.coin) }
                              </button>
                            </div>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                }
                { !this.state.lastSendToResponse &&
                  <div className="padding-left-30 padding-top-10">{ translate('SEND.PROCESSING_TX') }...</div>
                }
                { this.state.lastSendToResponse &&
                  this.state.lastSendToResponse.msg &&
                  this.state.lastSendToResponse.msg === 'error' &&
                  <div className="padding-left-30 padding-top-10">
                    <div>
                      <strong className="text-capitalize">{ translate('API.ERROR_SM') }</strong>
                    </div>
                    { (this.state.lastSendToResponse.result.toLowerCase().indexOf('decode error') > -1) &&
                      <div>
                        { translate('SEND.YOUR_TXHISTORY_CONTAINS_ZTX_P1') }<br />
                        { translate('SEND.YOUR_TXHISTORY_CONTAINS_ZTX_P2') }
                      </div>
                    }
                    { this.state.lastSendToResponse.result.toLowerCase().indexOf('decode error') === -1 &&
                      <div>{ this.state.lastSendToResponse.result }</div>
                    }
                    { this.props.ActiveCoin.mode === 'spv' &&
                      this.state.lastSendToResponse.raw &&
                      this.state.lastSendToResponse.raw.txid &&
                      <div>{ this.state.lastSendToResponse.raw.txid.replace(/\[.*\]/, '') }</div>
                    }
                    { this.state.lastSendToResponse.raw &&
                      this.state.lastSendToResponse.raw.txid &&
                      this.state.lastSendToResponse.raw.txid.indexOf('bad-txns-inputs-spent') > -1 &&
                      <div className="margin-top-10">
                        { translate('SEND.BAD_TXN_SPENT_ERR1') }
                        <ul>
                          <li>{ translate('SEND.BAD_TXN_SPENT_ERR2') }</li>
                          <li>{ translate('SEND.BAD_TXN_SPENT_ERR3') }</li>
                          <li>{ translate('SEND.BAD_TXN_SPENT_ERR4') }</li>
                        </ul>
                      </div>
                    }
                  </div>
                }
              </div>
              <div className="widget-body-footer">
                <div className="widget-actions margin-bottom-15 margin-right-15">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={ () => this.changeSendCoinStep(0) }>
                    { translate('INDEX.MAKE_ANOTHER_TX') }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        { this.renderOPIDListCheck() &&
          this.props.ActiveCoin.mode === 'native' &&
          <div className="col-xs-12">
            <div className="row">
              <div className="panel nav-tabs-horizontal">
                <div>
                  <div className="col-xlg-12 col-lg-12 col-sm-12 col-xs-12">
                    <div className="panel">
                      <header className="panel-heading">
                        <h3 className="panel-title">
                          { translate('INDEX.OPERATIONS_STATUSES') }
                        </h3>
                      </header>
                      <div className="panel-body">
                        <table
                          className="table table-hover dataTable table-striped"
                          width="100%">
                          <thead>
                            <tr>
                              <th>{ translate('INDEX.STATUS') }</th>
                              <th>ID</th>
                              <th>{ translate('INDEX.TIME') }</th>
                              <th>{ translate('INDEX.RESULT') }</th>
                            </tr>
                          </thead>
                          <tbody>
                            { this.renderOPIDList() }
                          </tbody>
                          <tfoot>
                            <tr>
                              <th>{ translate('INDEX.STATUS') }</th>
                              <th>ID</th>
                              <th>{ translate('INDEX.TIME') }</th>
                              <th>{ translate('INDEX.RESULT') }</th>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
};