import * as React from 'react';

type Props = {
  name: string;
  // tslint:disable-next-line:no-any
  loading?: React.ReactElement<any>;
  resolve(): Promise<{}>;
  // tslint:disable-next-line:no-any
  render(components: {}): React.ReactElement<any>;
};

type State = {
  name?: string;
  components?: {};
};

export default class AsyncComponent extends React.Component<Props, State> {
  components: {};

  constructor(props: Props) {
    super(props);
    this.state = { name: props.name };
    props.resolve().then(components => this.onLoaded(components));
  }

  // TODO perform this check in render
  UNSAFE_componentWillUpdate(nextProps: Props, nextState: State) {
    // new component bundle
    if (this.props.name !== nextProps.name) {
      delete nextState.components;
      nextProps.resolve().then(components => this.onLoaded(components));
    }
  }

  onLoaded(components: {}) {
    this.setState({ components });
  }

  render() {
    if (this.state && this.state.components) {
      return this.props.render(this.state.components);
    } else if (this.props.loading) {
      return this.props.loading;
    }
    return <span />;
  }
}
