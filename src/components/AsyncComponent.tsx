import { inject, observer } from 'mobx-react';
import * as React from 'react';
import LangStore from '../stores/lang';

type Props = {
  langStore?: LangStore;
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

@inject('langStore')
@observer
export default class AsyncComponent extends React.Component<Props, State> {
  components: {};
  componentMounted = false;

  constructor(props: Props) {
    super(props);
    this.state = { name: props.name };
    props.resolve().then(components => {
      if (this.componentMounted) {
        this.onLoaded(components);
      }
    });
  }

  // TODO perform this check in render
  UNSAFE_componentWillUpdate(nextProps: Props, nextState: State) {
    // new component bundle
    if (this.props.name !== nextProps.name) {
      delete nextState.components;
      nextProps.resolve().then(components => this.onLoaded(components));
    }
  }

  componentDidMount() {
    this.componentMounted = true;
  }

  componentWillUnmount() {
    this.componentMounted = false;
  }

  onLoaded(components: {}) {
    this.setState({ components });
  }

  render() {
    const langStore = this.props.langStore!;
    const translationsLoaded = langStore.translations.get(langStore.locale);
    if (translationsLoaded && this.state && this.state.components) {
      return this.props.render(this.state.components);
    } else if (this.props.loading) {
      return this.props.loading;
    } else {
      return null;
    }
  }
}
