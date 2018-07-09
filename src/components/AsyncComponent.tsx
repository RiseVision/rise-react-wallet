import * as React from 'react';

type Props = {
  // tslint:disable-next-line:no-any
  loading?: React.ReactElement<any>;
  resolve(): Promise<{}>;
  // tslint:disable-next-line:no-any
  render(components: {}): React.ReactElement<any>;
};

type State = {
  components?: {};
};

export default class AsyncComponent extends React.Component<Props, State> {
  components: {};

  constructor(props: Props) {
    super(props);
    props.resolve().then(components => this.onLoaded(components));
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
