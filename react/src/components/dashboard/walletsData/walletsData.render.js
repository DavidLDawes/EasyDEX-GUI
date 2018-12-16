import React from 'react';
import ReactTooltip from 'react-tooltip';
import translate from '../../../translate/translate';
import ReactTable from 'react-table';
import TablePaginationRenderer from './pagination';
import { formatValue } from 'agama-wallet-lib/src/utils';
import Config from '../../../config';
import Spinner from '../spinner/spinner';
import MiningButton from './walletsData.miningButton';

const kvCoins = {
  'KV': true,
  'BEER': true,
  'PIZZA': true,
};

export const TxConfsRender = function(confs) {
  if (Number(confs) > -1) {
    return (
      <span>{ confs }</span>
    );
  } else {
    return (
      <span>
        <i
          className="icon fa-warning color-warning margin-right-5"
          data-tip={ translate('DASHBOARD.FAILED_TX_INFO') }></i>
        <ReactTooltip
          effect="solid"
          className="text-left" />
      </span>
    );
  }
}

export const AddressTypeRender = function(tx) {
  return (
    <span>
      <span className={!tx.memo ? "label label-default" : "label label-dark"}>
        <i className={ 'icon fa-eye' + (!tx.memo ? '' : '-slash')}></i>&nbsp;
        { !tx.memo ? translate('IAPI.PUBLIC_SM') : translate('IAPI.PRIVATE_SM') }
      </span>
    </span>
  );
};

export const TransactionDetailRender = function(transactionIndex) {
  return (
    <button
      type="button"
      className="btn btn-xs white btn-info waves-effect waves-light btn-kmdtxid"
      onClick={ () => this.toggleTxInfoModal(!this.props.ActiveCoin.showTransactionInfo, transactionIndex) }>
      <i className="icon fa-search"></i>
    </button>
  );
};

export const AddressRender = function(tx) {
  if (!tx.address) {
    return (
      <span>
        <span className="label label-dark">
          { translate('DASHBOARD.ZADDR_NOT_LISTED') }
        </span>
      </span>
    );
  }

  return (<span className="blur">{ tx.address }</span>);
};

export const AddressItemRender = function(address, type, amount, coin) {
  return (
    <li
      key={ address }
      className={ address === this.state.currentAddress ? 'selected' : '' }>
      <a onClick={ () => this.updateAddressSelection(address) }>
        <i className={ 'icon fa-eye' + (type === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
        <span className="text">[ { amount } { coin } ]  { address }</span>
        <span className="glyphicon glyphicon-ok check-mark"></span>
      </a>
    </li>
  );
};

export const AddressListRender = function() {
  const isMultiPublicAddress = this.props.ActiveCoin.addresses && this.props.ActiveCoin.addresses.public && this.props.ActiveCoin.addresses.public.length > 1;
  const isMultiPrivateAddress = this.props.ActiveCoin.addresses && this.props.ActiveCoin.addresses.private && this.props.ActiveCoin.addresses.private.length > 1;

  if (isMultiPublicAddress ||
      isMultiPrivateAddress) {
    return (
      <div className={ `btn-group bootstrap-select form-control form-material showkmdwalletaddrs show-tick margin-bottom-10${(this.state.addressSelectorOpen ? ' open ' : '')}` }>
        <button
          type="button"
          className="btn dropdown-toggle btn-info"
          data-tip={ `${translate('KMD_NATIVE.SELECT_ADDRESS')}` }
          onClick={ this.openDropMenu }>
          <span className="filter-option pull-left">{ this.renderSelectorCurrentLabel() } </span>&nbsp;
          <span className="bs-caret">
            <span className="caret"></span>
          </span>
        </button>
        <ReactTooltip
          effect="solid"
          className="text-left" />
        <div className="dropdown-menu open">
          <ul className="dropdown-menu inner">
            <li className="no--hover">
              <a><span className="text">{ translate('KMD_NATIVE.SELECT_ADDRESS') }</span></a>
            </li>
            <li className={ !this.state.currentAddress ? 'selected' : '' }>
              <a onClick={ () => this.updateAddressSelection('') }>
                <span className="text">{ translate('INDEX.ALL') }</span>
                <span className="glyphicon glyphicon-ok check-mark"></span>
              </a>
            </li>
            { this.renderAddressByType('public') }
          </ul>
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export const TxTypeRender = function(tx) {
  let category = tx.category || tx.type;
  if (category === 'send' ||
      category === 'sent') {
    return (
      <span className="label label-danger">
        <i className="icon fa-arrow-circle-left"></i> <span>{ translate('DASHBOARD.OUT') }</span>
      </span>
    );
  } else if (
    category === 'receive' ||
    category === 'received'
  ) {
    return (
      <span className="label label-success">
        <i className="icon fa-arrow-circle-right"></i> <span>{ translate('DASHBOARD.IN') } &nbsp; &nbsp;</span>
      </span>
    );
  } else if (category === 'generate') {
    return (
      <span>
        <i className="icon fa-cogs"></i> <span>{ translate('DASHBOARD.MINED') }</span>
      </span>
    );
  } else if (category === 'stake') {
    return (
      <span className="label label-info">
        <span> { translate('DASHBOARD.STAKE') } </span>
      </span>
    );
  } else if (category === 'mint') {
    return (
      <span>
        <i className="icon fa-money"></i> <span>{ translate('DASHBOARD.MINT') }</span>
      </span>
    );
  } else if (category === 'immature') {
    return (
      <span>
        <i className="icon fa-clock-o"></i> <span>{ translate('DASHBOARD.IMMATURE') }</span> <span>{ ' ' + '(' + tx.blockstomaturity + ')'}</span>
      </span>
    );
  } else if (category === 'unknown') {
    return (
      <span>
        <i className="icon fa-meh-o"></i> <span>{ translate('DASHBOARD.UNKNOWN') }</span>
      </span>
    );
  } else if (category === 'self') {
    return (
      <span className="label label-info self-send">
        <span>self</span>
      </span>
    );
  }
};

export const TxAmountRender = function(tx) {
  let _amountNegative;

  if ((tx.category === 'send' ||
      tx.category === 'sent') ||
      (tx.type === 'send' ||
      tx.type === 'sent')) {
    _amountNegative = -1;
  } else {
    _amountNegative = 1;
  }

  if (Config.roundValues) {
    return (
      <span>
        <span data-tip={ tx.amount * _amountNegative }>
          { Math.abs(tx.interest) !== Math.abs(tx.amount) ? (formatValue(tx.amount) * _amountNegative === null ? translate('DASHBOARD.UNKNOWN') : tx.amount * _amountNegative) : '' }
          { tx.interest &&
            <span
              className="tx-interest"
              data-tip={ `${translate('DASHBOARD.SPV_CLAIMED_INTEREST')} ${formatValue(Math.abs(tx.interest))}` }>+{ formatValue(Math.abs(tx.interest)) }</span>
          }
          { tx.interest &&
            <ReactTooltip
              effect="solid"
              className="text-left" />
          }
        </span>
        <ReactTooltip
          effect="solid"
          className="text-left" />
        { tx.vinLen > tx.vinMaxLen &&
          <span>
            <i
              className="icon fa-question tx-history-vin-len-err"
              data-tip={ translate('INDEX.SPV_TX_VIN_COUNT_WARN') }
              data-html={ true }></i>
            <ReactTooltip
              effect="solid"
              className="text-left" />
          </span>
        }
      </span>
    );
  }

  return (
    <span>
      { Math.abs(tx.interest) !== Math.abs(tx.amount) ? (tx.amount * _amountNegative === null ? translate('DASHBOARD.UNKNOWN') : tx.amount * _amountNegative) : '' }
      { tx.interest &&
        <span
          className="tx-interest"
          data-tip={ `${translate('DASHBOARD.SPV_CLAIMED_INTEREST')} ${Math.abs(tx.interest)}` }>+{ Math.abs(tx.interest) }</span>
      }
      { tx.interest &&
        <ReactTooltip
          effect="solid"
          className="text-left" />
      }
      { tx.vinLen > tx.vinMaxLen &&
        <span>
          <i
            className="icon fa-question tx-history-vin-len-err"
            data-tip={ translate('INDEX.SPV_TX_VIN_COUNT_WARN') }
            data-html={ true }></i>
          <ReactTooltip
            effect="solid"
            className="text-left" />
        </span>
      }
    </span>
  );
};

export const TxHistoryListRender = function() {
  return (
    <ReactTable
      data={ this.state.filteredItemsList }
      columns={ this.state.itemsListColumns }
      minRows="0"
      sortable={ true }
      className="-striped -highlight"
      PaginationComponent={ TablePaginationRenderer }
      nextText={ translate('INDEX.NEXT_PAGE') }
      previousText={ translate('INDEX.PREVIOUS_PAGE') }
      showPaginationBottom={ this.state.showPagination }
      pageSize={ this.state.pageSize }
      defaultSortMethod={ this.defaultSorting }
      defaultSorted={[{ // default sort
        id: 'timestamp',
        desc: true,
      }]}
      onPageSizeChange={ (pageSize, pageIndex) => this.onPageSizeChange(pageSize, pageIndex) } />
  );
};

export const WalletsDataRender = function() {
  return (
    <span>
      <div id="edexcoin_dashboardinfo">
        { (this.displayClaimInterestUI() === 777 ||
          this.displayClaimInterestUI() === -777) &&
          <div className="col-xs-12 margin-top-20 backround-gray">
            <div className="panel no-margin">
              <div>
                <div className="col-xlg-12 col-lg-12 col-sm-12 col-xs-12">
                  <div className="panel no-margin padding-top-10 padding-bottom-10 center">
                    { this.displayClaimInterestUI() === 777 &&
                      <div>
                        { translate('DASHBOARD.CLAIM_INTEREST_HELPER_BAR_P1') } <strong>{ this.props.ActiveCoin.balance.interest }</strong> KMD { translate('DASHBOARD.CLAIM_INTEREST_HELPER_BAR_P2') }.
                        <button
                          type="button"
                          className="btn btn-success waves-effect waves-light dashboard-claim-interest-btn"
                          onClick={ this.openClaimInterestModal }>
                          <i className="icon fa-dollar"></i> { translate('DASHBOARD.CLAIM_INTEREST_HELPER_BAR_P3') }
                        </button>
                      </div>
                    }
                    { this.displayClaimInterestUI() === -777 &&
                      <div>
                        { translate('DASHBOARD.CLAIM_INTEREST_HELPER_BAR_ALT_P1') }.
                        <button
                          type="button"
                          className="btn btn-success waves-effect waves-light dashboard-claim-interest-btn"
                          onClick={ this.openClaimInterestModal }>
                          <i className="icon fa-search"></i> { translate('DASHBOARD.CLAIM_INTEREST_HELPER_BAR_ALT_P2') }
                        </button>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        <div className="col-xs-12 margin-top-20 backround-gray">
          <div className="panel nav-tabs-horizontal">
            <div>
              <div className="col-xlg-12 col-lg-12 col-sm-12 col-xs-12">
                <div className="panel">
                  <header className="panel-heading z-index-10">
                    { this.state.loading &&
                      <span className="spinner--small">
                        <Spinner />
                      </span>
                    }
                    { !this.state.loading &&
                      <i
                        className="icon fa-refresh manual-txhistory-refresh pointer"
                        onClick={ this.refreshTxHistory }></i>
                    }
                    <h4 className="panel-title">{ !this.state.kvView ? translate('INDEX.TRANSACTION_HISTORY') : translate('KV.KV_HISTORY') }</h4>
                    { this.props.ActiveCoin.mode === 'spv' &&
                      Config.experimentalFeatures &&
                      kvCoins[this.props.ActiveCoin.coin] &&
                      <button
                        type="button"
                        className="btn btn-default btn-switch-kv"
                        onClick={ this.toggleKvView }>
                        { !this.state.kvView ? translate('KV.KV_VIEW') : translate('KV.TX_VIEW') }
                      </button>
                    }
                  </header>
                  <div className="panel-body">
                    <div className="row padding-bottom-30 padding-top-10">
                      { this.props.ActiveCoin.txhistory !== 'loading' &&
                        this.props.ActiveCoin.txhistory !== 'no data' &&
                        this.props.ActiveCoin.txhistory !== 'connection error' &&
                        this.props.ActiveCoin.txhistory !== 'connection error or incomplete data' &&
                        this.props.ActiveCoin.txhistory !== 'cant get current height' &&
                        !this.state.kvView &&
                          <div className="search-box">
                            <button
                              type="button"
                              className="btn btn-primary waves-effect waves-light col-sm-4"
                              data-tip={ this.state.filterMenuOpen ? translate('FILTER.FILTER_DESC_CONTRACT') : translate('FILTER.FILTER_DESC_EXPAND') }
                              onClick={ this.toggleFilterMenuOpen }>{ translate('FILTER.FILTER_OPTIONS') }</button>
                            <input
                              className="form-control"
                              onChange={ e => this.onSearchTermChange(e.target.value) }
                              placeholder={ translate('DASHBOARD.SEARCH') } />
                          </div>
                      }
                      { this.props.ActiveCoin.txhistory !== 'loading' &&
                        this.props.ActiveCoin.txhistory !== 'connection error' &&
                        this.props.ActiveCoin.txhistory !== 'connection error or incomplete data' &&
                        this.props.ActiveCoin.txhistory !== 'cant get current height' &&
                        (this.props.ActiveCoin.coin === 'VRSC' || this.props.ActiveCoin.coin === 'VERUSTEST') &&
                        <div className="row">
                          <div className="col-sm-4">
                            <button
                              type="button"
                              className={this.props.ActiveCoin.mode === 'spv' ? 'hide' : "btn btn-dark waves-effect waves-light margin-top-5"}
                              data-tip={ this.state.showMiningButton ? translate('DASHBOARD.MINING_DESC_CONTRACT') : translate('DASHBOARD.MINING_DESC_EXPAND') }
                              onClick={ () => this.toggleMiningButton() }><i className="icon fa-cogs"></i>{ this.state.showMiningButton ? translate('DASHBOARD.CONTRACT_MINING') : translate('DASHBOARD.EXPAND_MINING') }</button>
                                <ReactTooltip
                                effect="solid"
                                className="text-left" />
                          </div>
                        </div>
                      }  
                      { this.props.ActiveCoin.txhistory !== 'loading' &&
                        this.props.ActiveCoin.txhistory !== 'connection error' &&
                        this.props.ActiveCoin.txhistory !== 'connection error or incomplete data' &&
                        this.props.ActiveCoin.txhistory !== 'cant get current height' &&
                        this.state.showMiningButton && 
                        this.props.ActiveCoin.mode !== 'spv' &&
                        <MiningButton />
                      }
                      { this.props.ActiveCoin.txhistory !== 'loading' &&
                        this.props.ActiveCoin.txhistory !== 'connection error' &&
                        this.props.ActiveCoin.txhistory !== 'connection error or incomplete data' &&
                        this.props.ActiveCoin.txhistory !== 'cant get current height' &&
                        this.state.filterMenuOpen && 
                        <div className="filter-options-wrapper">
                          <div className="filter-option">
                            <span className = {this.props.ActiveCoin.mode === 'spv' ? 'hide' : "filter-option-child"}>
                              <div>
                              { translate('FILTER.PRIVATE') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterPrivateTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterPrivateTx }></div>
                                </label>
                              </div>
                            </span>
                            <span className = {this.props.ActiveCoin.mode === 'spv' ? 'hide' : "filter-option-child"}>
                              <div>
                              { translate('FILTER.PUBLIC') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterPublicTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterPublicTx }></div>
                                </label>
                              </div>
                            </span>
                            <span className = {this.props.ActiveCoin.mode === 'spv' ? 'hide' : "filter-option-child"}>
                              <div>
                              { translate('FILTER.IMMATURE') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterImmatureTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterImmatureTx }></div>
                                </label>
                              </div>
                            </span>
                            <span className = {this.props.ActiveCoin.mode === 'spv' ? 'hide' : "filter-option-child"}>
                              <div>
                              { translate('FILTER.MATURE') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterMatureTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterMatureTx }></div>
                                </label>
                              </div>
                            </span>
                            <span className = "filter-option-child">
                              <div>
                              { translate('FILTER.SENT') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterSentTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterSentTx }></div>
                                </label>
                              </div>
                            </span>
                            <span className = "filter-option-child">
                              <div>
                              { translate('FILTER.RECEIVED') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterReceivedTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterReceivedTx }></div>
                                </label>
                              </div>
                            </span>
                            <span className = {this.props.ActiveCoin.mode === 'native' ? 'hide' : "filter-option-child"}>
                              <div>
                              { translate('FILTER.SELF') }
                              </div>
                              <div>
                                <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={ this.state.filterSelfTx } />
                                    <div
                                    className="slider"
                                    onClick={ this.toggleFilterSelfTx }></div>
                                </label>
                              </div>
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                    <div className="row">
                      { this.renderTxHistoryList() }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </span>
  );
};