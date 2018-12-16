import React from 'react';
import { connect } from 'react-redux';
import translate from '../../../translate/translate';
import { 
  getMiningInfo,
  setGenerate
} from '../../../actions/actionCreators';
import Store from '../../../store';
import ReactTooltip from 'react-tooltip';

class MiningButton extends React.Component {
  constructor() {
    super();
    this.state = {
      numThreadsGUI: 0,
      cliResponse: null,
      isMining: false,
      isStaking: false,
      localHps: 0,
      numThreadsCli: null,
      loading: false,
      firstTime: true
    };
  }

  componentDidMount() {
    this.updateMiningStatus();
    this.intervalUpdate = setInterval(() => this.updateMiningStatus(), 15000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalUpdate);
  }

  // TODO: rerender only if prop is changed
  updateMiningStatus() {
    getMiningInfo(this.props.ActiveCoin.coin)
    .then(json => {
      this.updateMining(json);
    });
  }

  updateMining(_cliResponse){
    this.setState({
      isMining: _cliResponse.generate,
      numThreadsCli: _cliResponse.genproclimit,
      localHps: _cliResponse.localhashps,
      isStaking: _cliResponse.staking
    }, () => {
      this.updateNumThreadsGUI(this.state.numThreadsCli);
    });
  }

  startMining(_numThreads) {
    if (_numThreads === 'stake') {
      _numThreads = 0;
    }
    else if (Number(_numThreads) <= 0) {
      _numThreads = 1;
    }
    
    setGenerate(this.props.ActiveCoin.coin, true, Number(_numThreads))
    .then(result => {
      return getMiningInfo(this.props.ActiveCoin.coin);
    })
    .then(json => {
      this.updateMining(json);
    });
  }

  updateGenerate(_numThreads) {
    if (Number(_numThreads) == 0) {
      this.stopMining();
    }
    else {
      this.startMining(_numThreads);
    }
  }

  stopMining() {
    const wasStaking = this.state.isStaking;
    setGenerate(this.props.ActiveCoin.coin, false, 0)
    .then(() => {
      if (wasStaking) {
        return this.startMining('stake');
      }
      else {
        return true;
      }
    })
    .then(() => {
      return getMiningInfo(this.props.ActiveCoin.coin);
    })
    .then(json => {
      this.updateMining(json);
    });
  }

  startStaking() {
    this.startMining('stake');
  }

  stopStaking() {
    const threads = this.state.numThreadsGUI;
    setGenerate(this.props.ActiveCoin.coin, false, 0)
    .then(() => {
      if (threads > 0) {
        return setGenerate(this.props.ActiveCoin.coin, true, threads)
      }
      else {
        return true;
      }
    })
    .then(() => {
      return getMiningInfo(this.props.ActiveCoin.coin);
    })
    .then(json => {
      this.updateMining(json);
    });
  }

  updateInput = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  updateNumThreadsGUI(_numThreads){
    this.setState({
      numThreadsGUI: _numThreads,
      firstTime: false
    });
  }

  render() {
    if ((this.props.ActiveCoin.coin === 'VRSC' || this.props.ActiveCoin.coin === 'VERUSTEST')){
    return (
      <div className="row">
        <div className="col-sm-5">
        <div>
          <div>
            <strong>{ translate('INDEX.MINING_INFO') }</strong>
          </div>
          <div>
            {
              this.state.loading ? translate('INDEX.LOADING_MINING_INFO') :
              (translate('INDEX.MINING_STATUS')) + ' ' + 
                (this.state.isMining ? translate('INDEX.TRUE') : translate('INDEX.FALSE'))
            }
          </div>
          <div>
            {
              this.state.loading ? translate('INDEX.LOADING_MINING_INFO') :
              (translate('INDEX.STAKING_STATUS')) + ' ' + 
                (this.state.isStaking ? translate('INDEX.TRUE') : translate('INDEX.FALSE'))
            }
          </div>
          <div>
            { this.state.loading ? translate('INDEX.LOADING_MINING_INFO') : ((translate('INDEX.MINING_HPS')) + ' ' + (this.state.isMining ? Number(this.state.localHps / 1000000).toFixed(3) : '0'))}
          </div>
      </div>
      <div className="row">
        <div className="col-sm-4">
            <div>
              { translate('INDEX.INPUT_THREADS') }
              <input
                name="numThreadsGUI"
                id="threads"
                type="number"
                disabled={ this.state.loading }
                min="0"
                className="form-control stakemineinput"
                data-tip={ translate('INDEX.THREADS_DESC') }
                value={ this.state.numThreadsGUI }
                onChange={ this.updateInput }/>
                <ReactTooltip
                    effect="solid"
                    className="text-left" />
            <button
                type="button"
                className="btn btn-primary waves-effect waves-light margin-top-5 stakemineinput"
                disabled={this.state.loading}
                onClick={ 
                  !this.state.isMining ? (() => this.startMining(this.state.numThreadsGUI)) : 
                    !(this.state.numThreadsCli != this.state.numThreadsGUI) ? () => this.stopMining() : 
                      () => this.updateGenerate(this.state.numThreadsGUI) 
                    }>
                      {this.state.loading ? translate('INDEX.LOADING_MINING_INFO') :
                        !this.state.isMining ? translate('INDEX.START_MINING') :
                          this.state.numThreadsCli != this.state.numThreadsGUI ? translate('INDEX.UPDATE_MINING') :
                            translate('INDEX.STOP_MINING')}
                            </button>            
            <button
                type="button"
                className="btn btn-primary waves-effect waves-light margin-top-5 stakemineinput"
                disabled={this.state.loading}
                onClick={ 
                  !this.state.isStaking ? (() => this.startStaking()) : 
                      () => this.stopStaking() 
                    }>
                      {this.state.loading ? translate('INDEX.LOADING_MINING_INFO') :
                        !this.state.isStaking ? translate('INDEX.START_STAKING') :
                            translate('INDEX.STOP_STAKING')}
                            </button>
            </div>
            </div>
        </div>
        </div>
      </div>
    );
  }
  else {
    return (<div></div>);
  }
  };
}

const mapStateToProps = (state) => {
  return {
    Main: {
      coins: state.Main.coins,
    },
    Settings: state.Settings,
    ActiveCoin: state.ActiveCoin
  };
};

export default connect(mapStateToProps)(MiningButton);