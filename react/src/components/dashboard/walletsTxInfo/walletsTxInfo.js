import React from 'react';
import { connect } from 'react-redux';
import { translate } from '../../../translate/translate';
import { sortByDate } from '../../../util/sort';
import { toggleDashboardTxInfoModal } from '../../../actions/actionCreators';
import Store from '../../../store';
import WalletsTxInfoRender from './walletsTxInfo.render';

class WalletsTxInfo extends React.Component {
  constructor() {
    super();
    this.state = {
      activeTab: 0,
    };
    this.toggleTxInfoModal = this.toggleTxInfoModal.bind(this);
  }

  toggleTxInfoModal() {
    Store.dispatch(toggleDashboardTxInfoModal(false));

    this.setState(Object.assign({}, this.state, {
      activeTab: 0,
    }));
  }

  openTab(tab) {
    this.setState(Object.assign({}, this.state, {
      activeTab: tab,
    }));
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.toggleTxInfoModal();
    }
  }

  openExplorerWindow(txid) {
    const url = 'http://' + this.props.ActiveCoin.coin + '.explorer.supernet.org/tx/' + txid;
    const remote = window.require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;

    const externalWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      title: `${translate('INDEX.LOADING')}...`,
      icon: remote.getCurrentWindow().iguanaIcon,
      webPreferences: {
        "nodeIntegration": false
      },
    });

    externalWindow.loadURL(url);
    externalWindow.webContents.on('did-finish-load', function() {
      setTimeout(function() {
        externalWindow.show();
      }, 40);
    });
  }

  render() {
    if (this.props &&
        this.props.ActiveCoin.showTransactionInfo &&
        // TODO the conditions below should be merged once the native mode components are fully merged
        // into the rest of the components
        this.props.ActiveCoin.activeSection === 'default') {
      const txInfo = sortByDate(this.props.ActiveCoin.txhistory)[this.props.ActiveCoin.showTransactionInfoTxIndex];
      return WalletsTxInfoRender.call(this, txInfo);
    }

    return null;
  }
}

const mapStateToProps = (state) => {
  return {
    ActiveCoin: {
      mode: state.ActiveCoin.mode,
      coin: state.ActiveCoin.coin,
      txhistory: state.ActiveCoin.txhistory,
      showTransactionInfo: state.ActiveCoin.showTransactionInfo,
      activeSection: state.ActiveCoin.activeSection,
      activeAddress: state.ActiveCoin.activeAddress,
      showTransactionInfoTxIndex: state.ActiveCoin.showTransactionInfoTxIndex,
    },
  };
};

export default connect(mapStateToProps)(WalletsTxInfo);
