import React from 'react';
import translate from '../../../translate/translate';

const { shell } = window.require('electron');

class About extends React.Component {
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
          <h2>{ translate('ABOUT.ABOUT_VERUS_AGAMA') }</h2>
          <p>{ translate('ABOUT.AGAMA_MODES') }</p>
          <ul>
            <li>
              <span className="font-weight-600">{ translate('INDEX.NATIVE_MODE') }</span>:&nbsp;
              { translate('ABOUT.NATIVE_MODE_DESC') }
            </li>
            <li>
              <span className="font-weight-600">{ translate('INDEX.SPV_MODE') }</span>:&nbsp;
              { translate('ADD_COIN.LITE_MODE_DESC') }
            </li>
          </ul>
          <br />

          <span className="font-weight-600">{ translate('ABOUT.AGAMA_NOTE') }</span>

          <br /><br />

          <div className="font-weight-600">{ translate('ABOUT.TESTERS') }</div>
          { translate('ABOUT.TESTERS_P1') } <a className="link" onClick={ () => this.openExternalWindow('https://veruscoin.io') }>{ translate('ABOUT.TESTERS_P2') }</a>. 
          { translate('ABOUT.TESTERS_P4') }

          <br /><br />

          { translate('ABOUT.AGAMA_DAPPS') }
          <ul>
            <li>
              <span className="font-weight-600">Jumblr</span>: { translate('ABOUT.JUMBLR_DESC') }
            </li>
            <li>
              <span className="font-weight-600">BarterDEX</span>: { translate('ABOUT.BARTER_DEX_DESC_ALT') }
            </li>
          </ul>

          <br /><br />

          { translate('ABOUT.SPECIAL_THANKS_P1') } <a className="link" onClick={ () => this.openExternalWindow('https://discord.gg/rSG82Wb') }>{translate('ABOUT.SPECIAL_THANKS_P2')}</a> {translate('ABOUT.SPECIAL_THANKS_P3')}
        </div>
      </div>
    );
  }
}

export default About;