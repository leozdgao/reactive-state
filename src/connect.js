import { Component } from 'react';
import { LIFECYLE_DID_MOUNT } from './intentTypes';

const defaultMapStateToProps = i => i;

export default function connect(store, mapStateToProps = defaultMapStateToProps) {
  return BaseComponent => {
    class ConnectedComponent extends Component {
      constructor(props, context) {
        super(props, context);

        this.currentState = store.getState();
        this.state = mapStateToProps(this.currentState);
      }

      componentWillMount() {
        store.subscribe((nextState) => {
          if (this.currentState === nextState) {
            return;
          }

          const nextStateToCommit = mapStateToProps(nextState);
          if (this.state !== nextStateToCommit) {
            this.setState(nextStateToCommit);
          }
        });
      }

      componentDidMount() {
        store.dispatch(LIFECYLE_DID_MOUNT);
      }

      render() {
        return <BaseComponent {...this.props} {...this.state}
          dispatch={store.dispatch} commit={store.commit} provide={store.provide} />;
      }
    }

    return ConnectedComponent;
  };
}
