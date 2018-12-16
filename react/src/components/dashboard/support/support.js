import React from 'react';
import translate from '../../../translate/translate';

const { shell } = window.require('electron');

class Support extends React.Component {
  constructor() {
    super();
  }

  openExternalWindow(url) {
    return shell.openExternal(url);
  }

  render() {
    return (
      <div className="page margin-left-0">
        <div className="page-content">
          <h2>{ translate('SETTINGS.SUPPORT') }</h2>
          <div className="row">
            <div className="col-sm-12 no-padding-left">
              <div className="support-box-wrapper">
                <div
                  className="support-box"
                  onClick={ () => this.openExternalWindow('https://discord.gg/rSG82Wb') }>
                  <img
                    src="assets/images/cryptologo/vrsc.png"
                    alt={ translate('SETTINGS.SUPPORT_TICKETS') } />
                  <div className="support-box-title">{ translate('SETTINGS.SUPPORT_TICKETS') }</div>
                  <div className="support-box-link">https://discord.gg/rSG82Wb</div>
                </div>
              </div>
              <div className="support-box-wrapper">
                <div
                  className="support-box"
                  onClick={ () => this.openExternalWindow('https://github.com/VerusCoin/Agama') }>
                  <img
                    src="assets/images/support/github-icon.png"
                    alt="Github" />
                  <div className="support-box-title">Github</div>
                  <div className="support-box-link">github.com/VerusCoin/Agama</div>
                </div>
              </div>
            </div>
          </div>
          <div className="row margin-top-30">
            <div className="col-sm-12">
              <p>
                { translate('SUPPORT.FOR_GUIDES') } <a className="pointer" onClick={ () => this.openExternalWindow('https://github.com/VerusCoin/VerusCoin/wiki') }>https://github.com/VerusCoin/VerusCoin/wiki</a>
              </p>
              <p>
                { translate('SUPPORT.ELECTRUM_SERVICES') } <a className="pointer" onClick={ () => this.openExternalWindow('https://0x03.services/') }>https://0x03.services/</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Support;